from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from dependencies.auth import require_any_role, get_current_user
from database import get_db

router = APIRouter(prefix="/transferencias", tags=["transferencias"])


class TransferenciaIn(BaseModel):
    entrada_id: str
    mail_destino: EmailStr


@router.get("/")
def list_transferencias():
    pass


@router.post("/")
def create_transferencia(body: TransferenciaIn, user=Depends(get_current_user), db=Depends(get_db)):
    entrada_id = body.entrada_id
    mail_destino = body.mail_destino

    # Verify recipient exists in Usuario
    db.execute("SELECT mail FROM Usuario WHERE mail = %s", (mail_destino,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="El destinatario no está registrado en el sistema")

    # Lock and verify entrada
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

    # Check transfer limit (max 3)
    db.execute("SELECT COUNT(*) AS cnt FROM Transferencia WHERE entrada_id = %s AND estado = 'ACEPTADA'", (entrada_id,))
    if db.fetchone()["cnt"] >= 3:
        raise HTTPException(status_code=400, detail="Esta entrada ya fue transferida 3 veces (límite máximo)")

    # Check no pending transfer
    db.execute("SELECT COUNT(*) AS cnt FROM Transferencia WHERE entrada_id = %s AND estado = 'PENDIENTE'", (entrada_id,))
    if db.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=400, detail="Ya existe una transferencia pendiente para esta entrada")

    # Insert transfer record as ACEPTADA (immediate)
    db.execute(
        "INSERT INTO Transferencia (entrada_id, origen_mail, destino_mail, fecha, estado) VALUES (%s, %s, %s, NOW(), 'ACEPTADA')",
        (entrada_id, user["mail"], mail_destino),
    )

    # Update titular
    db.execute("UPDATE Entrada SET titular_mail = %s WHERE id = %s", (mail_destino, entrada_id))

    # Invalidate old QR so recipient gets a fresh one
    db.execute("UPDATE Qr SET activo = FALSE WHERE entrada_id = %s", (entrada_id,))

    db.commit()
    return {"message": "Entrada transferida exitosamente"}


@router.get("/{id}")
def get_transferencia(id: str):
    # TODO: get transferencia by id
    pass


@router.get("/mis-transferencias")
def transferencias_usuario(mail_usuario : str, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    SELECT 
        t.id AS transferencia_id,
        t.entrada_id AS entrada_id,
        t.origen_mail AS origen_mail,
        t.destino_mail AS destino_mail,
        t.fecha AS fecha_transferencia,
        t.estado AS estado
    FROM Transferencia t
    WHERE (t.origen_mail = %s OR t.destino_mail = %s)
    ORDER BY t.fecha DESC
    """

    db.execute(query, (mail_usuario, mail_usuario))
    transferencias = db.fetchall()

    if not transferencias:
        raise HTTPException(status_code=404, detail="No se encontraron transferencias para este usuario")

    return {"transferencias": transferencias}


@router.post("/solicitar")
def solicitar_transferencia(entrada_id: int, email_destinatario: str, user=Depends(require_any_role), db=Depends(get_db)):
    
    # Verifica que el solicitante es titular actual
    query_titular = "SELECT titular_mail,consumido FROM Entrada WHERE id = %s FOR UPDATE"
    db.execute(query_titular, (entrada_id,))
    resultado = db.fetchone()
    if resultado is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if resultado["consumido"]:
        raise HTTPException(status_code=400, detail="No se puede transferir una entrada consumida")
    if resultado["titular_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="Solo el titular puede solicitar una transferencia")

    # Verifica el contador de transferencias
    query_contador = "SELECT COUNT(*) AS contador FROM Transferencia WHERE entrada_id = %s"
    db.execute(query_contador, (entrada_id,))
    resultado = db.fetchone()
    if resultado["contador"] >= 3:
        raise HTTPException(status_code=400, detail="Esta entrada ya ha sido transferida 3 veces")

    # Verifica que no hay transferencia PENDIENTE activa para esa entrada
    query_pendiente = "SELECT COUNT(*) AS contador_pendiente FROM Transferencia WHERE entrada_id = %s AND estado = 'PENDIENTE'"
    db.execute(query_pendiente, (entrada_id,))
    resultado = db.fetchone()
    if resultado["contador_pendiente"] > 0:
        raise HTTPException(status_code=400, detail="Ya existe una transferencia pendiente para esta entrada")

    # Crea registro de la transferencia en estado PENDIENTE
    query_insert = """
    INSERT INTO Transferencia (entrada_id, origen_mail, destino_mail, fecha, estado)
    VALUES (%s, %s, %s, NOW(), 'PENDIENTE')
    """
    db.execute(query_insert, (entrada_id, user["mail"], email_destinatario))
    db.commit()

    return {"message": "Transferencia solicitada exitosamente"}


@router.patch("/{id}/rechazar")
def rechazar_transferencia(id: str, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    UPDATE Transferencia
    SET estado = 'RECHAZADA'
    WHERE id = %s AND estado = 'PENDIENTE'
    """

    db.execute(query, (id,))
    if db.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada o no está pendiente")
    
    db.commit()
    return {"message": "Transferencia rechazada exitosamente"}


@router.patch("/{id}/aceptar")
def aceptar_transferencia(id: str, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    UPDATE Transferencia
    SET estado = 'ACEPTADA'
    WHERE id = %s AND estado = 'PENDIENTE'
    """

    db.execute(query, (id,))
    if db.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada o no está pendiente")
    
    db.commit()
    return {"message": "Transferencia aceptada exitosamente"}