# Autenticación y Autorización

## Visión general

El sistema usa **Auth0** como proveedor de identidad. Auth0 es un servicio externo que se encarga de:
- Almacenar contraseñas de forma segura (hashing, bcrypt, etc.)
- Emitir tokens JWT firmados con clave privada RSA
- Validar credenciales

El backend nunca ve ni almacena contraseñas. Solo interactúa con Auth0 vía API para crear usuarios, autenticarlos y actualizar metadatos.

---

## Roles del sistema

Hay tres roles definidos en `core/security.py`:

| Rol | Constante | Descripción |
|-----|-----------|-------------|
| `ADMIN` | `ROLE_ADMIN` | Administrador de un país sede. Crea estadios, eventos, gestiona funcionarios. Uno por país. |
| `FUNCIONARIO` | `ROLE_FUNCIONARIO` | Escanea QRs en la entrada al estadio. Asignado a sectores específicos. |
| `USUARIO_FINAL` | `ROLE_USUARIO_FINAL` | Comprador de entradas. Puede verificar identidad, comprar, transferir. |

---

## Flujo de autenticación (ROPG)

**ROPG** = Resource Owner Password Grant. Es un tipo de flujo OAuth 2.0 donde el usuario da su email/password directamente al backend, y el backend los pasa a Auth0 en nombre del usuario.

```
[Usuario] --(email+password)--> [Backend] --(ROPG request)--> [Auth0]
                                                                  |
                                              JWT token <---------+
                                [Usuario] <-- JWT token -- [Backend]
```

### ¿Por qué ROPG y no el flujo estándar de Auth0?

El flujo estándar de Auth0 redirige al usuario a una página de login de Auth0 (hosted login page). En este proyecto se optó por ROPG para mantener la UI de login dentro del propio frontend, sin redirecciones externas. La desventaja es que el backend maneja las credenciales en tránsito (aunque solo por milisegundos, antes de pasarlas a Auth0).

### Implementación en `auth0_service.py`

```python
async def authenticate_user(self, email: str, password: str) -> str:
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
    return resp.json()["access_token"]   # ← JWT firmado por Auth0
```

---

## El JWT (JSON Web Token)

Un JWT tiene tres partes separadas por `.`: `header.payload.signature`

**Header**: tipo de token y algoritmo de firma (RS256 en este caso).

**Payload** (decodificable sin clave): contiene claims como:
- `sub`: el Auth0 ID del usuario (ej. `"auth0|507f1f77bcf86cd799439011"`)
- `aud`: audience — con quién está hablando el token (debe coincidir con `AUTH0_AUDIENCE`)
- `iss`: issuer — quién emitió el token (`"https://tu-tenant.auth0.com/"`)
- `exp`: timestamp de expiración
- `https://mundial-auth/rol`: **claim personalizado** con el rol del usuario

**Signature**: firma RSA-256 que solo Auth0 puede generar. El backend la verifica usando la clave pública de Auth0.

### Claim personalizado de rol

Auth0 permite agregar datos extra al token mediante "Actions" (código que se ejecuta en el flujo de login). El claim `https://mundial-auth/rol` se agrega en Auth0 y contiene el valor del campo `app_metadata.rol` del usuario. Por convención Auth0 requiere que los claims personalizados tengan formato de URL para evitar colisiones con claims estándar.

```python
ROL_CLAIM = "https://mundial-auth/rol"   # nombre del claim en el JWT
```

---

## Verificación del token en el backend

### `core/security.py` — `decode_auth0_token()`

```python
def decode_auth0_token(token: str) -> dict:
    return jwt.decode(
        token,
        _get_jwks(),          # clave pública de Auth0
        algorithms=["RS256"],
        audience=settings.AUTH0_AUDIENCE,
        issuer=f"https://{settings.AUTH0_DOMAIN}/",
    )
```

**`_get_jwks()`**: descarga y cachea el JSON Web Key Set de Auth0 desde:
`https://{AUTH0_DOMAIN}/.well-known/jwks.json`

Este endpoint público de Auth0 contiene la clave pública RSA. El backend la usa para verificar que la firma del JWT es auténtica — es decir, que realmente lo emitió Auth0 y no fue falsificado.

Si el token es inválido, expirado, o firmado por otro issuer → `JWTError` → HTTP 401.

---

## Guards (protección de rutas) — `dependencies/auth.py`

Los guards son funciones que FastAPI inyecta automáticamente antes de ejecutar el handler. Se usan con `Depends()`.

### `get_current_user`
Extrae y valida el token Bearer del header `Authorization`. Luego busca el usuario en la base de datos:

```python
def get_current_user(credentials, cursor) -> dict:
    payload = decode_auth0_token(credentials.credentials)
    auth0_id = payload.get("sub")
    role = payload.get(ROL_CLAIM)

    cursor.execute(
        "SELECT mail, rol, nombre, apellido FROM Usuario WHERE auth0_id = %s",
        (auth0_id,),
    )
    user = cursor.fetchone()
    return user
```

**Por qué buscar en la base de datos si el token ya tiene el rol?** Porque el token podría estar desactualizado (ej. el usuario fue desactivado, o cambió de rol). La consulta a la BD asegura que el usuario todavía existe y está activo.

### `require_admin`
Llama a `get_current_user` y verifica que `user["rol"] == "ADMIN"`. Si no → HTTP 403.

### `require_funcionario`
Llama a `get_current_user` y verifica que el rol sea `ADMIN` o `FUNCIONARIO`. Los admins pueden hacer todo lo que hacen los funcionarios.

### `require_any_role`
Solo verifica que el usuario esté autenticado (cualquier rol válido). Equivale a `get_current_user` pero con nombre semántico.

