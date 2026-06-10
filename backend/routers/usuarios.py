from fastapi import APIRouter, Depends, HTTPException 
from core.security import require_funcionario, requiere_admin
from database import get_db

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/")
def list_usuarios():
    # TODO: list all users
    pass


@router.get("/{id}")
def get_usuario(id: int):
    # TODO: get user by id
    pass


@router.put("/{id}")
def update_usuario(id: int):
    # TODO: update user
    pass


@router.delete("/{id}")
def delete_usuario(id: int):
    # TODO: delete user
    pass

@router.post("/sectores")
def asignar_sector_funcionario(evento_id: str, id_sectores: list[int], user=Depends(require_funcionario), db=Depends(get_db)):
    
    # Verifica que el evento existe
    db.execute("SELECT id FROM Evento WHERE id = %s", (evento_id,))
    if db.fetchone() is None:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    # Verifica que todos los sectores pertenecen al evento
    for id_sector in id_sectores:
        db.execute("SELECT 1 FROM EventoSector WHERE evento_id = %s AND sector_id = %s", (evento_id, id_sector))
        if db.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Sector {id_sector} no pertenece al evento")

    # Asigna el funcionario a los sectores del evento
    query = """
    INSERT INTO FuncionarioSectorEvento (funcionario_mail, sector_id, evento_id)
    VALUES (%s, %s, %s)
    """
    try:
        for id_sector in id_sectores:
            db.execute(query, (user["mail"], id_sector, evento_id))
        db.commit()
    except Exception as e:
        db.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="El funcionario ya está asignado a uno de esos sectores")
        raise HTTPException(status_code=500, detail="Error interno al asignar sector al funcionario")

    return {"message": "Sectores asignados exitosamente"}