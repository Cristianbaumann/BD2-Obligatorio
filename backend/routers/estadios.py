from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_db
from schemas.estadio import EstadioDetail, EstadioOut, SectorOut

router = APIRouter(prefix="/estadios", tags=["estadios"])


@router.get("/", response_model=List[EstadioOut])
def list_estadios(
    pais: Optional[str] = Query(None, description="Filtrar por país"),
    cursor=Depends(get_db),
):
    if pais:
        cursor.execute(
            "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo FROM Estadio WHERE dir_pais = %s ORDER BY nombre",
            (pais,),
        )
    else:
        cursor.execute(
            "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo FROM Estadio ORDER BY nombre"
        )
    return cursor.fetchall()


@router.get("/{nombre}", response_model=EstadioDetail)
def get_estadio(nombre: str, cursor=Depends(get_db)):
    cursor.execute(
        """
        SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo
        FROM Estadio
        WHERE nombre = %s
        """,
        (nombre,),
    )
    estadio = cursor.fetchone()
    if not estadio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estadio no encontrado")

    cursor.execute(
        """
        SELECT id, estadio_pais, estadio_localidad, estadio_calle, estadio_numero,
               nombre, capacidad
        FROM Sector
        WHERE estadio_pais = %s
          AND estadio_localidad = %s
          AND estadio_calle = %s
          AND estadio_numero = %s
        ORDER BY id
        """,
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]),
    )
    sectores = cursor.fetchall()

    return {**estadio, "sectores": sectores}
