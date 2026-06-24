import unicodedata
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import IntegrityError

from database import get_db
from dependencies.auth import require_admin
from schemas.estadio import EstadioCreate, EstadioDetail, EstadioOut, EstadioUpdate, SectorIn, SectorOut, SectorUpdate

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

    pais = admin_row["pais_sede"]

    try:
        cursor.execute(
            """
            INSERT INTO Estadio (dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                pais,
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

    return {**estadio.model_dump(), "dir_pais": pais}


@router.get("/", response_model=List[EstadioOut])
def list_estadios(cursor=Depends(get_db), admin=Depends(require_admin)):
    cursor.execute("SELECT pais_sede FROM Admin WHERE usuario_mail = %s", (admin["mail"],))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Sin perfil de administrador")
    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo FROM Estadio WHERE dir_pais = %s ORDER BY nombre",
        (row["pais_sede"],),
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


@router.delete("/{nombre}/sectores/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    nombre: str,
    sector_id: int,
    cursor=Depends(get_db),
    admin=Depends(require_admin),
):
    cursor.execute("SELECT pais_sede FROM Admin WHERE usuario_mail = %s", (admin["mail"],))
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero FROM Estadio WHERE nombre = %s",
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
        WHERE id = %s AND estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
        """,
        (sector_id, estadio["dir_pais"], estadio["dir_localidad"],
         estadio["dir_calle"], estadio["dir_numero"]),
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Sector no encontrado en ese estadio")

    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM Entrada WHERE sector_id = %s",
        (sector_id,),
    )
    if cursor.fetchone()["cnt"] > 0:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: hay entradas emitidas para este sector",
        )

    cursor.execute("DELETE FROM Sector WHERE id = %s", (sector_id,))


@router.put("/{nombre}", response_model=EstadioOut)
def update_estadio(
    nombre: str,
    datos: EstadioUpdate,
    cursor=Depends(get_db),
    admin=Depends(require_admin),
):
    cursor.execute("SELECT pais_sede FROM Admin WHERE usuario_mail = %s", (admin["mail"],))
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo FROM Estadio WHERE nombre = %s",
        (nombre,),
    )
    estadio = cursor.fetchone()
    if not estadio:
        raise HTTPException(status_code=404, detail="Estadio no encontrado")

    if _norm(admin_row["pais_sede"]) != _norm(estadio["dir_pais"]):
        raise HTTPException(status_code=403, detail="El admin solo puede gestionar estadios de su país sede")

    new_aforo = datos.aforo if datos.aforo is not None else estadio["aforo"]
    cursor.execute(
        """
        SELECT COALESCE(SUM(capacidad), 0) AS total
        FROM Sector
        WHERE estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
        """,
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]),
    )
    total_sectores = cursor.fetchone()["total"]
    if new_aforo < total_sectores:
        raise HTTPException(
            status_code=409,
            detail=f"El aforo ({new_aforo}) no puede ser menor que la capacidad total de sectores ({total_sectores})",
        )

    new_pais      = datos.dir_pais      if datos.dir_pais      is not None else estadio["dir_pais"]
    new_localidad = datos.dir_localidad if datos.dir_localidad is not None else estadio["dir_localidad"]
    new_calle     = datos.dir_calle     if datos.dir_calle     is not None else estadio["dir_calle"]
    new_numero    = datos.dir_numero    if datos.dir_numero    is not None else estadio["dir_numero"]
    new_nombre    = datos.nombre        if datos.nombre        is not None else estadio["nombre"]

    try:
        cursor.execute(
            """
            UPDATE Estadio
            SET dir_pais = %s, dir_localidad = %s, dir_calle = %s, dir_numero = %s,
                nombre = %s, aforo = %s
            WHERE dir_pais = %s AND dir_localidad = %s AND dir_calle = %s AND dir_numero = %s
            """,
            (
                new_pais, new_localidad, new_calle, new_numero, new_nombre, new_aforo,
                estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"],
            ),
        )
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Conflicto al actualizar: dirección duplicada") from exc

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo FROM Estadio WHERE nombre = %s",
        (new_nombre,),
    )
    return cursor.fetchone()


@router.delete("/{nombre}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estadio(nombre: str, cursor=Depends(get_db), admin=Depends(require_admin)):
    cursor.execute("SELECT pais_sede FROM Admin WHERE usuario_mail = %s", (admin["mail"],))
    admin_row = cursor.fetchone()
    if not admin_row:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de administrador")

    cursor.execute(
        "SELECT dir_pais, dir_localidad, dir_calle, dir_numero FROM Estadio WHERE nombre = %s",
        (nombre,),
    )
    estadio = cursor.fetchone()
    if not estadio:
        raise HTTPException(status_code=404, detail="Estadio no encontrado")

    if _norm(admin_row["pais_sede"]) != _norm(estadio["dir_pais"]):
        raise HTTPException(status_code=403, detail="El admin solo puede eliminar estadios de su país sede")

    cursor.execute(
        """
        SELECT COUNT(*) AS cnt FROM Evento
        WHERE estadio_pais = %s AND estadio_localidad = %s
          AND estadio_calle = %s AND estadio_numero = %s
          AND cancelado = FALSE
        """,
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]),
    )
    if cursor.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=409, detail="No se puede eliminar: el estadio tiene eventos activos. Cancelá los eventos primero.")

    cursor.execute(
        "DELETE FROM Estadio WHERE dir_pais = %s AND dir_localidad = %s AND dir_calle = %s AND dir_numero = %s",
        (estadio["dir_pais"], estadio["dir_localidad"], estadio["dir_calle"], estadio["dir_numero"]),
    )



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
