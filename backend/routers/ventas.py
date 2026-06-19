import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from database import get_db
from dependencies.auth import get_current_user, require_admin
from schemas.venta import VentaCreate, VentaOut, VentaEstadoUpdate, EntradaOut

router = APIRouter(prefix="/ventas", tags=["ventas"])

CART_TTL_MINUTES = 15


def _cleanup_expired(db):
    try:
        db.execute(
            """DELETE e FROM Entrada e
               JOIN Venta v ON v.id = e.venta_id
               WHERE v.estado_id = 1 AND v.fecha < NOW() - INTERVAL %s MINUTE""",
            (CART_TTL_MINUTES,),
        )
        db.execute(
            "DELETE FROM Venta WHERE estado_id = 1 AND fecha < NOW() - INTERVAL %s MINUTE",
            (CART_TTL_MINUTES,),
        )
    except Exception:
        pass


@router.post(
    "/",
    response_model=VentaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una venta",
    description="Crea una venta con 1-5 entradas. Requiere autenticación e identidad verificada.",
)
def create_venta(
    body: VentaCreate,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    _cleanup_expired(db)

    db.execute(
        "SELECT estado_verificacion FROM UsuarioFinal WHERE usuario_mail = %s",
        (user["mail"],),
    )
    uf = db.fetchone()
    if not uf or uf["estado_verificacion"] != "VERIFICADO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Identidad no verificada",
        )

    # Check for existing active cart (PENDIENTE, not expired)
    db.execute(
        """SELECT id, tasa_comision FROM Venta
           WHERE usuario_mail = %s AND estado_id = 1
             AND fecha > NOW() - INTERVAL %s MINUTE
           ORDER BY fecha DESC LIMIT 1""",
        (user["mail"], CART_TTL_MINUTES),
    )
    existing = db.fetchone()

    if existing:
        db.execute("SELECT COUNT(*) as cnt FROM Entrada WHERE venta_id = %s", (existing["id"],))
        existing_count = db.fetchone()["cnt"]
    else:
        existing_count = 0

    total_nuevas = sum(item.cantidad for item in body.entradas)
    if existing_count + total_nuevas > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo 5 entradas en el carrito (ya tenés {existing_count})",
        )

    items_data = []
    for item in body.entradas:
        if item.cantidad < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cada cantidad debe ser al menos 1")

        db.execute(
            """SELECT es.costo, s.capacidad
               FROM EventoSector es
               JOIN Sector s ON s.id = es.sector_id
               WHERE es.evento_id = %s AND es.sector_id = %s""",
            (item.evento_id, item.sector_id),
        )
        row = db.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sector {item.sector_id} no disponible para evento {item.evento_id}")

        db.execute(
            """SELECT COUNT(*) as vendidas
               FROM Entrada e
               JOIN Venta v ON v.id = e.venta_id
               WHERE e.evento_id = %s AND e.sector_id = %s
                 AND NOT (v.estado_id = 1 AND v.fecha < NOW() - INTERVAL %s MINUTE)""",
            (item.evento_id, item.sector_id, CART_TTL_MINUTES),
        )
        vendidas = db.fetchone()["vendidas"]
        disponibles = row["capacidad"] - vendidas
        if item.cantidad > disponibles:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Disponibilidad insuficiente en sector {item.sector_id}: solicitadas {item.cantidad}, disponibles {disponibles}")

        items_data.append({
            "evento_id": item.evento_id,
            "sector_id": item.sector_id,
            "cantidad": item.cantidad,
            "costo": float(row["costo"]),
        })

    if existing:
        venta_id = existing["id"]
        tasa = float(existing["tasa_comision"])
    else:
        db.execute("SELECT tasa FROM ComisionHistorica WHERE fecha_hasta IS NULL ORDER BY id DESC LIMIT 1")
        comision_row = db.fetchone()
        if not comision_row:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No hay tasa de comisión configurada")
        tasa = float(comision_row["tasa"])
        venta_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO Venta (id, usuario_mail, fecha, estado_id, precio, tasa_comision) VALUES (%s, %s, NOW(), %s, %s, %s)",
            (venta_id, user["mail"], 1, 0, tasa),
        )

    # Insert new entradas
    for item in items_data:
        for _ in range(item["cantidad"]):
            db.execute(
                "INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), venta_id, user["mail"], item["costo"], item["evento_id"], item["sector_id"]),
            )

    # Recalculate precio from ALL entradas (existing + new)
    db.execute("SELECT SUM(costo) as subtotal FROM Entrada WHERE venta_id = %s", (venta_id,))
    subtotal = float(db.fetchone()["subtotal"] or 0)
    precio = round(subtotal * (1 + tasa), 2)
    db.execute("UPDATE Venta SET precio = %s WHERE id = %s", (precio, venta_id))

    db.execute("SELECT fecha FROM Venta WHERE id = %s", (venta_id,))
    ahora = db.fetchone()["fecha"]

    db.execute(
        "SELECT id, venta_id, titular_mail, costo, evento_id, sector_id, consumido FROM Entrada WHERE venta_id = %s",
        (venta_id,),
    )
    entradas = [
        EntradaOut(id=e["id"], venta_id=e["venta_id"], titular_mail=e["titular_mail"],
                   costo=float(e["costo"]), evento_id=e["evento_id"],
                   sector_id=e["sector_id"], consumido=bool(e["consumido"]))
        for e in db.fetchall()
    ]

    return VentaOut(
        id=venta_id,
        usuario_mail=user["mail"],
        fecha=ahora,
        estado_id=1,
        precio=precio,
        tasa_comision=tasa,
        entradas=entradas,
    )


