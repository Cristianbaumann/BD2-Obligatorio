# Endpoints: /ventas

## POST /ventas/

**¿Qué hace?** Agrega entradas al carrito (crea o actualiza la venta PENDIENTE del usuario).

**Acceso**: cualquier rol autenticado (en práctica solo USUARIO_FINAL tiene acceso a la UI)

**Body**:
```json
{
  "entradas": [
    { "evento_id": "uuid-evento", "sector_id": 1, "cantidad": 2 },
    { "evento_id": "uuid-evento", "sector_id": 3, "cantidad": 1 }
  ]
}
```

**Proceso completo**:
1. Llama `_cleanup_expired()` — borra carritos expirados de TODOS los usuarios (limpieza global)
2. Verifica que el usuario sea VERIFICADO
3. Busca si ya tiene carrito activo (estado 1, fecha < 15 minutos): `SELECT id, tasa_comision FROM Venta WHERE usuario_mail = ? AND estado_id = 1 AND fecha > NOW() - INTERVAL 15 MINUTE`
4. Cuenta entradas en el carrito existente
5. Verifica que `existentes + nuevas <= 5`
6. Para cada item:
   a. Verifica que el evento no esté cancelado: `SELECT cancelado FROM Evento WHERE id = ?` → 400 si `cancelado = TRUE`
   b. Obtiene `costo` y `capacidad` del sector en ese evento: `SELECT es.costo, s.capacidad FROM EventoSector es JOIN Sector s ON ...`
   c. Cuenta entradas ya vendidas (sin carritos expirados): `SELECT COUNT(*) FROM Entrada JOIN Venta ... AND NOT (estado_id = 1 AND fecha < hace 15 min)`
   d. `disponibles = capacidad - vendidas`
   e. Si `cantidad > disponibles` → 409 Conflict
7. Si no había carrito: obtiene tasa vigente, genera UUID, INSERT en `Venta`
8. INSERT en `Entrada` por cada unidad pedida (N inserts individuales para N entradas)
9. Recalcula el precio: `SUM(costo de TODAS las entradas) * (1 + tasa)` → UPDATE en Venta

**TTL del carrito**: 15 minutos. Definido en la constante `CART_TTL_MINUTES = 15`.

**Respuesta 201**: la venta completa con todas las entradas.

---

## GET /ventas/carrito

**¿Qué hace?** Muestra el carrito activo del usuario (ventas PENDIENTE no expiradas).

**Acceso**: autenticado

**SQL** (enriquecido con nombres de evento y sector):
```sql
SELECT id, usuario_mail, fecha, estado_id, precio, tasa_comision,
       GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), fecha + INTERVAL 15 MINUTE)) AS segundos_restantes
FROM Venta
WHERE usuario_mail = ? AND estado_id = 1
  AND fecha > NOW() - INTERVAL 15 MINUTE
ORDER BY fecha ASC
```

`TIMESTAMPDIFF(SECOND, NOW(), fecha + INTERVAL 15 MINUTE)` calcula cuántos segundos faltan para que expire el carrito. `GREATEST(0, ...)` evita valores negativos.

Las entradas tienen join con Evento y Equipo para mostrar nombres legibles.

**Respuesta 200**: array de ventas con `segundos_restantes` incluido. El frontend usa esto para el countdown.

---

## GET /ventas/mis-ventas

**¿Qué hace?** Historial completo de compras del usuario autenticado.

**Acceso**: autenticado

**SQL (estrategia N+1 evitada)**:
```python
# 1. obtener todas las ventas del usuario
db.execute("SELECT id, ... FROM Venta WHERE usuario_mail = ? ORDER BY fecha DESC")
ventas = db.fetchall()

# 2. obtener TODAS las entradas de TODAS las ventas en un solo query
placeholders = ",".join(["%s"] * len(venta_ids))
db.execute(f"SELECT id, venta_id, ... FROM Entrada WHERE venta_id IN ({placeholders})", venta_ids)

# 3. agrupar entradas por venta_id en Python
entradas_por_venta = {}
for e in entradas:
    entradas_por_venta.setdefault(e["venta_id"], []).append(e)
```

