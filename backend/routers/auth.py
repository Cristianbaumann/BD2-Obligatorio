import logging
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)

from database import get_db
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from core.security import ROLE_USUARIO_FINAL
from dependencies.auth import get_current_user
from services.auth0_service import auth0_service, extract_sub

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, cursor=Depends(get_db)):
    cursor.execute("SELECT mail FROM Usuario WHERE mail = %s", (body.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")

    auth0_id = await auth0_service.create_user(body.email, body.password, body.nombre, body.apellido)

    try:
        cursor.execute(
            """
            INSERT INTO Usuario
                (mail, auth0_id, nombre, apellido, rol,
                 doc_pais, doc_tipo, doc_numero,
                 dir_pais, dir_localidad, dir_calle, dir_numero, dir_codigo_postal)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                body.email, auth0_id, body.nombre, body.apellido, ROLE_USUARIO_FINAL,
                body.doc_pais, body.doc_tipo, body.doc_numero,
                body.dir_pais, body.dir_localidad, body.dir_calle,
                body.dir_numero, body.dir_codigo_postal,
            ),
        )
        for tel in body.telefonos:
            cursor.execute(
                "INSERT INTO UsuarioTelefono (usuario_mail, telefono) VALUES (%s, %s)",
                (body.email, tel),
            )
        cursor.execute(
            "INSERT INTO UsuarioFinal (usuario_mail) VALUES (%s)",
            (body.email,),
        )
    except Exception as e:
        logger.error("DB insert failed during register: %s", e, exc_info=True)
        await auth0_service.delete_user(auth0_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar usuario en base de datos: {e}",
        )

    auth0_token = await auth0_service.authenticate_user(body.email, body.password)
    return AuthResponse(access_token=auth0_token, role=ROLE_USUARIO_FINAL, mail=body.email, estado_verificacion="PENDIENTE")


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, cursor=Depends(get_db)):
    auth0_token = await auth0_service.authenticate_user(body.email, body.password)
    auth0_id = extract_sub(auth0_token)

    cursor.execute(
        """
        SELECT u.mail, u.rol, uf.estado_verificacion
        FROM Usuario u
        LEFT JOIN UsuarioFinal uf ON uf.usuario_mail = u.mail
        WHERE u.auth0_id = %s
        """,
        (auth0_id,),
    )
    user = cursor.fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado en el sistema",
        )

    return AuthResponse(
        access_token=auth0_token,
        role=user["rol"],
        mail=user["mail"],
        estado_verificacion=user.get("estado_verificacion"),
    )


@router.get("/me", response_model=UserResponse)
def me(user: dict = Depends(get_current_user)):
    return user
