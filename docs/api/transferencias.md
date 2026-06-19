# Endpoints: /transferencias

## POST /transferencias/

**¿Qué hace?** Inicia una transferencia de entrada a otro usuario. El destinatario debe aceptarla.

**Acceso**: autenticado

**Body**:
```json
{
  "entrada_id": "uuid-entrada",
  "destino_mail": "receptor@example.com"
}
```

**Proceso**:
1. Verifica que el `destino_mail` exista en `Usuario` → 404
2. Bloqueo de fila: `SELECT titular_mail, consumido FROM Entrada WHERE id = ? FOR UPDATE`
   - Si no existe → 404
   - Si está consumida → 400
   - Si el usuario no es el titular → 403
   - Si se transfiere a sí mismo → 400
3. `SELECT COUNT(*) FROM Transferencia WHERE entrada_id = ? AND estado = 'ACEPTADA'`
   - Si ya tiene 3 transferencias aceptadas → 400 (límite máximo)
4. `SELECT COUNT(*) FROM Transferencia WHERE entrada_id = ? AND estado = 'PENDIENTE'`
   - Si ya hay una pendiente → 400
5. `INSERT INTO Transferencia (..., estado = 'PENDIENTE')`

**`FOR UPDATE`**: bloqueo pesimista de la fila. Si dos requests concurrentes intentan transferir la misma entrada, uno obtiene el bloqueo y el otro espera. Cuando el segundo toma el bloqueo, el titular ya cambió o ya hay una pendiente → falla limpiamente.

**Respuesta 200**:
```json
{ "message": "Transferencia solicitada. El destinatario debe aceptarla." }
```

---

## GET /transferencias/mis-transferencias

**¿Qué hace?** Lista todas las transferencias donde el usuario es origen O destino.

**Acceso**: autenticado

**Query param**: `mail_usuario` (string) — el mail del usuario a consultar

**SQL**:
```sql
SELECT t.id AS transferencia_id, t.entrada_id, t.origen_mail, t.destino_mail,
       t.fecha AS fecha_transferencia, t.estado,
       ev.fecha AS evento_fecha,
       el.nombre AS equipo_local, ev2.nombre AS equipo_visitante,
       s.nombre AS sector_nombre, e.costo
FROM Transferencia t
JOIN Entrada e   ON e.id   = t.entrada_id
JOIN Evento  ev  ON ev.id  = e.evento_id
JOIN Equipo  el  ON el.id  = ev.equipo_local_id
JOIN Equipo  ev2 ON ev2.id = ev.equipo_visitante_id
JOIN Sector  s   ON s.id   = e.sector_id
WHERE (t.origen_mail = ? OR t.destino_mail = ?)
ORDER BY t.fecha DESC
```

Incluye datos del evento (fecha, equipos, sector) para que el frontend muestre contexto sin queries adicionales.

**Uso en la UI**: el Navbar consulta este endpoint para saber si hay transferencias en estado `PENDIENTE` donde `destino_mail = usuario_autenticado`. Si las hay, muestra un punto rojo en "Mis Entradas".

---

## PATCH /transferencias/{id}/aceptar

**¿Qué hace?** El destinatario acepta la transferencia. La entrada pasa a ser suya.

**Acceso**: destinatario de la transferencia

**Proceso**:
1. Busca la transferencia en estado PENDIENTE: `SELECT entrada_id, destino_mail FROM Transferencia WHERE id = ? AND estado = 'PENDIENTE'`
2. Verifica que el usuario sea el `destino_mail` → 403
3. `UPDATE Transferencia SET estado = 'ACEPTADA'`
4. `UPDATE Entrada SET titular_mail = usuario_autenticado WHERE id = entrada_id`
5. `UPDATE Qr SET activo = FALSE WHERE entrada_id = entrada_id`

El paso 5 invalida el QR del titular anterior. El nuevo titular generará su propio QR cuando lo necesite.

**Respuesta 200**:
```json
{ "message": "Transferencia aceptada exitosamente" }
```

---

## PATCH /transferencias/{id}/rechazar

**¿Qué hace?** El destinatario rechaza la transferencia. La entrada sigue siendo del origen.

**Acceso**: destinatario de la transferencia

**Proceso**:
1. Verifica que sea una transferencia PENDIENTE y que el usuario sea el destinatario
2. `UPDATE Transferencia SET estado = 'RECHAZADA'`
3. NO modifica `Entrada.titular_mail` — la entrada sigue siendo del original

**Respuesta 200**:
```json
{ "message": "Transferencia rechazada exitosamente" }
```

---

## Notas sobre duplicación en el código

El archivo `transferencias.py` contiene tanto `POST /transferencias/` como `POST /transferencias/solicitar`. Son esencialmente la misma funcionalidad. El endpoint `/solicitar` fue una versión anterior y quedó en el código. El activo y correcto es `POST /transferencias/` (usa el body JSON estándar).

También hay `GET /transferencias/` y `GET /transferencias/{id}` vacíos (solo `pass`). Son placeholders no implementados.
