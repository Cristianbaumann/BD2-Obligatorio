from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db
from dependencies.auth import require_admin

router = APIRouter(prefix="/asignaciones", tags=["asignaciones"])


class AsignacionCreate(BaseModel):
    funcionario_mail: str
    evento_id: str
    sector_id: int


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_asignacion(body: AsignacionCreate, db=Depends(get_db), _=Depends(require_admin)):
    db.execute("SELECT usuario_mail FROM Funcionario WHERE usuario_mail = %s", (body.funcionario_mail,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    db.execute(
        "SELECT 1 FROM EventoSector WHERE evento_id = %s AND sector_id = %s",
        (body.evento_id, body.sector_id),
    )
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="El sector no existe en ese evento")

    db.execute(
        """INSERT INTO FuncionarioSectorEvento (funcionario_mail, evento_id, sector_id)
           VALUES (%s, %s, %s)""",
        (body.funcionario_mail, body.evento_id, body.sector_id),
    )
    db.execute("SELECT LAST_INSERT_ID() AS id")
    nuevo_id = db.fetchone()["id"]

    return {
        "id": nuevo_id,
        "funcionario_mail": body.funcionario_mail,
        "evento_id": body.evento_id,
        "sector_id": body.sector_id,
    }


@router.get("/")
def listar_asignaciones(evento_id: str | None = None, db=Depends(get_db), _=Depends(require_admin)):
    if evento_id:
        db.execute(
            """SELECT fse.id, fse.funcionario_mail, fse.evento_id, fse.sector_id,
                      u.nombre, u.apellido, s.nombre AS sector_nombre
               FROM FuncionarioSectorEvento fse
               JOIN Usuario u ON u.mail = fse.funcionario_mail
               JOIN Sector s ON s.id = fse.sector_id
               WHERE fse.evento_id = %s
               ORDER BY fse.sector_id""",
            (evento_id,),
        )
    else:
        db.execute(
            """SELECT fse.id, fse.funcionario_mail, fse.evento_id, fse.sector_id,
                      u.nombre, u.apellido, s.nombre AS sector_nombre
               FROM FuncionarioSectorEvento fse
               JOIN Usuario u ON u.mail = fse.funcionario_mail
               JOIN Sector s ON s.id = fse.sector_id
               ORDER BY fse.evento_id, fse.sector_id""",
        )
    return db.fetchall()


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_asignacion(id: int, db=Depends(get_db), _=Depends(require_admin)):
    db.execute("SELECT id FROM FuncionarioSectorEvento WHERE id = %s", (id,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    db.execute("DELETE FROM FuncionarioSectorEvento WHERE id = %s", (id,))
