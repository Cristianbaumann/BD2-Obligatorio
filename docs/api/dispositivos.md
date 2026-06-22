# Endpoints: /dispositivos

Los dispositivos son los scanners (smartphones/tablets) autorizados para validar entradas. Cada dispositivo se asigna a un funcionario específico.

## GET /dispositivos/mis-dispositivos

**¿Qué hace?** Lista los dispositivos activos del funcionario autenticado.

**Acceso**: FUNCIONARIO o ADMIN

**SQL**:
```sql
SELECT id, funcionario_mail, activo
FROM Dispositivo
WHERE funcionario_mail = ? AND activo = TRUE
```

**Uso**: el scanner del funcionario llama este endpoint al cargar para saber qué dispositivo usar. Si el funcionario tiene un solo dispositivo, se selecciona automáticamente.

---

## GET /dispositivos/

**¿Qué hace?** Lista todos los dispositivos del sistema.

**Acceso**: ADMIN

**SQL**: `SELECT id, funcionario_mail, activo FROM Dispositivo`

---

## GET /dispositivos/autorizados

**¿Qué hace?** Lista los dispositivos activos (solo los que pueden usarse).

**Acceso**: ADMIN

**SQL**: `SELECT id, funcionario_mail, activo FROM Dispositivo WHERE activo = TRUE`

---

## POST /dispositivos/

**¿Qué hace?** Registra un nuevo dispositivo asignado a un funcionario.

**Acceso**: ADMIN

**Body**:
```json
{ "funcionario_mail": "funcionario@example.com" }
```

**Proceso**:
1. Verifica que el funcionario exista en la tabla `Funcionario`
2. Genera UUID usando MySQL: `SELECT @new_id := UUID()` — nota: se usa MySQL para generar el ID, no Python
3. `INSERT INTO Dispositivo (id, funcionario_mail, activo) VALUES (?, ?, TRUE)`

**¿Por qué `SELECT UUID()` en MySQL y no `uuid.uuid4()` en Python?** Es una decisión de diseño alternativa. Ambos producen UUIDs válidos. El resultado es idéntico.

**Respuesta 201**:
```json
{
  "id": "uuid-generado",
  "funcionario_mail": "funcionario@example.com",
  "activo": true
}
```

---

## DELETE /dispositivos/{id}

**¿Qué hace?** Elimina o desactiva un dispositivo según si tiene historial de validaciones.

**Acceso**: ADMIN

**Proceso**:
1. Verifica que el dispositivo exista → 404
2. Consulta si tiene validaciones registradas:
   ```sql
   SELECT COUNT(*) AS cnt FROM Validacion WHERE dispositivo_id = ?
   ```
3. **Sin validaciones** → `DELETE FROM Dispositivo` (eliminación definitiva). Responde `{ "deactivated": false }`
4. **Con validaciones** → `UPDATE Dispositivo SET activo = FALSE` (baja lógica). Responde `{ "deactivated": true }`

**¿Por qué no eliminar si tiene validaciones?** Las validaciones son registros de auditoría. Eliminar el dispositivo rompería la FK con `Validacion` y destruiría el historial de quién escaneó qué entrada con qué dispositivo.

**Respuesta 200**:
```json
{ "detail": "Dispositivo eliminado", "deactivated": false }
// o
{ "detail": "Dispositivo desactivado", "deactivated": true }
```

---

## PATCH /dispositivos/{id}/activar

**¿Qué hace?** Reactiva un dispositivo previamente desactivado.

**Acceso**: ADMIN

**Proceso**:
1. Verifica que el dispositivo exista → 404
2. Verifica que esté inactivo → 409 si ya está activo
3. `UPDATE Dispositivo SET activo = TRUE WHERE id = ?`

**Respuesta 200**:
```json
{ "detail": "Dispositivo activado" }
```
