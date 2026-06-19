# Endpoints: /auth

## POST /auth/register

**¿Qué hace?** Registra un nuevo usuario USUARIO_FINAL en el sistema.

**Acceso**: público (sin token)

**Body (JSON)**:
```json
{
  "email": "juan@example.com",
  "password": "MiClave123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "doc_pais": "Uruguay",
  "doc_tipo": "CI",
  "doc_numero": "12345678",
  "dir_pais": "Uruguay",
  "dir_localidad": "Montevideo",
  "dir_calle": "Av. 18 de Julio",
  "dir_numero": "1234",
  "dir_codigo_postal": "11200",
  "telefonos": ["+59899123456"]
}
```

**Validaciones de Pydantic**:
- `email` debe ser formato email válido (`EmailStr`)
- `telefonos` debe tener al menos 1 elemento no vacío (validador `al_menos_un_telefono`)

**Proceso**:
1. Verifica que el email no exista en `Usuario` → 400 si ya existe
2. Crea el usuario en Auth0 via Management API → obtiene `auth0_id`
3. Inserta en `Usuario`, `UsuarioTelefono`, `UsuarioFinal`
4. Si el INSERT falla → llama `auth0_service.delete_user(auth0_id)` para hacer rollback en Auth0
5. Autentica con ROPG → obtiene JWT
6. Devuelve JWT + datos

**Respuesta 201**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "USUARIO_FINAL",
  "mail": "juan@example.com",
  "estado_verificacion": "PENDIENTE"
}
```

**Errores**:
- 400: Email ya registrado / Password no cumple requisitos de Auth0
- 500: Error al guardar en base de datos

---

## POST /auth/login

**¿Qué hace?** Inicia sesión con email y contraseña. Devuelve un JWT.

**Acceso**: público (sin token)

**Body (JSON)**:
```json
{
  "email": "juan@example.com",
  "password": "MiClave123!"
}
```

**Proceso**:
1. Llama Auth0 ROPG con las credenciales → si son incorrectas, Auth0 devuelve 401 → backend devuelve 401
2. Decodifica el JWT para extraer el `sub` (auth0_id)
3. Busca el usuario en `Usuario JOIN UsuarioFinal` usando el `auth0_id`
4. Devuelve JWT + rol + estado_verificacion

**Respuesta 200**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "ADMIN",
  "mail": "admin@pais.com",
  "estado_verificacion": null
}
```

`estado_verificacion` es null para ADMIN y FUNCIONARIO (solo existe en `UsuarioFinal`).

**Errores**:
- 401: Credenciales incorrectas (viene de Auth0)
- 404: El usuario existe en Auth0 pero no en la base de datos local

**Nota sobre el frontend**: el interceptor de Axios no redirige a /login si el error 401 viene de `/auth/login`. Esto permite que el toast de error "Credenciales incorrectas" se muestre correctamente.

---

## GET /auth/me

**¿Qué hace?** Devuelve los datos básicos del usuario autenticado según su token.

**Acceso**: cualquier rol autenticado

**Header**: `Authorization: Bearer {token}`

**Proceso**:
1. `get_current_user` valida el token y busca el usuario en la BD
2. Devuelve `mail`, `nombre`, `apellido`, `rol`

**Respuesta 200**:
```json
{
  "mail": "juan@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "USUARIO_FINAL"
}
```

**Uso**: el frontend lo llama al iniciar para verificar que el token almacenado sigue siendo válido.

**Errores**:
- 401: Token inválido o expirado
- 404: Usuario no encontrado en BD (caso raro: eliminado manualmente de la BD)
