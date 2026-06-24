from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import require_any_role, get_current_user
from schemas.transferencia import TransferenciaCreate
from database import get_db

router = APIRouter(prefix="/transferencias", tags=["transferencias"])


@router.get("/")
def list_transferencias():
    pass


@router.post("/")
def create_transferencia(body: TransferenciaCreate, user=Depends(get_current_user), db=Depends(get_db)):
    entrada_id = body.entrada_id
    mail_destino = body.destino_mail

    db.execute("SELECT mail FROM Usuario WHERE mail = %s", (mail_destino,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="El destinatario no está registrado en el sistema")

    db.execute("SELECT titular_mail, consumido FROM Entrada WHERE id = %s FOR UPDATE", (entrada_id,))
    entrada = db.fetchone()
    if not entrada:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if entrada["consumido"]:
        raise HTTPException(status_code=400, detail="No se puede transferir una entrada consumida")
    if entrada["titular_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="Solo el titular puede transferir esta entrada")
    if entrada["titular_mail"] == mail_destino:
        raise HTTPException(status_code=400, detail="No podés transferirte una entrada a vos mismo")

    db.execute("SELECT COUNT(*) AS cnt FROM Transferencia WHERE entrada_id = %s AND estado = 'ACEPTADA'", (entrada_id,))
    if db.fetchone()["cnt"] >= 3:
        raise HTTPException(status_code=400, detail="Esta entrada ya fue transferida 3 veces (límite máximo)")

    db.execute("SELECT COUNT(*) AS cnt FROM Transferencia WHERE entrada_id = %s AND estado = 'PENDIENTE'", (entrada_id,))
    if db.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=400, detail="Ya existe una transferencia pendiente para esta entrada")

    db.execute(
        "INSERT INTO Transferencia (entrada_id, origen_mail, destino_mail, fecha, estado) VALUES (%s, %s, %s, NOW(), 'PENDIENTE')",
        (entrada_id, user["mail"], mail_destino),
    )

    return {"message": "Transferencia solicitada. El destinatario debe aceptarla."}


@router.get("/mis-transferencias")
def transferencias_usuario(mail_usuario: str, user=Depends(require_any_role), db=Depends(get_db)):
    db.execute("""
        SELECT t.id AS transferencia_id, t.entrada_id, t.origen_mail, t.destino_mail,
               t.fecha AS fecha_transferencia, t.estado,
               ev.fecha          AS evento_fecha,
               el.nombre         AS equipo_local,
               ev2.nombre        AS equipo_visitante,
               s.nombre          AS sector_nombre,
               e.costo
        FROM Transferencia t
        JOIN Entrada e   ON e.id   = t.entrada_id
        JOIN Evento  ev  ON ev.id  = e.evento_id
        JOIN Equipo  el  ON el.id  = ev.equipo_local_id
        JOIN Equipo  ev2 ON ev2.id = ev.equipo_visitante_id
        JOIN Sector  s   ON s.id   = e.sector_id
        WHERE (t.origen_mail = %s OR t.destino_mail = %s)
        ORDER BY t.fecha DESC
    """, (mail_usuario, mail_usuario))
    transferencias = db.fetchall()
    if not transferencias:
        raise HTTPException(status_code=404, detail="No se encontraron transferencias para este usuario")
    return {"transferencias": transferencias}


@router.get("/{id}")
def get_transferencia(id: str):
    pass


@router.post("/solicitar")
def solicitar_transferencia(entrada_id: int, email_destinatario: str, user=Depends(require_any_role), db=Depends(get_db)):
    db.execute("SELECT mail FROM Usuario WHERE mail = %s", (email_destinatario,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="El destinatario no está registrado en el sistema")

    db.execute("SELECT titular_mail, consumido FROM Entrada WHERE id = %s FOR UPDATE", (entrada_id,))
    resultado = db.fetchone()
    if resultado is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if resultado["consumido"]:
        raise HTTPException(status_code=400, detail="No se puede transferir una entrada consumida")
    if resultado["titular_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="Solo el titular puede solicitar una transferencia")
    if email_destinatario == user["mail"]:
        raise HTTPException(status_code=400, detail="No podés transferirte una entrada a vos mismo")

    db.execute("SELECT COUNT(*) AS contador FROM Transferencia WHERE entrada_id = %s AND estado = 'ACEPTADA'", (entrada_id,))
    if db.fetchone()["contador"] >= 3:
        raise HTTPException(status_code=400, detail="Esta entrada ya fue transferida 3 veces (límite máximo)")

    db.execute("SELECT COUNT(*) AS cnt FROM Transferencia WHERE entrada_id = %s AND estado = 'PENDIENTE'", (entrada_id,))
    if db.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=400, detail="Ya existe una transferencia pendiente para esta entrada")

    db.execute(
        "INSERT INTO Transferencia (entrada_id, origen_mail, destino_mail, fecha, estado) VALUES (%s, %s, %s, NOW(), 'PENDIENTE')",
        (entrada_id, user["mail"], email_destinatario),
    )
    return {"message": "Transferencia solicitada exitosamente"}


@router.patch("/{id}/rechazar")
def rechazar_transferencia(id: str, user=Depends(get_current_user), db=Depends(get_db)):
    db.execute(
        "SELECT destino_mail FROM Transferencia WHERE id = %s AND estado = 'PENDIENTE'",
        (id,),
    )
    transferencia = db.fetchone()
    if not transferencia:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada o no está pendiente")
    if transferencia["destino_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="Solo el destinatario puede rechazar esta transferencia")

    db.execute("UPDATE Transferencia SET estado = 'RECHAZADA' WHERE id = %s", (id,))
    return {"message": "Transferencia rechazada exitosamente"}


@router.patch("/{id}/aceptar")
def aceptar_transferencia(id: str, user=Depends(get_current_user), db=Depends(get_db)):
    db.execute(
        "SELECT t.entrada_id, t.destino_mail FROM Transferencia t WHERE t.id = %s AND t.estado = 'PENDIENTE'",
        (id,),
    )
    transferencia = db.fetchone()
    if not transferencia:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada o no está pendiente")
    if transferencia["destino_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="Solo el destinatario puede aceptar esta transferencia")

    db.execute("UPDATE Transferencia SET estado = 'ACEPTADA' WHERE id = %s", (id,))
    db.execute("UPDATE Entrada SET titular_mail = %s WHERE id = %s", (user["mail"], transferencia["entrada_id"]))
    db.execute("UPDATE Qr SET activo = FALSE WHERE entrada_id = %s", (transferencia["entrada_id"],))

    return {"message": "Transferencia aceptada exitosamente"}