@router.get(
    "/comision",
    summary="Tasa de comisión vigente",
)
def get_comision(db=Depends(get_db)):
    db.execute(
        "SELECT tasa FROM ComisionHistorica WHERE fecha_hasta IS NULL ORDER BY id DESC LIMIT 1"
    )
    row = db.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Sin comisión configurada")
    return {"tasa": float(row["tasa"])}


@router.get(
    "/comision/historial",
    summary="Historial completo de tasas de comisión",
)
def get_comision_historial(db=Depends(get_db), _=Depends(require_admin)):
    db.execute(
        "SELECT id, tasa, fecha_desde, fecha_hasta FROM ComisionHistorica ORDER BY id DESC"
    )
    return db.fetchall()


@router.put(
    "/comision",
    summary="Actualizar tasa de comisión",
    description="Cierra la tasa vigente y abre una nueva. Solo administradores.",
)
def update_comision(body: dict, db=Depends(get_db), _=Depends(require_admin)):
    nueva_tasa = body.get("tasa")
    if nueva_tasa is None or not (0 <= float(nueva_tasa) <= 1):
        raise HTTPException(status_code=422, detail="tasa debe ser un número entre 0 y 1")
    hoy = datetime.now().date().isoformat()
    db.execute(
        "UPDATE ComisionHistorica SET fecha_hasta = %s WHERE fecha_hasta IS NULL",
        (hoy,),
    )
    db.execute(
        "INSERT INTO ComisionHistorica (tasa, fecha_desde, fecha_hasta) VALUES (%s, %s, NULL)",
        (float(nueva_tasa), hoy),
    )
    return {"tasa": float(nueva_tasa), "fecha_desde": hoy}


