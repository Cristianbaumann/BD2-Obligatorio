from fastapi import APIRouter, Depends
from core.security import require_admin

router = APIRouter(prefix="/dispositivos", tags=["dispositivos"])


@router.get("/")
def list_dispositivos():
    # TODO: list all dispositivos
    pass


@router.post("/")
def create_dispositivo():
    # TODO: register dispositivo
    pass


@router.delete("/{id}")
def delete_dispositivo(id: int):
    # TODO: delete dispositivo
    pass

@router.get("/dispositivos-autorizados")
def list_dispositivos_autorizados():
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT 
            d.id AS dispositivo_id,
            f.id AS funcionario_id,
            f.nombre AS funcionario_nombre
        FROM Dispositivo d
        INNER JOIN Funcionario f ON d.funcionario_mail = f.usuario_mail
        """
        
        cursor.execute(query)
        dispositivos = cursor.fetchall() 
        
        if not dispositivos:
            raise HTTPException(status_code=404, detail="No hay dispositivos autorizados")
        
        return {"dispositivos_autorizados": dispositivos}
        
    finally:
        if cursor:
            cursor.close()