from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.security import decode_auth0_token, ROL_CLAIM, ROLE_ADMIN, ROLE_FUNCIONARIO, ALL_ROLES
from database import get_db

_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    cursor=Depends(get_db),
) -> dict:
    payload = decode_auth0_token(credentials.credentials)
    auth0_id = payload.get("sub")  # Auth0 puts auth0_id as sub, not email
    role = payload.get(ROL_CLAIM)

    if not auth0_id or role not in ALL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: faltan campos obligatorios",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cursor.execute(
        "SELECT mail, rol, nombre, apellido FROM Usuario WHERE auth0_id = %s",
        (auth0_id,),
    )
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["rol"] != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de administrador",
        )
    return user


def require_funcionario(user: dict = Depends(get_current_user)) -> dict:
    if user["rol"] not in {ROLE_ADMIN, ROLE_FUNCIONARIO}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de funcionario",
        )
    return user


def require_any_role(user: dict = Depends(get_current_user)) -> dict:
    return user
