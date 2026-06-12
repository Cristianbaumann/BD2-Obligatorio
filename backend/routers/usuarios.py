from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_db
from dependencies.auth import get_current_user, require_admin
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
    _=Depends(require_admin),
):
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
