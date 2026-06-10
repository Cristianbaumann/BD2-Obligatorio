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