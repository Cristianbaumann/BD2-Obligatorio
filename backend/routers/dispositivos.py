from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import IntegrityError
from dependencies.auth import require_admin, require_funcionario
from database import get_db
from schemas.dispositivo import DispositivoCreate, DispositivoOut

router = APIRouter(prefix="/dispositivos", tags=["dispositivos"])


@router.get("/mis-dispositivos")
def mis_dispositivos(user=Depends(require_funcionario), db=Depends(get_db)):
    db.execute(
        "SELECT id, funcionario_mail, activo FROM Dispositivo WHERE funcionario_mail = %s AND activo = TRUE",
        (user["mail"],),
    )
    return db.fetchall()


@router.get("/", response_model=list[DispositivoOut])
def list_dispositivos(db=Depends(get_db), user=Depends(require_admin)):
    db.execute("SELECT id, funcionario_mail, activo FROM Dispositivo")
    return db.fetchall()


@router.post("/", response_model=DispositivoOut, status_code=status.HTTP_201_CREATED)
def create_dispositivo(
    body: DispositivoCreate,           
    db=Depends(get_db),
    user=Depends(require_admin)
):
    # Verificar que el funcionario existe
    db.execute(
        "SELECT usuario_mail FROM Funcionario WHERE usuario_mail = %s",
        (body.funcionario_mail,)
    )
    if db.fetchone() is None:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    db.execute("SELECT @new_id := UUID()")
    new_id = db.fetchone()["@new_id := UUID()"]
    try:
        db.execute(
            "INSERT INTO Dispositivo (id, funcionario_mail, activo) VALUES (%s, %s, TRUE)",
            (new_id, body.funcionario_mail,)
        )
    except IntegrityError:
        raise HTTPException(status_code=409, detail="El dispositivo ya está registrado")

    db.execute(
        "SELECT id, funcionario_mail, activo FROM Dispositivo WHERE id = %s",
        (new_id,)
    )
    return db.fetchone()


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_dispositivo(
    id: str,                           
    db=Depends(get_db),
    user=Depends(require_admin)
):
    db.execute("SELECT id FROM Dispositivo WHERE id = %s", (id,))
    if db.fetchone() is None:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    db.execute("SELECT COUNT(*) AS cnt FROM Validacion WHERE dispositivo_id = %s", (id,))
    if db.fetchone()["cnt"] > 0:
        db.execute("UPDATE Dispositivo SET activo = FALSE WHERE id = %s", (id,))
        return {"detail": "Dispositivo desactivado", "deactivated": True}

    db.execute("DELETE FROM Dispositivo WHERE id = %s", (id,))
    return {"detail": "Dispositivo eliminado", "deactivated": False}


@router.patch("/{id}/activar", status_code=status.HTTP_200_OK)
def activar_dispositivo(id: str, db=Depends(get_db), _=Depends(require_admin)):
    db.execute("SELECT id, activo FROM Dispositivo WHERE id = %s", (id,))
    row = db.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    if row["activo"]:
        raise HTTPException(status_code=409, detail="El dispositivo ya está activo")
    db.execute("UPDATE Dispositivo SET activo = TRUE WHERE id = %s", (id,))
    return {"detail": "Dispositivo activado"}


@router.get("/autorizados", response_model=list[DispositivoOut])  # ← ruta simplificada
def list_dispositivos_autorizados(db=Depends(get_db), user=Depends(require_admin)):
    db.execute(
        """
        SELECT id, funcionario_mail, activo
        FROM Dispositivo
        WHERE activo = TRUE              
        """
    )
    dispositivos = db.fetchall()

    if not dispositivos:
        raise HTTPException(status_code=404, detail="No hay dispositivos autorizados")

    return dispositivos