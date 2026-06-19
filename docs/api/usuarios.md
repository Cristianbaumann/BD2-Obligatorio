# Endpoints: /usuarios

## GET /usuarios/

**¿Qué hace?** Lista todos los usuarios registrados. Acepta filtros opcionales.

**Acceso**: ADMIN

**Query params**:
- `rol` (opcional): `ADMIN`, `FUNCIONARIO`, `USUARIO_FINAL`
- `estado_verificacion` (opcional): `PENDIENTE`, `VERIFICADO`, `RECHAZADO`
- `pais` (opcional): filtra por `dir_pais`

**SQL generado dinámicamente**:
```sql
SELECT u.mail, u.nombre, u.apellido, u.rol,
       u.doc_pais, u.doc_tipo, u.doc_numero,
       u.dir_pais, u.dir_localidad, u.dir_calle, u.dir_numero, u.dir_codigo_postal,
       uf.estado_verificacion
FROM Usuario u
LEFT JOIN UsuarioFinal uf ON uf.usuario_mail = u.mail
[WHERE u.rol = ? AND uf.estado_verificacion = ? AND u.dir_pais = ?]
ORDER BY u.mail
```

El WHERE se construye dinámicamente: solo se agregan las condiciones de los filtros que se pasaron. El `LEFT JOIN` con `UsuarioFinal` permite que ADMINs y FUNCIONARIOs también aparezcan (con `estado_verificacion = NULL`).

**Respuesta 200**: array de objetos usuario.

---

## GET /usuarios/me

**¿Qué hace?** Devuelve el perfil completo del usuario autenticado, incluyendo teléfonos y saldo.

**Acceso**: cualquier rol autenticado

**Proceso**: hace dos queries:
1. `Usuario LEFT JOIN UsuarioFinal WHERE mail = %s` → datos principales + saldo
2. `SELECT telefono FROM UsuarioTelefono WHERE usuario_mail = %s` → lista de teléfonos

Las dos queries se combinan en un solo objeto de respuesta:

```json
{
  "mail": "juan@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "USUARIO_FINAL",
  "doc_pais": "Uruguay",
  "doc_tipo": "CI",
  "doc_numero": "12345678",
  "dir_pais": "Uruguay",
  "dir_localidad": "Montevideo",
  "dir_calle": "Av. 18 de Julio",
  "dir_numero": "1234",
  "dir_codigo_postal": "11200",
  "estado_verificacion": "VERIFICADO",
  "saldo": 150.00,
  "telefonos": ["+59899123456"]
}
```

`saldo` es el dinero acumulado por reembolsos de eventos cancelados. Solo aplica a USUARIO_FINAL; para otros roles es `null`.

---

## PUT /usuarios/me

**¿Qué hace?** Actualiza la dirección y/o teléfonos del usuario autenticado.

**Acceso**: cualquier rol autenticado

**Body (solo los campos que se quieren cambiar)**:
```json
{
  "dir_localidad": "Punta del Este",
  "telefonos": ["+59899111222", "+59898333444"]
}
```

**Proceso**:
- Para la dirección: construye un `UPDATE Usuario SET campo=? ...` dinámico, solo con los campos enviados
- Para los teléfonos: DELETE de todos los teléfonos actuales + INSERT de los nuevos

La estrategia DELETE+INSERT para teléfonos es más simple que un diff. Tiene el costo de borrar y reinsertar todos, pero la cantidad de teléfonos es pequeña.

**Respuesta 200**:
```json
{ "detail": "Datos actualizados" }
```

---

## PATCH /usuarios/{mail}/verificar

**¿Qué hace?** Marca a un usuario como VERIFICADO, habilitándolo para comprar entradas.

**Acceso**: ADMIN o el propio usuario (el usuario solo puede verificarse a sí mismo)

**Lógica de permisos**:
```python
if user["rol"] != "ADMIN" and user["mail"] != mail:
    raise HTTPException(403, "Sin permiso")
```

**Proceso**:
1. Verifica que el usuario sea USUARIO_FINAL (existe en `UsuarioFinal`)
2. Verifica que no esté ya VERIFICADO → 409
3. `UPDATE UsuarioFinal SET estado_verificacion = 'VERIFICADO'`

**Respuesta 200**:
```json
{ "mail": "juan@example.com", "estado_verificacion": "VERIFICADO" }
```

---

## GET /usuarios/funcionarios

**¿Qué hace?** Lista todos los funcionarios del sistema.

**Acceso**: ADMIN

**SQL**:
```sql
SELECT u.mail, u.nombre, u.apellido, f.numero_legajo
FROM Usuario u
JOIN Funcionario f ON f.usuario_mail = u.mail
ORDER BY u.apellido, u.nombre
```

Usa JOIN (no LEFT JOIN) porque solo queremos los usuarios que TIENEN perfil de funcionario.

**Respuesta 200**: array de `{ mail, nombre, apellido, numero_legajo }`.

---

## PATCH /usuarios/{mail}/promover-funcionario

**¿Qué hace?** Convierte un USUARIO_FINAL en FUNCIONARIO.

**Acceso**: ADMIN

**Proceso**:
1. Verifica que el usuario exista
2. Verifica que sea USUARIO_FINAL (no puede promover a otro ADMIN)
3. Genera el número de legajo: cuenta los funcionarios existentes y usa `LEG-{N+1:04d}` (ej. `LEG-0005`)
4. `DELETE FROM UsuarioFinal` → pierde el perfil de usuario final (saldo, verificación)
5. `UPDATE Usuario SET rol = 'FUNCIONARIO'`
6. `INSERT INTO Funcionario (usuario_mail, numero_legajo)`

**¿Por qué no hay paso de Auth0?** Falta el paso de actualizar `app_metadata.rol` en Auth0. El próximo JWT del usuario todavía dirá `USUARIO_FINAL`. Esto es una limitación conocida — al re-loguear después de la promoción, el token nuevo sí tendrá el rol correcto porque Auth0 lo actualizó.

**Respuesta 200**:
```json
{
  "mail": "funcionario@example.com",
  "rol": "FUNCIONARIO",
  "numero_legajo": "LEG-0001"
}
```

---

## POST /usuarios/sectores

**¿Qué hace?** Asigna el funcionario autenticado a sectores de un evento.

**Acceso**: FUNCIONARIO o ADMIN

**Query params**:
- `evento_id`: ID del evento
- `id_sectores`: lista de IDs de sectores

**Proceso**:
1. Verifica que el evento exista
2. Para cada sector: verifica que pertenezca al evento (esté en `EventoSector`)
3. INSERT en `FuncionarioSectorEvento` para cada sector

**Nota**: este endpoint es diferente de `POST /asignaciones/`. En `/usuarios/sectores` el funcionario se asigna a sí mismo; en `/asignaciones/` un admin asigna a cualquier funcionario.
