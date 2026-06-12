from fastapi import APIRouter, Depends

from database import get_db
from dependencies.auth import get_current_user
from schemas.entrada import (
    EntradaConInfoOut, EntradaDetalleOut, EventoInfo,
    QrInfo, TitularInfo, TransferenciaHistorialItem,
)

router = APIRouter(prefix="/entradas", tags=["entradas"])


@router.get(
    "/mis-entradas",
    response_model=list[EntradaConInfoOut],
    summary="Mis entradas",
    description="Retorna todas las entradas del usuario autenticado con datos del evento y QR activo.",
)
def mis_entradas(
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    db.execute(
        """SELECT e.id, e.venta_id, e.titular_mail, e.costo,
                  e.evento_id, e.sector_id, e.consumido,
                  ev.fecha              AS evento_fecha,
                  el.nombre              AS equipo_local_nombre,
                  ev2.nombre             AS equipo_visitante_nombre,
                  s.nombre               AS sector_nombre,
                  q.id                   AS qr_id,
                  q.codigo_hash          AS qr_codigo_hash,
                  q.creado_en            AS qr_creado_en,
                  q.activo               AS qr_activo
           FROM Entrada e
           JOIN Evento   ev  ON ev.id  = e.evento_id
           JOIN Equipo   el  ON el.id  = ev.equipo_local_id
           JOIN Equipo   ev2 ON ev2.id = ev.equipo_visitante_id
           JOIN Sector   s   ON s.id   = e.sector_id
           LEFT JOIN Qr  q   ON q.entrada_id = e.id AND q.activo = TRUE
           WHERE e.titular_mail = %s
           ORDER BY ev.fecha DESC, e.id""",
        (user["mail"],),
    )
    rows = db.fetchall()

    return [
        EntradaConInfoOut(
            id=r["id"],
            venta_id=r["venta_id"],
            titular_mail=r["titular_mail"],
            costo=float(r["costo"]),
            evento_id=r["evento_id"],
            sector_id=r["sector_id"],
            consumido=bool(r["consumido"]),
            evento=EventoInfo(
                fecha=r["evento_fecha"],
                equipo_local=r["equipo_local_nombre"],
                equipo_visitante=r["equipo_visitante_nombre"],
                sector_nombre=r["sector_nombre"],
            ),
            qr=QrInfo(
                id=r["qr_id"],
                codigo_hash=r["qr_codigo_hash"],
                creado_en=r["qr_creado_en"],
                activo=bool(r["qr_activo"]),
            ) if r["qr_id"] else None,
        )
        for r in rows
    ]


@router.get(
    "/{id}",
    response_model=EntradaDetalleOut,
    summary="Detalle de una entrada",
    description="Retorna el detalle de una entrada con evento, titular, historial de transferencias. Solo el titular o admin.",
)
def get_entrada(
    id: str,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    db.execute(
        """SELECT e.id, e.venta_id, e.titular_mail, e.costo,
                  e.evento_id, e.sector_id, e.consumido,
                  ev.fecha              AS evento_fecha,
                  el.nombre              AS equipo_local_nombre,
                  ev2.nombre             AS equipo_visitante_nombre,
                  s.nombre               AS sector_nombre,
                  u.nombre               AS titular_nombre,
                  u.apellido             AS titular_apellido
           FROM Entrada e
           JOIN Evento   ev  ON ev.id  = e.evento_id
           JOIN Equipo   el  ON el.id  = ev.equipo_local_id
           JOIN Equipo   ev2 ON ev2.id = ev.equipo_visitante_id
           JOIN Sector   s   ON s.id   = e.sector_id
           JOIN Usuario  u   ON u.mail = e.titular_mail
           WHERE e.id = %s""",
        (id,),
    )
    entrada = db.fetchone()
    if not entrada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada",
        )

    if entrada["titular_mail"] != user["mail"] and user["rol"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta entrada",
        )

    db.execute(
        """SELECT id, origen_mail, destino_mail, fecha, estado
           FROM Transferencia
           WHERE entrada_id = %s
           ORDER BY fecha ASC""",
        (id,),
    )
    transferencias_rows = db.fetchall()

    return EntradaDetalleOut(
        id=entrada["id"],
        venta_id=entrada["venta_id"],
        titular=TitularInfo(
            mail=entrada["titular_mail"],
            nombre=entrada["titular_nombre"],
            apellido=entrada["titular_apellido"],
        ),
        costo=float(entrada["costo"]),
        evento=EventoInfo(
            fecha=entrada["evento_fecha"],
            equipo_local=entrada["equipo_local_nombre"],
            equipo_visitante=entrada["equipo_visitante_nombre"],
            sector_nombre=entrada["sector_nombre"],
        ),
        consumido=bool(entrada["consumido"]),
        estado="activa" if not entrada["consumido"] else "consumida",
        historial_transferencias=[
            TransferenciaHistorialItem(
                id=t["id"],
                origen_mail=t["origen_mail"],
                destino_mail=t["destino_mail"],
                fecha=t["fecha"],
                estado=t["estado"],
            )
            for t in transferencias_rows
        ],
    )