@router.get(
    "/mis-ventas",
    response_model=list[VentaOut],
    summary="Historial de compras del usuario autenticado",
    description="Retorna todas las ventas del usuario con sus entradas, ordenadas por fecha descendente.",
)
def mis_ventas(
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    db.execute(
        """SELECT id, usuario_mail, fecha, estado_id, precio, tasa_comision
           FROM Venta
           WHERE usuario_mail = %s
           ORDER BY fecha DESC""",
        (user["mail"],),
    )
    ventas_rows = db.fetchall()
    if not ventas_rows:
        return []

    venta_ids = [row["id"] for row in ventas_rows]
    placeholders = ",".join(["%s"] * len(venta_ids))
    db.execute(
        f"""SELECT id, venta_id, titular_mail, costo,
                   evento_id, sector_id, consumido
            FROM Entrada
            WHERE venta_id IN ({placeholders})""",
        venta_ids,
    )
    entradas_rows = db.fetchall()

    entradas_por_venta: dict[str, list[EntradaOut]] = {}
    for e in entradas_rows:
        entradas_por_venta.setdefault(e["venta_id"], []).append(
            EntradaOut(
                id=e["id"],
                venta_id=e["venta_id"],
                titular_mail=e["titular_mail"],
                costo=float(e["costo"]),
                evento_id=e["evento_id"],
                sector_id=e["sector_id"],
                consumido=bool(e["consumido"]),
            )
        )

    return [
        VentaOut(
            id=r["id"],
            usuario_mail=r["usuario_mail"],
            fecha=r["fecha"],
            estado_id=r["estado_id"],
            precio=float(r["precio"]),
            tasa_comision=float(r["tasa_comision"]),
            entradas=entradas_por_venta.get(r["id"], []),
        )
        for r in ventas_rows
    ]


@router.get(
    "/carrito",
    response_model=list[VentaOut],
    summary="Items en el carrito del usuario",
    description="Retorna las ventas PENDIENTE no expiradas con info de evento y sector.",
)
def get_carrito(db=Depends(get_db), user=Depends(get_current_user)):
    db.execute(
        """SELECT id, usuario_mail, fecha, estado_id, precio, tasa_comision,
                  GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), fecha + INTERVAL %s MINUTE)) AS segundos_restantes
           FROM Venta
           WHERE usuario_mail = %s AND estado_id = 1
             AND fecha > NOW() - INTERVAL %s MINUTE
           ORDER BY fecha ASC""",
        (CART_TTL_MINUTES, user["mail"], CART_TTL_MINUTES),
    )
    ventas_rows = db.fetchall()
    if not ventas_rows:
        return []

    venta_ids = [r["id"] for r in ventas_rows]
    placeholders = ",".join(["%s"] * len(venta_ids))
    db.execute(
        f"""SELECT e.id, e.venta_id, e.titular_mail, e.costo,
                   e.evento_id, e.sector_id, e.consumido,
                   CONCAT(eq_l.nombre, ' vs ', eq_v.nombre) AS evento_nombre,
                   s.nombre AS sector_nombre
            FROM Entrada e
            JOIN Venta v   ON v.id = e.venta_id
            JOIN Evento ev ON ev.id = e.evento_id
            JOIN Equipo eq_l ON eq_l.id = ev.equipo_local_id
            JOIN Equipo eq_v ON eq_v.id = ev.equipo_visitante_id
            JOIN Sector s  ON s.id = e.sector_id
            WHERE e.venta_id IN ({placeholders})""",
        venta_ids,
    )
    entradas_rows = db.fetchall()

    entradas_por_venta: dict[str, list[EntradaOut]] = {}
    for e in entradas_rows:
        entradas_por_venta.setdefault(e["venta_id"], []).append(
            EntradaOut(
                id=e["id"], venta_id=e["venta_id"], titular_mail=e["titular_mail"],
                costo=float(e["costo"]), evento_id=e["evento_id"],
                sector_id=e["sector_id"], consumido=bool(e["consumido"]),
                evento_nombre=e["evento_nombre"], sector_nombre=e["sector_nombre"],
            )
        )

    return [
        VentaOut(
            id=r["id"], usuario_mail=r["usuario_mail"], fecha=r["fecha"],
            estado_id=r["estado_id"], precio=float(r["precio"]),
            tasa_comision=float(r["tasa_comision"]),
            segundos_restantes=int(r["segundos_restantes"]),
            entradas=entradas_por_venta.get(r["id"], []),
        )
        for r in ventas_rows
    ]


@router.patch(
    "/{id}/pagar",
    response_model=VentaOut,
    summary="Pagar una venta del carrito",
    description="El usuario paga su propia venta PENDIENTE. Avanza PENDIENTE → CONFIRMADA → PAGA.",
)
def pagar_venta(id: str, db=Depends(get_db), user=Depends(get_current_user)):
    db.execute(
        "SELECT id, usuario_mail, estado_id, fecha, precio, tasa_comision FROM Venta WHERE id = %s",
        (id,),
    )
    venta = db.fetchone()
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    if venta["usuario_mail"] != user["mail"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permiso")
    if venta["estado_id"] != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La venta no está en estado PENDIENTE")

    db.execute(
        "SELECT fecha > NOW() - INTERVAL %s MINUTE AS vigente FROM Venta WHERE id = %s",
        (CART_TTL_MINUTES, id),
    )
    if not db.fetchone()["vigente"]:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="La reserva expiró")

    db.execute("UPDATE Venta SET estado_id = 2 WHERE id = %s", (id,))
    db.execute("UPDATE Venta SET estado_id = 3 WHERE id = %s", (id,))

    db.execute(
        """SELECT id, venta_id, titular_mail, costo, evento_id, sector_id, consumido
           FROM Entrada WHERE venta_id = %s""",
        (id,),
    )
    entradas = [
        EntradaOut(
            id=e["id"], venta_id=e["venta_id"], titular_mail=e["titular_mail"],
            costo=float(e["costo"]), evento_id=e["evento_id"],
            sector_id=e["sector_id"], consumido=bool(e["consumido"]),
        )
        for e in db.fetchall()
    ]

    return VentaOut(
        id=venta["id"], usuario_mail=venta["usuario_mail"], fecha=venta["fecha"],
        estado_id=3, precio=float(venta["precio"]),
        tasa_comision=float(venta["tasa_comision"]), entradas=entradas,
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancelar item del carrito")
def cancelar_venta(id: str, db=Depends(get_db), user=Depends(get_current_user)):
    db.execute("SELECT usuario_mail, estado_id FROM Venta WHERE id = %s", (id,))
    venta = db.fetchone()
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    if venta["usuario_mail"] != user["mail"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permiso")
    if venta["estado_id"] != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se puede cancelar una venta PENDIENTE")
    db.execute("DELETE FROM Entrada WHERE venta_id = %s", (id,))
    db.execute("DELETE FROM Venta WHERE id = %s", (id,))


@router.get(
    "/{id}",
    response_model=VentaOut,
    summary="Detalle de una venta",
    description="Retorna una venta con sus entradas. Solo el comprador o un administrador puede verla.",
)
def get_venta(
    id: str,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    db.execute(
        """SELECT id, usuario_mail, fecha, estado_id, precio, tasa_comision
           FROM Venta
           WHERE id = %s""",
        (id,),
    )
    venta = db.fetchone()
    if not venta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta no encontrada",
        )

    if venta["usuario_mail"] != user["mail"] and user["rol"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta venta",
        )

    db.execute(
        """SELECT id, venta_id, titular_mail, costo,
                  evento_id, sector_id, consumido
           FROM Entrada
           WHERE venta_id = %s""",
        (id,),
    )
    entradas_rows = db.fetchall()

    entradas = [
        EntradaOut(
            id=e["id"],
            venta_id=e["venta_id"],
            titular_mail=e["titular_mail"],
            costo=float(e["costo"]),
            evento_id=e["evento_id"],
            sector_id=e["sector_id"],
            consumido=bool(e["consumido"]),
        )
        for e in entradas_rows
    ]

    return VentaOut(
        id=venta["id"],
        usuario_mail=venta["usuario_mail"],
        fecha=venta["fecha"],
        estado_id=venta["estado_id"],
        precio=float(venta["precio"]),
        tasa_comision=float(venta["tasa_comision"]),
        entradas=entradas,
    )


@router.patch(
    "/{id}/estado",
    response_model=VentaOut,
    summary="Actualizar estado de una venta",
    description="Solo ADMIN. Transición hacia adelante: PENDIENTE → CONFIRMADA → PAGA.",
)
def update_venta_estado(
    id: str,
    body: VentaEstadoUpdate,
    db=Depends(get_db),
    admin=Depends(require_admin),
):
    ESTADOS_VALIDOS = {"PENDIENTE": 1, "CONFIRMADA": 2, "PAGA": 3}

    nuevo_estado_id = ESTADOS_VALIDOS.get(body.nuevo_estado)
    if nuevo_estado_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado inválido: {body.nuevo_estado}. Valores: PENDIENTE, CONFIRMADA, PAGA",
        )

    db.execute(
        "SELECT id, usuario_mail, estado_id, fecha, precio, tasa_comision FROM Venta WHERE id = %s",
        (id,),
    )
    venta = db.fetchone()
    if not venta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta no encontrada",
        )

    if nuevo_estado_id <= venta["estado_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede retroceder al mismo estado o a uno anterior",
        )

    db.execute(
        "UPDATE Venta SET estado_id = %s WHERE id = %s",
        (nuevo_estado_id, id),
    )

    db.execute(
        """SELECT id, venta_id, titular_mail, costo,
                  evento_id, sector_id, consumido
           FROM Entrada
           WHERE venta_id = %s""",
        (id,),
    )
    entradas_rows = db.fetchall()

    entradas = [
        EntradaOut(
            id=e["id"],
            venta_id=e["venta_id"],
            titular_mail=e["titular_mail"],
            costo=float(e["costo"]),
            evento_id=e["evento_id"],
            sector_id=e["sector_id"],
            consumido=bool(e["consumido"]),
        )
        for e in entradas_rows
    ]

    return VentaOut(
        id=venta["id"],
        usuario_mail=venta["usuario_mail"],
        fecha=venta["fecha"],
        estado_id=nuevo_estado_id,
        precio=float(venta["precio"]),
        tasa_comision=float(venta["tasa_comision"]),
        entradas=entradas,
    )
