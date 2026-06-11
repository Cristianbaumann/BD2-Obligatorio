from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from core.config import settings
from fastapi import HTTPException, status

ROLE_ADMIN         = "ADMIN"
ROLE_FUNCIONARIO   = "FUNCIONARIO"
ROLE_USUARIO_FINAL = "USUARIO_FINAL"

ALL_ROLES = {ROLE_ADMIN, ROLE_FUNCIONARIO, ROLE_USUARIO_FINAL}


def create_access_token(mail: str, role: str) -> str:
    if role not in ALL_ROLES:
        raise ValueError(f"Rol inválido: {role}")
    payload = {
        "sub": mail,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
