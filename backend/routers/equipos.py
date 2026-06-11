from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from database import get_db
from schemas import EquipoCreate, EquipoOut
from dependencies.auth import require_admin

router = APIRouter(prefix="/equipos", tags=["equipos"])


@router.get("/", response_model=List[EquipoOut])
def list_equipos(cursor=Depends(get_db)):
    cursor.execute("SELECT id, nombre FROM Equipo ORDER BY nombre")
    return cursor.fetchall()


@router.post("/", response_model=EquipoOut, status_code=201)
def create_equipo(body: EquipoCreate, cursor=Depends(get_db), _=Depends(require_admin)):
    nuevo_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO Equipo (id, nombre) VALUES (%s, %s)",
        (nuevo_id, body.nombre),
    )
    return {"id": nuevo_id, "nombre": body.nombre}
