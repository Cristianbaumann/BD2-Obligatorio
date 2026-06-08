from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Roles válidos (deben coincidir exactamente con los valores en la BD) -------------
ROLE_ADMIN        = "admin"
ROLE_FUNCIONARIO  = "funcionario"
ROLE_USUARIO_FINAL = "usuarioFinal"   # ← igual que en tu BD

ALL_ROLES = {ROLE_ADMIN, ROLE_FUNCIONARIO, ROLE_USUARIO_FINAL}


# Utilidades de contraseña --------------------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# JWT ------------------------------------------------------------------------------
def create_access_token(user_id: int, role: str) -> str:
    """
    Recibe explícitamente user_id y role para evitar que el llamador
    olvide incluir alguno de los dos campos en el payload.
    """
    if role not in ALL_ROLES:
        raise ValueError(f"Rol inválido: {role}")

    payload = {
        "sub": str(user_id),
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
    """Valida el token y devuelve {"user_id": int, "role": str}."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    user_id = payload.get("sub")
    role    = payload.get("role")

    if user_id is None or role not in ALL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: faltan campos obligatorios",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return {"user_id": int(user_id), "role": role}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )


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
