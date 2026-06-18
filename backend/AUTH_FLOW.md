# Flujo de Autenticación y Autorización

## Stack

- **Auth0** — verifica contraseñas, emite JWTs firmados (RS256), guarda `app_metadata.rol`
- **Base de datos propia** — fuente de verdad para datos de usuario y rol (tabla `Usuario.rol`)
- **Frontend** — SPA React, guarda token en `sessionStorage`

---

## Login

```
POST /auth/login  { email, password }
```

1. Backend llama Auth0 ROPG (`/oauth/token`, grant `password-realm`)
2. Auth0 verifica credenciales → devuelve `access_token` (JWT RS256)
3. Backend extrae `sub` del JWT → es el `auth0_id` (ej: `auth0|abc123`)
4. Backend busca `SELECT mail, rol FROM Usuario WHERE auth0_id = ?`
5. Devuelve el token de Auth0 directo + `role` y `mail` en el body

**Response:**
```json
{ "access_token": "<JWT de Auth0>", "role": "ADMIN", "mail": "user@example.com" }
```

**Frontend** (`authStore.js`):
- Guarda token en `sessionStorage`
- Extrae rol del claim `https://mundial-auth/rol` del payload JWT

---

## Register

```
POST /auth/register  { email, password, nombre, apellido, doc_*, dir_*, telefonos[] }
```

1. Verifica que el email no exista en BD
2. Crea usuario en Auth0 con `app_metadata: { "rol": "USUARIO_FINAL" }` → obtiene `auth0_id`
3. Inserta en BD: `Usuario`, `UsuarioTelefono`, `UsuarioFinal`
4. Si falla la BD → borra el usuario de Auth0 (rollback manual)
5. Hace ROPG con las credenciales recibidas → obtiene JWT de Auth0
6. Devuelve ese JWT (igual que login)

**Rol fijo en register:** siempre `USUARIO_FINAL`. No existe endpoint público para auto-promover.

---

## Validación de token en cada request

**Archivo:** `backend/dependencies/auth.py` → `get_current_user()`

1. Extrae Bearer token del header `Authorization`
2. Llama `decode_auth0_token(token)` en `core/security.py`
3. `decode_auth0_token` valida con JWKS de Auth0 (`/.well-known/jwks.json`, RS256, cacheado en memoria)
4. Extrae `sub` (auth0_id) y `https://mundial-auth/rol` del payload
5. Verifica que el rol esté en `{ADMIN, FUNCIONARIO, USUARIO_FINAL}`
6. **Busca el usuario en BD por `auth0_id`** — el `user["rol"]` de la BD es el que usa para autorización
7. Devuelve el dict `{ mail, rol, nombre, apellido }` de la BD

**Autorización real viene de la BD, no del JWT.** El claim del JWT solo se usa como gate de entrada.

---

## Custom claim en Auth0

Auth0 Action (Post Login, ya deployada):
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const rol = event.user.app_metadata?.rol;
  if (rol) {
    api.accessToken.setCustomClaim('https://mundial-auth/rol', rol);
  }
};
```

El claim usa namespace URL (`https://mundial-auth/rol`) por requerimiento de Auth0.

---

## Crear usuarios ADMIN o FUNCIONARIO

Register siempre crea `USUARIO_FINAL`. Para crear admins/funcionarios:

### Opción A — Setup inicial (manual, una sola vez)

1. Hacer register normal → el usuario queda como `USUARIO_FINAL`
2. En **Auth0 Dashboard** → User Management → Users → buscar el usuario → Edit → App Metadata:
   ```json
   { "rol": "ADMIN" }
   ```
3. En **BD**: `UPDATE Usuario SET rol = 'ADMIN' WHERE mail = 'user@example.com';`

Ambos pasos son necesarios: Auth0 para el token, BD para la autorización.

## Seguridad — decisiones conscientes

### sessionStorage vs httpOnly cookie

**Decisión:** token en `sessionStorage`.

**Riesgo teórico:** XSS podría leer el token. Mitigado por dos capas:
1. React escapa JSX por defecto → superficie XSS muy reducida (no se usa `dangerouslySetInnerHTML`)
2. CSP `connect-src` bloquea exfiltración del token a servidores externos aunque haya XSS

**La alternativa en producción** sería cookie `httpOnly + Secure + SameSite=Strict` — JS no puede leerla, elimina el vector completamente. Requiere backend seteando la cookie y protección CSRF. Complejidad no justificada para el scope del obligatorio.

**Trade-off aceptado:** patrón estándar de SPA con JWT, con CSP como mitigación activa del vector de exfiltración.

### TTL del access token

Actualmente: **24 horas** (configurable en Auth0 Dashboard → APIs → tu API → Token Expiration).

Recomendado en producción: 1-2 horas. Reduce la ventana de exposición si el token se filtra. Cambio trivial en el dashboard, no requiere código.

### Content Security Policy (CSP)

Implementada en `frontend/index.html` via meta tag:

```
connect-src 'self' http://localhost:8000 %VITE_API_URL%;
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
```

`%VITE_API_URL%` es reemplazado por Vite en build con el valor real del env var; en dev sin esa variable, el browser ignora el token inválido sin romper nada.

**Qué protege:** incluso si existe una vulnerabilidad XSS, `connect-src` bloquea que un script malicioso haga `fetch`/`XHR` a dominios externos para exfiltrar el token.

**Limitación:** `script-src 'unsafe-inline'` es necesario para el HMR de Vite en desarrollo, lo que reduce la protección contra scripts inline. La directiva más importante (`connect-src`) no se ve afectada por esto.

### TTL del access token

Actualmente: **24 horas** (configurable en Auth0 Dashboard → APIs → tu API → Token Expiration).

Recomendado en producción: 1-2 horas. Reduce la ventana de exposición si el token se filtra. Cambio trivial en el dashboard, no requiere código.

### Rotación de JWKS

JWKS cacheado en memoria para toda la vida del proceso. Si Auth0 rota claves (raro, con overlap), el backend falla hasta reiniciar. Aceptable para el obligatorio; en prod se agrega TTL de ~12h al cache.
