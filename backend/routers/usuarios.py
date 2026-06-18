from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_db
from dependencies.auth import get_current_user, require_admin, require_funcionario
from schemas.usuario import MeOut, RolEnum, EstadoVerificacionEnum, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/", response_model=List[UsuarioOut])
def list_usuarios(
    rol: Optional[RolEnum] = Query(None),
    estado_verificacion: Optional[EstadoVerificacionEnum] = Query(None),
    pais: Optional[str] = Query(None, description="Filtrar por dir_pais"),
    cursor=Depends(get_db),
    _=Depends(require_admin),
):
    where, params = [], []

    if rol:
        where.append("u.rol = %s")
        params.append(rol.value)
    if pais:
        where.append("u.dir_pais = %s")
        params.append(pais)
    if estado_verificacion:
        where.append("uf.estado_verificacion = %s")
        params.append(estado_verificacion.value)

    sql = """
        SELECT u.mail, u.nombre, u.apellido, u.rol,
               u.doc_pais, u.doc_tipo, u.doc_numero,
               u.dir_pais, u.dir_localidad, u.dir_calle, u.dir_numero, u.dir_codigo_postal,
               uf.estado_verificacion
        FROM Usuario u
        LEFT JOIN UsuarioFinal uf ON uf.usuario_mail = u.mail
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY u.mail"

    cursor.execute(sql, params)
    return cursor.fetchall()


@router.get("/me", response_model=MeOut)
def get_me(cursor=Depends(get_db), user=Depends(get_current_user)):
    cursor.execute(
        """
        SELECT u.mail, u.nombre, u.apellido, u.rol,
               u.doc_pais, u.doc_tipo, u.doc_numero,
               u.dir_pais, u.dir_localidad, u.dir_calle, u.dir_numero, u.dir_codigo_postal,
               uf.estado_verificacion
        FROM Usuario u
        LEFT JOIN UsuarioFinal uf ON uf.usuario_mail = u.mail
        WHERE u.mail = %s
        """,
        (user["mail"],),
    )
    row = cursor.fetchone()

    cursor.execute(
        "SELECT telefono FROM UsuarioTelefono WHERE usuario_mail = %s",
        (user["mail"],),
    )
    telefonos = [r["telefono"] for r in cursor.fetchall()]

    return {**row, "telefonos": telefonos}


@router.put("/me", status_code=status.HTTP_200_OK)
def update_me(
    datos: UsuarioUpdate,
    cursor=Depends(get_db),
    user=Depends(get_current_user),
):
    sets, params = [], []
    for field in ("dir_pais", "dir_localidad", "dir_calle", "dir_numero", "dir_codigo_postal"):
        val = getattr(datos, field)
        if val is not None:
            sets.append(f"{field} = %s")
            params.append(val)

    if sets:
        params.append(user["mail"])
        cursor.execute(f"UPDATE Usuario SET {', '.join(sets)} WHERE mail = %s", params)

    if datos.telefonos is not None:
        cursor.execute("DELETE FROM UsuarioTelefono WHERE usuario_mail = %s", (user["mail"],))
        for tel in datos.telefonos:
            cursor.execute(
                "INSERT INTO UsuarioTelefono (usuario_mail, telefono) VALUES (%s, %s)",
                (user["mail"], tel),
            )

    return {"detail": "Datos actualizados"}


@router.patch("/{mail}/verificar", status_code=status.HTTP_200_OK)
def verificar_usuario(
    mail: str,
    cursor=Depends(get_db),
    user=Depends(get_current_user),
):
    if user["rol"] != "ADMIN" and user["mail"] != mail:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permiso")

    cursor.execute(
        "SELECT usuario_mail, estado_verificacion FROM UsuarioFinal WHERE usuario_mail = %s",
        (mail,),
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario final no encontrado")

    if row["estado_verificacion"] == "VERIFICADO":
        raise HTTPException(status_code=409, detail="El usuario ya está verificado")

    cursor.execute(
        "UPDATE UsuarioFinal SET estado_verificacion = 'VERIFICADO' WHERE usuario_mail = %s",
        (mail,),
    )
    return {"mail": mail, "estado_verificacion": "VERIFICADO"}

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