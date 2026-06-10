
from fastapi import APIRouter, Depends, HTTPException
from core.security import require_admin
from database import get_db


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
def list_dispositivos_autorizados(user=Depends(require_admin), db=Depends(get_db)):
    query = """
    SELECT 
        d.id AS dispositivo_id,
        f.usuario_mail AS funcionario_id,
        f.numero_legajo AS numero_legajo
    FROM Dispositivo d
    INNER JOIN Funcionario f ON d.funcionario_mail = f.usuario_mail
    """

    db.execute(query)
    dispositivos = db.fetchall()

    if not dispositivos:
        raise HTTPException(status_code=404, detail="No hay dispositivos autorizados")

    return {"dispositivos_autorizados": dispositivos}

@router.post("/register")
def registrar_dispositivo(id_dispositivo: str, mail_funcionario: str, user = Depends(require_admin), db=Depends(get_db)):
    query = """
    INSERT INTO Dispositivo (id, funcionario_mail, activo)
    VALUES (%s, %s, TRUE)
    """
    try:
        db.execute(query, (id_dispositivo, mail_funcionario))
        db.commit()
    except Exception as e:
        db.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="El dispositivo ya está registrado")
        raise HTTPException(status_code=500, detail="Error interno al registrar dispositivo")

    return {"message": "Dispositivo registrado exitosamente"}
    