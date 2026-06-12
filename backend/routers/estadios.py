import unicodedata
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from mysql.connector import IntegrityError

from database import get_db
from dependencies.auth import require_admin
from schemas.estadio import EstadioCreate, EstadioDetail, EstadioOut, SectorIn, SectorOut, SectorUpdate

router = APIRouter(prefix="/estadios", tags=["estadios"])


def _norm(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()


def _check_aforo(cursor, estadio: dict, extra_capacidad: int, excluir_sector_id: int = None):
    sql = """
        SELECT COALESCE(SUM(capacidad), 0) AS total
        FROM Sector
        WHERE estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
    """
    params = [estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]]
    if excluir_sector_id is not None:
        sql += " AND id != %s"
        params.append(excluir_sector_id)
    cursor.execute(sql, params)
    total_actual = cursor.fetchone()["total"]
    if total_actual + extra_capacidad > estadio["aforo"]:
        raise HTTPException(
            status_code=409,
            detail=f"Capacidad total de sectores ({total_actual + extra_capacidad}) superaría el aforo del estadio ({estadio['aforo']})",
        )


@router.post("/", response_model=EstadioOut, status_code=status.HTTP_201_CREATED)
def create_estadio(
    estadio: EstadioCreate,
    cursor=Depends(get_db),
    admin=Depends(require_admin),
):
    cursor.execute(
        "SELECT pais_sede FROM Admin WHERE usuario_mail = %s",
        (admin["mail"],),
    )
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    if _norm(admin_row["pais_sede"]) != _norm(estadio.dir_pais):
        raise HTTPException(
            status_code=403,
            detail="El admin solo puede registrar estadios en su país sede",
        )

    try:
        cursor.execute(
            """
            INSERT INTO Estadio (dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                estadio.dir_pais,
                estadio.dir_localidad,
                estadio.dir_calle,
                estadio.dir_numero,
                estadio.nombre,
                estadio.aforo,
            ),
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un estadio con esa dirección",
        ) from exc

    return estadio.model_dump()


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


@router.post("/{nombre}/sectores", response_model=SectorOut, status_code=status.HTTP_201_CREATED)
def create_sector(
    nombre: str,
    sector: SectorIn,
    cursor=Depends(get_db),
    admin=Depends(require_admin),
):
    cursor.execute(
        "SELECT pais_sede FROM Admin WHERE usuario_mail = %s",
        (admin["mail"],),
    )
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, aforo FROM Estadio WHERE nombre = %s",
        (nombre,),
    )
    estadio = cursor.fetchone()
    if not estadio:
        raise HTTPException(status_code=404, detail="Estadio no encontrado")

    if _norm(admin_row["pais_sede"]) != _norm(estadio["dir_pais"]):
        raise HTTPException(status_code=403, detail="El admin solo puede gestionar estadios de su país sede")

    cursor.execute(
        """
        SELECT id FROM Sector
        WHERE estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
          AND nombre = %s
        """,
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"], sector.nombre),
    )
    if cursor.fetchone():
        raise HTTPException(status_code=409, detail="Ya existe un sector con ese nombre en el estadio")

    _check_aforo(cursor, estadio, sector.capacidad)

    cursor.execute(
        """
        INSERT INTO Sector (estadio_pais, estadio_localidad, estadio_calle, estadio_numero, nombre, capacidad)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"],
         sector.nombre, sector.capacidad),
    )
    new_id = cursor.lastrowid
    return {
        "id": new_id,
        "estadio_pais": estadio["dir_pais"],
        "estadio_localidad": estadio["dir_localidad"],
        "estadio_calle": estadio["dir_calle"],
        "estadio_numero": estadio["dir_numero"],
        "nombre": sector.nombre,
        "capacidad": sector.capacidad,
    }


@router.put("/{nombre}/sectores/{sector_id}", response_model=SectorOut)
def update_sector(
    nombre: str,
    sector_id: int,
    datos: SectorUpdate,
    cursor=Depends(get_db),
    admin=Depends(require_admin),
):
    cursor.execute(
        "SELECT pais_sede FROM Admin WHERE usuario_mail = %s",
        (admin["mail"],),
    )
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, aforo FROM Estadio WHERE nombre = %s",
        (nombre,),
    )
    estadio = cursor.fetchone()
    if not estadio:
        raise HTTPException(status_code=404, detail="Estadio no encontrado")

    if _norm(admin_row["pais_sede"]) != _norm(estadio["dir_pais"]):
        raise HTTPException(status_code=403, detail="El admin solo puede gestionar estadios de su país sede")

    cursor.execute(
        """
        SELECT id, nombre, capacidad FROM Sector
        WHERE id = %s AND estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
        """,
        (sector_id, estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]),
    )
    sector = cursor.fetchone()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector no encontrado en ese estadio")

    if datos.capacidad is not None and datos.capacidad != sector["capacidad"]:
        _check_aforo(cursor, estadio, datos.capacidad, excluir_sector_id=sector_id)

    if datos.capacidad is not None and datos.capacidad < sector["capacidad"]:
        cursor.execute(
            """
            SELECT COALESCE(MAX(cnt), 0) AS max_vendidas
            FROM (
                SELECT COUNT(*) AS cnt
                FROM Entrada
                WHERE sector_id = %s
                GROUP BY evento_id
            ) t
            """,
            (sector_id,),
        )
        row = cursor.fetchone()
        if row["max_vendidas"] > datos.capacidad:
            raise HTTPException(
                status_code=409,
                detail=f"No se puede reducir capacidad: hay {row['max_vendidas']} entradas emitidas en un evento para este sector",
            )

    sets, params = [], []
    if datos.nombre is not None:
        sets.append("nombre = %s")
        params.append(datos.nombre)
    if datos.capacidad is not None:
        sets.append("capacidad = %s")
        params.append(datos.capacidad)

    if not sets:
        raise HTTPException(status_code=400, detail="No se enviaron campos a actualizar")

    params.append(sector_id)
    cursor.execute(f"UPDATE Sector SET {', '.join(sets)} WHERE id = %s", params)

    cursor.execute(
        "SELECT id, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, nombre, capacidad FROM Sector WHERE id = %s",
        (sector_id,),
    )
    return cursor.fetchone()


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
