from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import IntegrityError
import traceback

from core.security import require_admin
from database import get_db
from schemas.evento import EventoCreate, EventoOut, EventoSectorItem, EventoSectorOut

router = APIRouter(prefix="/eventos", tags=["eventos"])


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



@router.get("/")
def list_eventos(db=Depends(get_db)):
    print("ENTRE A list_eventos")
    try:
        query = """
            SELECT id, fecha, equipo_local_id, equipo_visitante_id,
                   estadio_pais, estadio_localidad,
                   estadio_calle, estadio_numero
            FROM Evento
            ORDER BY fecha
        """

        print("Ejecutando consulta...")
        db.execute(query)

        result = db.fetchall()

        print("Resultado obtenido:")
        print(result)

        return result

    except Exception as e:
        print("ERROR EN list_eventos:")
        print(type(e).__name__)
        print(str(e))
        raise


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
    if pais_sede != evento.estadio_pais:
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
    return db.fetchone()


@router.get(
    "/{id}",
    response_model=EventoOut,
    summary="Obtener evento por ID",
    description="Obtiene los detalles de un evento específico por su ID.",
)
def get_evento(id: str, db=Depends(get_db)):
    """Obtener los detalles de un evento específico."""
    db.execute(
        """
        SELECT id, fecha, equipo_local_id, equipo_visitante_id,
        estadio_pais, estadio_localidad, estadio_calle, estadio_numero
        FROM Evento
        WHERE id = %s
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

    if evento_actual["estadio_pais"] != pais_sede or evento.estadio_pais != pais_sede:
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

    if evento["estadio_pais"] != pais_sede:
        raise HTTPException(
            status_code=403,
            detail="El admin no puede borrar eventos fuera de su jurisdicción",
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

    if evento["estadio_pais"] != pais_sede:
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
