from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.security import decode_token, ROLE_ADMIN, ROLE_FUNCIONARIO, ALL_ROLES
from database import get_db

_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    cursor=Depends(get_db),
) -> dict:
    payload = decode_token(credentials.credentials)
    mail = payload.get("sub")
    role = payload.get("role")

    if not mail or role not in ALL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: faltan campos obligatorios",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cursor.execute(
        "SELECT mail, rol, nombre, apellido FROM Usuario WHERE mail = %s",
        (mail,),
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
