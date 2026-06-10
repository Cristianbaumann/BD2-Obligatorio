from fastapi import APIRouter, Depends, HTTPException
from core.security import require_any_role
from database import get_db

router = APIRouter(prefix="/transferencias", tags=["transferencias"])


@router.get("/")
def list_transferencias():
    # TODO: list all transferencias
    pass


@router.post("/")
def create_transferencia():
    # TODO: create transferencia
    pass


@router.get("/{id}")
def get_transferencia(id: int):
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