### Ejemplo de uso en un endpoint:
```python
@router.post("/estadios/")
def create_estadio(
    estadio: EstadioCreate,
    cursor=Depends(get_db),
    admin=Depends(require_admin),   # ← si no es ADMIN, FastAPI devuelve 403 antes de entrar
):
    ...
```

---

## Flujo completo: Registro

```
1. Frontend envía: { email, password, nombre, apellido, doc_*, dir_*, telefonos }
2. Backend verifica que el email no exista ya en la BD
3. Backend llama Auth0 Management API para crear el usuario:
   - Guarda en Auth0: email, password (hasheado), nombre, app_metadata.rol = "USUARIO_FINAL"
   - Auth0 devuelve el auth0_id (ej. "auth0|abc123")
4. Backend inserta en MySQL:
   - INSERT INTO Usuario (mail, auth0_id, nombre, rol, dir_*, doc_*) ...
   - INSERT INTO UsuarioTelefono por cada teléfono
   - INSERT INTO UsuarioFinal (usuario_mail) con estado_verificacion = 'PENDIENTE'
5. Si falla el INSERT en MySQL → Backend llama Auth0 para BORRAR el usuario (rollback compensatorio)
6. Backend hace ROPG para obtener el JWT del nuevo usuario
7. Devuelve: { access_token, role, mail, estado_verificacion: "PENDIENTE" }
```

---

## Flujo completo: Login

```
1. Frontend envía: { email, password }
2. Backend llama Auth0 con ROPG → obtiene JWT
3. Decodifica el JWT para extraer el auth0_id (campo "sub")
4. Busca en BD: SELECT mail, rol, estado_verificacion WHERE auth0_id = auth0_id
5. Devuelve: { access_token, role, mail, estado_verificacion }
```

**¿Por qué decodificar el JWT para obtener el auth0_id?** La función `extract_sub(token)` decodifica el payload del JWT sin verificar la firma (solo base64 decode). Esto es seguro en este contexto porque el token ACABA de venir de Auth0 directamente. No se confiaría en un token que llegara de fuera sin verificar.

---

## Promover a ADMIN (3 pasos obligatorios)

El rol ADMIN requiere actualizar tres lugares distintos. Omitir cualquiera produce errores silenciosos:

**Paso 1 — Auth0 Dashboard**
Users → seleccionar usuario → Edit → App Metadata: `{ "rol": "ADMIN" }`
Sin esto el token sigue diciendo `USUARIO_FINAL` y `get_current_user` rechaza la request.

**Paso 2 — BD: rol + borrar perfil de usuario final**
```sql
UPDATE Usuario SET rol = 'ADMIN' WHERE mail = 'usuario@ejemplo.com';
DELETE FROM UsuarioFinal WHERE usuario_mail = 'usuario@ejemplo.com';
```
Sin el UPDATE, `require_admin` devuelve 403 aunque el token diga ADMIN (la autorización lee el rol de la BD, no del token).

**Paso 3 — BD: crear perfil de admin con país de jurisdicción**
```sql
INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo)
VALUES ('usuario@ejemplo.com', 'Canada', CURDATE());
```
Sin esto, cualquier endpoint que llame `_get_admin_pais_sede()` (estadios, eventos, reportes) devuelve 403 "El usuario no tiene perfil de administrador", aunque el rol sea correcto.

Ver `backend/sql/03_admin_seed.sql` para el ejemplo listo para ejecutar.

---

## Promover a funcionario

Cuando un admin promueve a un usuario a FUNCIONARIO:

```
1. Verificar que el usuario existe y es USUARIO_FINAL
2. DELETE FROM UsuarioFinal (pierde el perfil de usuario final)
3. UPDATE Usuario SET rol = 'FUNCIONARIO'
4. INSERT INTO Funcionario (usuario_mail, numero_legajo)
5. Llamar Auth0 Management API para actualizar app_metadata.rol = "FUNCIONARIO"
```

El paso 5 es crítico: si no se actualiza en Auth0, el próximo JWT que emita Auth0 para ese usuario seguirá diciendo `USUARIO_FINAL`. La actualización en Auth0 asegura que el próximo login devuelva el rol correcto.

---

## Verificación de identidad

Los `USUARIO_FINAL` tienen un campo `estado_verificacion` que puede ser:
- `PENDIENTE` — recién registrado, no puede comprar entradas
- `VERIFICADO` — puede comprar entradas
- `RECHAZADO` — (no implementado en la UI, pero existe en el esquema)

El endpoint `PATCH /usuarios/{mail}/verificar` permite al admin verificar a un usuario, o al propio usuario verificarse a sí mismo (caso de uso: algún flujo de auto-verificación).

La verificación se chequea en `POST /ventas/` antes de crear la venta:
```python
if not uf or uf["estado_verificacion"] != "VERIFICADO":
    raise HTTPException(403, "Identidad no verificada")
```

---

## Jurisdicción de administradores

Cada admin tiene un `pais_sede` en la tabla `Admin`. Solo puede crear/editar/eliminar estadios y eventos de ese país.

La comparación se hace normalizando los strings para evitar problemas de mayúsculas y acentos:

```python
def _norm(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()

# "Canada" y "canada" y "Canadá" → todos se normalizan a "canada"
if _norm(admin_pais_sede) != _norm(estadio_pais):
    raise HTTPException(403, "El admin solo puede gestionar estadios de su país sede")
```

`unicodedata.normalize("NFD", s)` descompone los caracteres acentuados (ej. "á" → "a" + combining accent). `.encode("ascii", "ignore")` descarta los combining accents. `.lower()` normaliza mayúsculas.
