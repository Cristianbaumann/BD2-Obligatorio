import unicodedata

from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import IntegrityError

from dependencies.auth import require_admin
from database import get_db
from schemas.evento import EventoCreate, EventoOut, EventoSectorItem, EventoSectorOut, EventoRichOut, SectorDisponibilidadOut

router = APIRouter(prefix="/eventos", tags=["eventos"])


def _norm(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()


def _get_admin_pais_sede(db, mail: str) -> str:
    db.execute(
        """
        SELECT pais_sede
        FROM Admin
        WHERE usuario_mail = %s
        """,
        (mail,),
    )
    admin_row = db.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")
    return admin_row["pais_sede"]



@router.get("/", response_model=list[EventoRichOut])
def list_eventos(db=Depends(get_db)):
    db.execute(
        """
        SELECT
            e.id,
            e.fecha,
            e.cancelado,
            eq_local.nombre  AS equipo_local,
            eq_visit.nombre  AS equipo_visitante,
            est.nombre       AS estadio,
            (SELECT MIN(es2.costo)
               FROM EventoSector es2
              WHERE es2.evento_id = e.id)                              AS precio_minimo,
            (SELECT SUM(s2.capacidad)
               FROM EventoSector es2
               JOIN Sector s2 ON s2.id = es2.sector_id
              WHERE es2.evento_id = e.id)                              AS capacidad,
            (SELECT SUM(s2.capacidad)
               FROM EventoSector es2
               JOIN Sector s2 ON s2.id = es2.sector_id
              WHERE es2.evento_id = e.id)
            - (SELECT COUNT(*) FROM Entrada ent2
               WHERE ent2.evento_id = e.id)                            AS entradas_disponibles
        FROM Evento e
        JOIN Equipo  eq_local ON eq_local.id = e.equipo_local_id
        JOIN Equipo  eq_visit ON eq_visit.id = e.equipo_visitante_id
        JOIN Estadio est      ON est.dir_pais      = e.estadio_pais
                             AND est.dir_localidad = e.estadio_localidad
                             AND est.dir_calle     = e.estadio_calle
                             AND est.dir_numero    = e.estadio_numero
        ORDER BY e.fecha
        """
    )
    return db.fetchall()


@router.post(
    "/",
    response_model=EventoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo evento",
    description="Crea un nuevo evento. Solo administradores pueden crear eventos en estadios de su jurisdicción.",
)
def create_evento(
    evento: EventoCreate,
    db=Depends(get_db),
    admin=Depends(require_admin),
):
    """Crear un nuevo evento con validaciones de admin y jurisdicción."""
    pais_sede = _get_admin_pais_sede(db, admin["mail"])
    if _norm(pais_sede) != _norm(evento.estadio_pais):
        raise HTTPException(
            status_code=403,
            detail="El admin solo puede crear eventos en estadios de su jurisdicción",
        )

    try:
        db.execute(
            """
            INSERT INTO Evento (
                fecha, equipo_local_id, equipo_visitante_id,
                estadio_pais, estadio_localidad, estadio_calle, estadio_numero
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                evento.fecha,
                evento.equipo_local_id,
                evento.equipo_visitante_id,
                evento.estadio_pais,
                evento.estadio_localidad,
                evento.estadio_calle,
                evento.estadio_numero,
            ),
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un evento en ese estadio para esa fecha y hora",
        ) from exc

    db.execute(
        """
        SELECT id, fecha, equipo_local_id, equipo_visitante_id,
        estadio_pais, estadio_localidad, estadio_calle, estadio_numero
        FROM Evento
        WHERE fecha = %s
        AND equipo_local_id = %s
        AND equipo_visitante_id = %s
        AND estadio_pais = %s
        AND estadio_localidad = %s
        AND estadio_calle = %s
        AND estadio_numero = %s
        ORDER BY id DESC
        LIMIT 1
        """,
        (
            evento.fecha,
            evento.equipo_local_id,
            evento.equipo_visitante_id,
            evento.estadio_pais,
            evento.estadio_localidad,
            evento.estadio_calle,
            evento.estadio_numero,
        ),
    )
    nuevo_evento = db.fetchone()

    if evento.sectores:
        for s in evento.sectores:
            db.execute(
                "INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES (%s, %s, %s)",
                (nuevo_evento["id"], s.sector_id, s.costo),
            )

    return nuevo_evento


@router.get(
    "/{id}/disponibilidad",
    response_model=list[SectorDisponibilidadOut],
    summary="Disponibilidad de sectores para un evento",
    description="Retorna cada sector habilitado con su capacidad total y entradas disponibles.",
)
def get_evento_disponibilidad(id: str, db=Depends(get_db)):
    db.execute(
        """
        SELECT
            es.sector_id,
            s.nombre,
            es.costo,
            s.capacidad AS total,
            s.capacidad - COUNT(ent.id) AS disponibles
        FROM EventoSector es
        JOIN Sector s ON s.id = es.sector_id
        LEFT JOIN Entrada ent ON ent.evento_id = es.evento_id
                              AND ent.sector_id = es.sector_id
                              AND EXISTS (
                                  SELECT 1 FROM Venta v
                                  WHERE v.id = ent.venta_id
                                    AND NOT (v.estado_id = 1 AND v.fecha < NOW() - INTERVAL 15 MINUTE)
                              )
        WHERE es.evento_id = %s
        GROUP BY es.sector_id, s.nombre, es.costo, s.capacidad
        """,
        (id,),
    )
    return db.fetchall()


@router.get(
    "/{id}",
    response_model=EventoRichOut,
    summary="Obtener evento por ID",
    description="Obtiene los detalles de un evento específico por su ID.",
)
def get_evento(id: str, db=Depends(get_db)):
    db.execute(
        """
        SELECT
            e.id,
            e.fecha,
            e.cancelado,
            eq_local.nombre  AS equipo_local,
            eq_visit.nombre  AS equipo_visitante,
            est.nombre       AS estadio,
            (SELECT MIN(es2.costo)
               FROM EventoSector es2
              WHERE es2.evento_id = e.id)                              AS precio_minimo,
            (SELECT SUM(s2.capacidad)
               FROM EventoSector es2
               JOIN Sector s2 ON s2.id = es2.sector_id
              WHERE es2.evento_id = e.id)                              AS capacidad,
            (SELECT SUM(s2.capacidad)
               FROM EventoSector es2
               JOIN Sector s2 ON s2.id = es2.sector_id
              WHERE es2.evento_id = e.id)
            - (SELECT COUNT(*) FROM Entrada ent2
               WHERE ent2.evento_id = e.id)                            AS entradas_disponibles
        FROM Evento e
        JOIN Equipo  eq_local ON eq_local.id = e.equipo_local_id
        JOIN Equipo  eq_visit ON eq_visit.id = e.equipo_visitante_id
        JOIN Estadio est      ON est.dir_pais      = e.estadio_pais
                             AND est.dir_localidad = e.estadio_localidad
                             AND est.dir_calle     = e.estadio_calle
                             AND est.dir_numero    = e.estadio_numero
        WHERE e.id = %s
        """,
        (id,),
    )
    evento = db.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento


@router.put(
    "/{id}",
    response_model=EventoOut,
    summary="Actualizar evento",
    description="Actualiza un evento existente. Solo administradores pueden modificar eventos de su jurisdicción.",
)
def update_evento(
    id: str,
    evento: EventoCreate,
    db=Depends(get_db),
    admin=Depends(require_admin),
):
    """Actualizar un evento existente con validaciones de admin y jurisdicción."""
    pais_sede = _get_admin_pais_sede(db, admin["mail"])

    db.execute(
        """
        SELECT estadio_pais
        FROM Evento
        WHERE id = %s
        """,
        (id,),
    )
    evento_actual = db.fetchone()
    if not evento_actual:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if _norm(evento_actual["estadio_pais"]) != _norm(pais_sede) or _norm(evento.estadio_pais) != _norm(pais_sede):
        raise HTTPException(
            status_code=403,
            detail="El admin no puede modificar eventos fuera de su jurisdicción",
        )

    try:
        db.execute(
            """
            UPDATE Evento
            SET fecha = %s,
                equipo_local_id = %s,
                equipo_visitante_id = %s,
                estadio_pais = %s,
                estadio_localidad = %s,
                estadio_calle = %s,
                estadio_numero = %s
            WHERE id = %s
            """,
            (
                evento.fecha,
                evento.equipo_local_id,
                evento.equipo_visitante_id,
                evento.estadio_pais,
                evento.estadio_localidad,
                evento.estadio_calle,
                evento.estadio_numero,
                id,
            ),
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un evento en ese estadio para esa fecha y hora",
        ) from exc

    if evento.sectores is not None:
        db.execute("DELETE FROM EventoSector WHERE evento_id = %s", (id,))
        for s in evento.sectores:
            db.execute(
                "INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES (%s, %s, %s)",
                (id, s.sector_id, s.costo),
            )

    db.execute(
        """
        SELECT id, fecha, equipo_local_id, equipo_visitante_id,
        estadio_pais, estadio_localidad, estadio_calle, estadio_numero
        FROM Evento
        WHERE id = %s
        """,
        (id,),
    )
    return db.fetchone()


@router.delete(
    "/{id}",
    summary="Eliminar evento",
    description="Elimina un evento. Solo administradores pueden eliminar eventos de su jurisdicción.",
)
def delete_evento(id: str, db=Depends(get_db), admin=Depends(require_admin)):
    """Eliminar un evento existente con validaciones de admin y jurisdicción."""
    pais_sede = _get_admin_pais_sede(db, admin["mail"])

    db.execute(
        """
        SELECT estadio_pais
        FROM Evento
        WHERE id = %s
        """,
        (id,),
    )
    evento = db.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if _norm(evento["estadio_pais"]) != _norm(pais_sede):
        raise HTTPException(
            status_code=403,
            detail="El admin no puede borrar eventos fuera de su jurisdicción",
        )

    db.execute("SELECT COUNT(*) AS total FROM Entrada WHERE evento_id = %s", (id,))
    if db.fetchone()["total"] > 0:
        raise HTTPException(
            status_code=409,
            detail="El evento tiene entradas emitidas y no puede eliminarse",
        )

    db.execute(
        """
        DELETE FROM Evento
        WHERE id = %s
        """,
        (id,),
    )
    return {"detail": "Evento eliminado"}


@router.post(
    "/{id}/sectores",
    response_model=list[EventoSectorOut],
    status_code=status.HTTP_201_CREATED,
    summary="Asociar sectores a evento",
    description="Asocia uno o más sectores del estadio al evento. Cada (evento, sector) habilitado permite la venta de entradas. Solo administradores de la jurisdicción correspondiente.",
)
def add_evento_sectores(
    id: str,
    sectores: list[EventoSectorItem],
    db=Depends(get_db),
    admin=Depends(require_admin),
):
    """Asociar sectores a un evento con validaciones de jurisdicción y pertenencia."""
    if not sectores:
        raise HTTPException(status_code=400, detail="Debe enviar al menos un sector")

    sector_ids = [s.sector_id for s in sectores]
    if len(set(sector_ids)) != len(sector_ids):
        raise HTTPException(status_code=400, detail="No se permiten sectores repetidos en el payload")

    pais_sede = _get_admin_pais_sede(db, admin["mail"])

    db.execute(
        """
        SELECT estadio_pais, estadio_localidad, estadio_calle, estadio_numero
        FROM Evento
        WHERE id = %s
        """,
        (id,),
    )
    evento = db.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if _norm(evento["estadio_pais"]) != _norm(pais_sede):
        raise HTTPException(
            status_code=403,
            detail="El admin no puede asociar sectores a eventos fuera de su jurisdicción",
        )

    for item in sectores:
        db.execute(
            """
            SELECT id
            FROM Sector
            WHERE id = %s
            AND estadio_pais = %s
            AND estadio_localidad = %s
            AND estadio_calle = %s
            AND estadio_numero = %s
            """,
            (
                item.sector_id,
                evento["estadio_pais"],
                evento["estadio_localidad"],
                evento["estadio_calle"],
                evento["estadio_numero"],
            ),
        )
        if not db.fetchone():
            raise HTTPException(
                status_code=400,
                detail=f"El sector {item.sector_id} no pertenece al estadio del evento",
            )

    try:
        for item in sectores:
            db.execute(
                """
                INSERT INTO EventoSector (evento_id, sector_id, costo)
                VALUES (%s, %s, %s)
                """,
                (id, item.sector_id, item.costo),
            )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Uno o más sectores ya estaban asociados al evento",
        ) from exc

    return [
        {"evento_id": id, "sector_id": item.sector_id, "costo": item.costo}
        for item in sectores
    ]


@router.delete(
    "/{id}/sectores/{sector_id}",
    summary="Deshabilitar sector en un evento",
    description="Elimina la asociación de un sector con un evento, siempre y cuando no se hayan vendido entradas para ese sector en ese evento. Solo administradores de la jurisdicción.",
)
def remove_evento_sector(
    id: str,
    sector_id: int,
    db=Depends(get_db),
    admin=Depends(require_admin),
):
    """Deshabilitar un sector de un evento con validaciones de jurisdicción y ventas previas."""
    pais_sede = _get_admin_pais_sede(db, admin["mail"])

    # 1. Verificar existencia del evento y jurisdicción
    db.execute(
        "SELECT estadio_pais FROM Evento WHERE id = %s",
        (id,),
    )
    evento = db.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if _norm(evento["estadio_pais"]) != _norm(pais_sede):
        raise HTTPException(
            status_code=403,
            detail="El admin no puede modificar eventos fuera de su jurisdicción",
        )

    # 2. Validar que no existan entradas vendidas para este sector en este evento
    db.execute(
        """
        SELECT COUNT(*) as total
        FROM Entrada
        WHERE evento_id = %s AND sector_id = %s
        """,
        (id, sector_id),
    )
    check_ventas = db.fetchone()
    if check_ventas and check_ventas["total"] > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede deshabilitar el sector porque ya existen entradas vendidas",
        )

    # 3. Eliminar la asociación
    db.execute(
        "DELETE FROM EventoSector WHERE evento_id = %s AND sector_id = %s",
        (id, sector_id),
    )

    return {"detail": f"Sector {sector_id} deshabilitado para el evento {id}"}


@router.patch(
    "/{id}/cancelar",
    summary="Cancelar evento y reembolsar entradas",
    description="Marca el evento como cancelado y acredita el saldo de cada comprador. Solo admins de la jurisdicción.",
)
def cancelar_evento(id: str, db=Depends(get_db), admin=Depends(require_admin)):
    pais_sede = _get_admin_pais_sede(db, admin["mail"])

    db.execute("SELECT estadio_pais, cancelado FROM Evento WHERE id = %s", (id,))
    evento = db.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if _norm(evento["estadio_pais"]) != _norm(pais_sede):
        raise HTTPException(status_code=403, detail="El admin no puede cancelar eventos fuera de su jurisdicción")
    if evento["cancelado"]:
        raise HTTPException(status_code=409, detail="El evento ya está cancelado")

    db.execute("UPDATE Evento SET cancelado = TRUE WHERE id = %s", (id,))

    # Reembolsar a cada usuario: costo de sus entradas * (1 + tasa_comision)
    db.execute(
        """
        SELECT ent.titular_mail,
               SUM(ent.costo * (1 + v.tasa_comision)) AS reembolso
        FROM Entrada ent
        JOIN Venta v ON v.id = ent.venta_id
        WHERE ent.evento_id = %s
          AND v.estado_id IN (
              SELECT id FROM Estado WHERE descripcion IN ('PAGA', 'CONFIRMADA')
          )
        GROUP BY ent.titular_mail
        """,
        (id,),
    )
    afectados = db.fetchall()

    total_reembolsado = 0.0
    for row in afectados:
        db.execute(
            "UPDATE UsuarioFinal SET saldo = saldo + %s WHERE usuario_mail = %s",
            (row["reembolso"], row["titular_mail"]),
        )
        total_reembolsado += float(row["reembolso"])

    return {
        "cancelado": True,
        "usuarios_reembolsados": len(afectados),
        "total_reembolsado": round(total_reembolsado, 2),
    }
