import base64
import json
import logging
import time

import httpx
from fastapi import HTTPException, status

from core.config import settings

logger = logging.getLogger(__name__)


class Auth0Service:
    def __init__(self):
        self._mgmt_token: str | None = None
        self._mgmt_token_exp: float = 0

    async def _get_management_token(self) -> str:
        if self._mgmt_token and time.time() < self._mgmt_token_exp - 60:
            return self._mgmt_token

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://{settings.AUTH0_DOMAIN}/oauth/token",
                    json={
                        "grant_type": "client_credentials",
                        "client_id": settings.AUTH0_MGMT_CLIENT_ID,
                        "client_secret": settings.AUTH0_MGMT_CLIENT_SECRET,
                        "audience": f"https://{settings.AUTH0_DOMAIN}/api/v2/",
                    },
                )
        except httpx.RequestError as e:
            logger.error("Auth0 management token request failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"No se pudo conectar a Auth0: {e}",
            )

        if resp.status_code != 200:
            logger.error("Auth0 management token error %s: %s", resp.status_code, resp.text)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Auth0 management token error {resp.status_code}: {resp.text}",
            )

        data = resp.json()
        self._mgmt_token = data["access_token"]
        self._mgmt_token_exp = time.time() + data.get("expires_in", 86400)
        return self._mgmt_token

    async def create_user(self, email: str, password: str, nombre: str, apellido: str) -> str:
        """Create user in Auth0. Returns auth0_id (e.g. 'auth0|abc123')."""
        mgmt_token = await self._get_management_token()

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://{settings.AUTH0_DOMAIN}/api/v2/users",
                headers={"Authorization": f"Bearer {mgmt_token}"},
                json={
                    "connection": "Username-Password-Authentication",
                    "email": email,
                    "password": password,
                    "name": f"{nombre} {apellido}",
                    "email_verified": True,
                },
            )

        if resp.status_code == 409:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email ya registrado en Auth0",
            )
        if resp.status_code != 201:
            detail = resp.json().get("message", "Error al crear usuario en Auth0")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

        return resp.json()["user_id"]

    async def authenticate_user(self, email: str, password: str) -> str:
        """Validate credentials via ROPG. Returns auth0_id on success, raises 401 on failure."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://{settings.AUTH0_DOMAIN}/oauth/token",
                json={
                    "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
                    "realm": "Username-Password-Authentication",
                    "username": email,
                    "password": password,
                    "client_id": settings.AUTH0_CLIENT_ID,
                    "client_secret": settings.AUTH0_CLIENT_SECRET,
                    "audience": settings.AUTH0_AUDIENCE,
                    "scope": "openid",
                },
            )

        if resp.status_code != 200:
            logger.error("Auth0 ROPG error %s: %s", resp.status_code, resp.text)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Auth0: {resp.text}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return _extract_sub(resp.json()["access_token"])

    async def delete_user(self, auth0_id: str) -> None:
        """Delete user from Auth0. Used as compensating rollback if DB insert fails."""
        mgmt_token = await self._get_management_token()
        async with httpx.AsyncClient() as client:
            await client.delete(
                f"https://{settings.AUTH0_DOMAIN}/api/v2/users/{auth0_id}",
                headers={"Authorization": f"Bearer {mgmt_token}"},
            )


def _extract_sub(token: str) -> str:
    payload_b64 = token.split(".")[1]
    payload_b64 += "=" * (4 - len(payload_b64) % 4)
    return json.loads(base64.urlsafe_b64decode(payload_b64))["sub"]


auth0_service = Auth0Service()
