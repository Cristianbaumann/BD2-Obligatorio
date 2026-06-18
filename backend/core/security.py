import httpx
from jose import jwt, JWTError
from core.config import settings
from fastapi import HTTPException, status

ROLE_ADMIN         = "ADMIN"
ROLE_FUNCIONARIO   = "FUNCIONARIO"
ROLE_USUARIO_FINAL = "USUARIO_FINAL"

ALL_ROLES = {ROLE_ADMIN, ROLE_FUNCIONARIO, ROLE_USUARIO_FINAL}

ROL_CLAIM = "https://mundial-auth/rol"

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        resp = httpx.get(f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json", timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


def decode_auth0_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            _get_jwks(),
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