Esta estrategia hace 2 queries fijas independientemente de cuántas ventas tenga el usuario. Si se hiciera un query de entradas por cada venta, serían N+1 queries.

---

## PATCH /ventas/{id}/pagar

**¿Qué hace?** Paga un carrito, completando la compra.

**Acceso**: propietario de la venta

**Proceso**:
1. Verifica que la venta exista y sea del usuario
2. Verifica que esté en estado PENDIENTE (1)
3. Verifica que no haya expirado: `SELECT fecha > NOW() - INTERVAL 15 MINUTE AS vigente`
   - Si expiró → 410 Gone
4. `UPDATE Venta SET estado_id = 2` (PENDIENTE → CONFIRMADA)
5. `UPDATE Venta SET estado_id = 3` (CONFIRMADA → PAGA)

**¿Por qué HTTP 410 Gone?** El código 410 significa "recurso ya no existe y nunca volverá". Es semánticamente más preciso que 400 para indicar que el carrito expiró y no puede recuperarse.

**Respuesta 200**: venta con estado_id = 3 (PAGA).

---

## DELETE /ventas/{id}

**¿Qué hace?** Cancela un ítem del carrito (elimina la venta y sus entradas).

**Acceso**: propietario de la venta

**Proceso**:
1. Verifica que sea del usuario y esté PENDIENTE
2. `DELETE FROM Entrada WHERE venta_id = ?`
3. `DELETE FROM Venta WHERE id = ?`

Solo se pueden cancelar ventas PENDIENTE. Las ventas pagadas no se pueden revertir.

---

## GET /ventas/{id}

**¿Qué hace?** Detalle de una venta específica con sus entradas.

**Acceso**: comprador (usuario_mail) o ADMIN

**Errores**:
- 403: si el usuario no es el comprador ni admin

---

## PATCH /ventas/{id}/estado

**¿Qué hace?** Cambia el estado de una venta manualmente. Solo permite avanzar (no retroceder).

**Acceso**: ADMIN

**Body**:
```json
{ "nuevo_estado": "CONFIRMADA" }
```

**Estados válidos**: `PENDIENTE` (1) → `CONFIRMADA` (2) → `PAGA` (3)

No se puede retroceder: `nuevo_estado_id <= venta.estado_id` → 400.

---

## GET /ventas/comision

**¿Qué hace?** Devuelve la tasa de comisión vigente.

**Acceso**: público

**SQL**:
```sql
SELECT tasa FROM ComisionHistorica WHERE fecha_hasta IS NULL ORDER BY id DESC LIMIT 1
```

`fecha_hasta IS NULL` identifica la tasa activa. Se usa `ORDER BY id DESC LIMIT 1` como seguridad extra en caso de bug que deje dos registros activos.

---

## GET /ventas/comision/historial

**¿Qué hace?** Lista todas las tasas históricas de comisión.

**Acceso**: ADMIN

**Respuesta**: array ordenado de `{ id, tasa, fecha_desde, fecha_hasta }`.

---

## PUT /ventas/comision

**¿Qué hace?** Cambia la tasa de comisión vigente.

**Acceso**: ADMIN

**Body**:
```json
{ "tasa": 0.12 }
```

Validación: `0 <= tasa <= 1`.

**Proceso**:
1. Cierra la vigente: `UPDATE ComisionHistorica SET fecha_hasta = hoy WHERE fecha_hasta IS NULL`
2. Abre la nueva: `INSERT INTO ComisionHistorica (tasa, fecha_desde, fecha_hasta) VALUES (nueva, hoy, NULL)`

Las ventas ya creadas tienen su tasa congelada en `Venta.tasa_comision` y no se ven afectadas.

**Nota importante**: se puede cambiar la tasa varias veces el mismo día. La tabla `ComisionHistorica` no tiene restricción UNIQUE en `fecha_hasta`, por lo que pueden existir múltiples registros con la misma `fecha_desde`. Todos los cambios quedan registrados en el historial.
