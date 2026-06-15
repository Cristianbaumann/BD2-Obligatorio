import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from database import get_db
from dependencies.auth import get_current_user, require_admin
from schemas.venta import VentaCreate, VentaOut, VentaEstadoUpdate, EntradaOut

router = APIRouter(prefix="/ventas", tags=["ventas"])


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

    total = sum(item.cantidad for item in body.entradas)
    if total > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máximo 5 entradas por transacción",
        )

    items_data = []
    for item in body.entradas:
        if item.cantidad < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cada cantidad debe ser al menos 1",
            )

        db.execute(
            """SELECT es.costo, s.capacidad
               FROM EventoSector es
               JOIN Sector s ON s.id = es.sector_id
               WHERE es.evento_id = %s AND es.sector_id = %s""",
            (item.evento_id, item.sector_id),
        )
        row = db.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sector {item.sector_id} no disponible para evento {item.evento_id}",
            )

        db.execute(
            "SELECT COUNT(*) as vendidas FROM Entrada WHERE evento_id = %s AND sector_id = %s",
            (item.evento_id, item.sector_id),
        )
        vendidas = db.fetchone()["vendidas"]
        disponibles = row["capacidad"] - vendidas
        if item.cantidad > disponibles:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Disponibilidad insuficiente en evento {item.evento_id}, sector {item.sector_id}: solicitadas {item.cantidad}, disponibles {disponibles}",
            )

        items_data.append(
            {
                "evento_id": item.evento_id,
                "sector_id": item.sector_id,
                "cantidad": item.cantidad,
                "costo": float(row["costo"]),
            }
        )

    db.execute(
        "SELECT tasa FROM ComisionHistorica WHERE fecha_hasta IS NULL ORDER BY id DESC LIMIT 1",
    )
    comision_row = db.fetchone()
    if not comision_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No hay tasa de comisión configurada",
        )
    tasa = float(comision_row["tasa"])

    subtotal = sum(item["cantidad"] * item["costo"] for item in items_data)
    precio = round(subtotal * (1 + tasa), 2)

    venta_id = str(uuid.uuid4())
    ahora = datetime.now()
    db.execute(
        "INSERT INTO Venta (id, usuario_mail, fecha, estado_id, precio, tasa_comision) VALUES (%s, %s, %s, %s, %s, %s)",
        (venta_id, user["mail"], ahora, 1, precio, tasa),
    )

    entradas_creadas = []
    for item in items_data:
        for _ in range(item["cantidad"]):
            entrada_id = str(uuid.uuid4())
            db.execute(
                "INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (entrada_id, venta_id, user["mail"], item["costo"], item["evento_id"], item["sector_id"]),
            )
            entradas_creadas.append(
                EntradaOut(
                    id=entrada_id,
                    venta_id=venta_id,
                    titular_mail=user["mail"],
                    costo=item["costo"],
                    evento_id=item["evento_id"],
                    sector_id=item["sector_id"],
                    consumido=False,
                )
            )

    return VentaOut(
        id=venta_id,
        usuario_mail=user["mail"],
        fecha=ahora,
        estado_id=1,
        precio=precio,
        tasa_comision=tasa,
        entradas=entradas_creadas,
    )


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
