from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Roles válidos — coinciden exactamente con el ENUM de la columna `rol` en Usuario
ROLE_ADMIN         = "ADMIN"
ROLE_FUNCIONARIO   = "FUNCIONARIO"
ROLE_USUARIO_FINAL = "USUARIO_FINAL"

ALL_ROLES = {ROLE_ADMIN, ROLE_FUNCIONARIO, ROLE_USUARIO_FINAL}


# Utilidades de contraseña --------------------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# JWT ------------------------------------------------------------------------------
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
            algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


# Dependencia base -----------------------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Valida el token y devuelve {"mail": str, "role": str}."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    mail = payload.get("sub")
    role = payload.get("role")

    if not mail or role not in ALL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: faltan campos obligatorios",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"mail": mail, "role": role}


# Dependencias de rol -----------------------------------------------------------------
def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de administrador",
        )
    return user


def require_funcionario(user: dict = Depends(get_current_user)) -> dict:
    """Permite admin y funcionario (admin puede hacer todo lo que hace un funcionario)."""
    if user["role"] not in {ROLE_ADMIN, ROLE_FUNCIONARIO}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de funcionario",
        )
    return user


def require_any_role(user: dict = Depends(get_current_user)) -> dict:
    """Cualquier usuario autenticado con un rol válido puede pasar."""
    return user  # get_current_user ya valida que el rol esté en ALL_ROLES
