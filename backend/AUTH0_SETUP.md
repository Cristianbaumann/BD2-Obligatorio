# Auth0 Setup — Configuración y Troubleshooting

## Arquitectura

Dos apps en Auth0, propósitos distintos:

| App | Tipo | Uso | Credenciales en .env |
|-----|------|-----|----------------------|
| Obligatorio BD2 | Machine to Machine | Management API (crear/eliminar usuarios) | AUTH0_MGMT_CLIENT_ID / AUTH0_MGMT_CLIENT_SECRET |
| Ticketing Mundial 2026 | Regular Web Application | Verificar credenciales en login (ROPG) | AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET |

## Configuración requerida en Auth0

### Tenant Settings (Settings → General → Advanced)
- **Default Directory**: `Username-Password-Authentication`
- **Flag `allow_legacy_ro_grant_types`**: `true` (no visible en UI, setear via Management API)

```python
# Script para setear el flag (ejecutar una sola vez)
import httpx, asyncio

async def main():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            'https://{DOMAIN}/oauth/token',
            json={'grant_type': 'client_credentials', 'client_id': MGMT_CLIENT_ID,
                  'client_secret': MGMT_CLIENT_SECRET, 'audience': f'https://{DOMAIN}/api/v2/'}
        )
        token = r.json()['access_token']
        r2 = await client.patch(
            f'https://{DOMAIN}/api/v2/tenants/settings',
            headers={'Authorization': f'Bearer {token}'},
            json={'flags': {'allow_legacy_ro_grant_types': True}}
        )
        print(r2.status_code, r2.text[:200])

asyncio.run(main())
```

### App "Ticketing Mundial 2026" (Regular Web Application)
- **Application Type**: Regular Web Application (NO Single Page Application)
- **Grant Types** (Advanced Settings → Grant Types): Password ✓
- **Token Endpoint Auth Method** (Credentials tab): Client Secret (Post)
- **Connections** (Connections tab): Username-Password-Authentication ✓

### API "Ticketting mundial 2026"
- **Application Access** tab → "Ticketing Mundial 2026" → User-delegated Access ✓ (toggle verde)

### Action "Inject Role Claim" (Actions → Library → Custom)

Tipo: **Login / Post Login**. Debe estar en el flow "Login" y deployada.

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const rol = event.user.app_metadata?.rol;
  if (rol) {
    api.accessToken.setCustomClaim('https://mundial-auth/rol', rol);
  }
};
```

Agrega el rol como custom claim en el access token. Sin esto, el backend rechaza todos los tokens con 401.

**Namespace obligatorio:** Auth0 exige URL como prefijo para claims custom (`https://mundial-auth/rol`), de lo contrario los silencia.

### Roles de usuarios

El rol vive en `app_metadata.rol` de cada usuario en Auth0 **y** en `Usuario.rol` de la BD. Ambos deben estar sincronizados.

- Register vía API → siempre crea `USUARIO_FINAL` (automático, el backend lo setea)
- Promover a ADMIN o FUNCIONARIO → manual:
  1. Auth0 Dashboard → Users → Edit → App Metadata: `{ "rol": "ADMIN" }`
  2. BD: `UPDATE Usuario SET rol = 'ADMIN' WHERE mail = '...';`

### Usuarios creados via Management API
- Siempre incluir `"email_verified": true` en el body del POST a `/api/v2/users`
- Sin esto, Auth0 bloquea el login hasta que el usuario verifique el email

## Flow ROPG implementado

```
POST /oauth/token
{
  "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
  "realm": "Username-Password-Authentication",
  "username": email,
  "password": password,
  "client_id": AUTH0_CLIENT_ID,
  "client_secret": AUTH0_CLIENT_SECRET,
  "audience": AUTH0_AUDIENCE,
  "scope": "openid"
}
```

Nota: usar `realm` (no `connection`) y el grant type extendido de Auth0, no el estándar `password`.

## Troubleshooting

| Síntoma en log Auth0 | Causa | Solución |
|----------------------|-------|----------|
| `connection: N/A`, `connection_id: ""` | `grant_type=password` sin Default Directory funcional | Usar `password-realm` + `realm` parameter |
| `client_name: null` | Client ID incorrecto (typo `PB1` vs `PBl`) o app no existe | Verificar client_id carácter por carácter desde Auth0 dashboard |
| `access_denied / Unauthorized` (con connection N/A) | Flag `allow_legacy_ro_grant_types` no habilitado | Setear via Management API |
| `Client not authorized to access resource server` | App sin acceso al API en Application Access | APIs → Ticketting mundial 2026 → Application Access → habilitar |
| `access_denied` con email/pass correctos | `email_verified: false` | Marcar manualmente en Auth0 Users o agregar `email_verified: true` al create |
| App type SPA con client_secret | SPA es public client, no usa secret | Cambiar a Regular Web Application + Token Endpoint Auth Method = Client Secret (Post) |

## Variables .env requeridas

```env
AUTH0_DOMAIN="dev-ks16wg37q4clzdxd.us.auth0.com"
AUTH0_MGMT_CLIENT_ID="<M2M client id>"
AUTH0_MGMT_CLIENT_SECRET="<M2M client secret>"
AUTH0_CLIENT_ID="<Regular Web App client id>"   # OJO: copiar de Auth0, no tipear a mano
AUTH0_CLIENT_SECRET="<Regular Web App client secret>"
AUTH0_AUDIENCE="https://api.mundial2026"
```

**Importante**: copiar el client_id desde Auth0 dashboard directamente (copy button), nunca tipear a mano — caracteres como `l` (ele) y `1` (uno) son indistinguibles en muchas fuentes.
