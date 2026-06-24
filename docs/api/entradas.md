# Endpoints: /entradas y /qr

## GET /entradas/mis-entradas

**¿Qué hace?** Lista todas las entradas del usuario autenticado con info completa del evento y el QR activo si existe.

**Acceso**: autenticado

**SQL** (un único query con 7 JOINs):
```sql
SELECT e.id, e.venta_id, e.titular_mail, e.costo,
       e.evento_id, e.sector_id, e.consumido,
       v.estado_id           AS venta_estado_id,
       ev.fecha              AS evento_fecha,
       ev.cancelado          AS evento_cancelado,
       el.nombre              AS equipo_local_nombre,
       ev2.nombre             AS equipo_visitante_nombre,
       s.nombre               AS sector_nombre,
       est.nombre             AS estadio_nombre,
       q.id                   AS qr_id,
       q.codigo_hash          AS qr_codigo_hash,
       q.creado_en            AS qr_creado_en,
       q.activo               AS qr_activo
FROM Entrada e
JOIN Venta    v   ON v.id   = e.venta_id AND v.estado_id >= 2
JOIN Evento   ev  ON ev.id  = e.evento_id
JOIN Equipo   el  ON el.id  = ev.equipo_local_id
JOIN Equipo   ev2 ON ev2.id = ev.equipo_visitante_id
JOIN Sector   s   ON s.id   = e.sector_id
JOIN Estadio  est ON est.dir_pais = ev.estadio_pais AND ...
LEFT JOIN Qr  q   ON q.entrada_id = e.id AND q.activo = TRUE
WHERE e.titular_mail = ?
ORDER BY ev.fecha DESC, e.id
```

**`JOIN Venta v ON ... AND v.estado_id >= 2`**: filtra entradas de ventas PENDIENTE (estado 1). Solo aparecen entradas de ventas CONFIRMADA (2) o PAGA (3). Las entradas en el carrito sin pagar no se muestran aquí.

**`venta_estado_id`**: expone el estado de la venta para que el frontend pueda mostrar el badge correcto y habilitar o deshabilitar acciones.

**LEFT JOIN con Qr**: si no hay QR activo, los campos `qr_*` son NULL. En la respuesta, el campo `qr` del objeto es `null` si no hay QR.

**evento_cancelado**: incluye si el evento fue cancelado. El frontend usa esto para mostrar el badge "BLOQUEADA".

**Respuesta 200**: array de `EntradaConInfoOut`:
```json
[
  {
    "id": "uuid-entrada",
    "venta_id": "uuid-venta",
    "venta_estado_id": 3,
    "titular_mail": "juan@example.com",
    "costo": 500.00,
    "evento_id": "uuid-evento",
    "sector_id": 1,
    "consumido": false,
    "evento": {
      "fecha": "2026-06-15T20:00:00",
      "equipo_local": "Uruguay",
      "equipo_visitante": "Argentina",
      "sector_nombre": "Tribuna Norte",
      "estadio_nombre": "Estadio Centenario",
      "cancelado": false
    },
    "qr": {
      "id": "uuid-qr",
      "codigo_hash": "a3f8c2...",
      "creado_en": "2026-06-15T19:30:00",
      "activo": true
    }
  }
]
```

**Lógica de badges en el frontend según `venta_estado_id`**:

| `venta_estado_id` | `consumido` | `cancelado` | Badge | Acciones |
|:-----------------:|:-----------:|:-----------:|-------|----------|
| 2 | false | false | PROCESANDO (azul) | ninguna |
| 3 | false | false | ACTIVA (verde) | transferir, QR |
| 3 | true | — | CONSUMIDA (rojo) | ninguna |
| 3 | — | true | BLOQUEADA (naranja) | ninguna |

---

## GET /entradas/{id}/qr

**¿Qué hace?** Devuelve el QR activo de una entrada. Si no hay uno activo o está expirado, genera uno nuevo.

**Acceso**: titular de la entrada (o ADMIN)

**Proceso**:
1. Verifica que el usuario sea el titular (o admin)
2. Verifica que la entrada no esté consumida → 409
3. Busca QR activo no expirado:
   ```sql
   SELECT id, codigo_hash, creado_en, activo FROM Qr
   WHERE entrada_id = ? AND activo = TRUE LIMIT 1
   ```
4. Si existe → lo devuelve
5. Si no existe:
   - `UPDATE Qr SET activo = FALSE WHERE entrada_id = ?` (desactiva QRs anteriores)
   - Genera `codigo = secrets.token_hex(32)` (64 caracteres hex aleatorios)
   - `INSERT INTO Qr (id, entrada_id, codigo_hash, creado_en, activo) VALUES (UUID(), ?, ?, NOW(), TRUE)`
   - Devuelve el nuevo QR

**¿Por qué `secrets.token_hex(32)`?** El módulo `secrets` de Python genera valores criptográficamente aleatorios (usa el generador de números aleatorios del sistema operativo, que es imprevisible). `token_hex(32)` genera 32 bytes = 64 caracteres hexadecimales. Es virtualmente imposible adivinar.

**`activo` en el QR vs tiempo de vida**: la lógica de los 30 segundos se aplica solo en la **validación** (`/validaciones/`). El endpoint `/entradas/{id}/qr` no tiene límite de tiempo — siempre devuelve o genera un QR activo. Es el scanner el que rechaza QRs con más de 30 segundos.

---

## GET /entradas/{id}

**¿Qué hace?** Detalle completo de una entrada con titular, evento y historial de transferencias.

**Acceso**: titular o ADMIN

**SQL (2 queries)**:
```sql
-- Query 1: datos de la entrada + evento + titular
SELECT e.id, e.titular_mail, e.costo, e.consumido,
       ev.fecha, el.nombre AS equipo_local, ev2.nombre AS equipo_visitante,
       s.nombre AS sector_nombre,
       u.nombre AS titular_nombre, u.apellido AS titular_apellido
FROM Entrada e
JOIN Evento ev ON ...
JOIN Equipo el ON ...
JOIN Sector s ON ...
JOIN Usuario u ON u.mail = e.titular_mail
WHERE e.id = ?

-- Query 2: historial de transferencias
SELECT id, origen_mail, destino_mail, fecha, estado
FROM Transferencia
WHERE entrada_id = ?
ORDER BY fecha ASC
```

**Respuesta 200**:
```json
{
  "id": "uuid-entrada",
  "venta_id": "uuid-venta",
  "titular": {
    "mail": "juan@example.com",
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "costo": 500.00,
  "evento": { ... },
  "consumido": false,
  "estado": "activa",
  "historial_transferencias": [
    {
      "id": 1,
      "origen_mail": "original@example.com",
      "destino_mail": "juan@example.com",
      "fecha": "2026-06-10T15:30:00",
      "estado": "ACEPTADA"
    }
  ]
}
```

---

## GET /entradas/{id}/historial

**¿Qué hace?** Cadena de custodia completa: quién compró originalmente y todos los traspasos.

**Acceso**: titular o ADMIN

**SQL**:
```sql
-- Emisor original (comprador de la venta)
SELECT v.usuario_mail, u.nombre, u.apellido
FROM Venta v JOIN Usuario u ON u.mail = v.usuario_mail
WHERE v.id = ?

-- Todas las transferencias con nombres completos
SELECT t.*, u_o.nombre AS origen_nombre, u_o.apellido AS origen_apellido,
             u_d.nombre AS destino_nombre, u_d.apellido AS destino_apellido
FROM Transferencia t
JOIN Usuario u_o ON u_o.mail = t.origen_mail
JOIN Usuario u_d ON u_d.mail = t.destino_mail
WHERE t.entrada_id = ?
ORDER BY t.fecha ASC
```

---

## GET /qr/{entrada_id}

**¿Qué hace?** Devuelve la URL de una imagen del QR (generada por un servicio externo).

**Acceso**: autenticado (titular)

**Proceso**:
1. Verifica que el usuario sea el titular
2. Busca o genera el QR (misma lógica que `/entradas/{id}/qr`)
3. Construye URL: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={codigo_hash}`

El `codigo_hash` es el contenido del QR. Cuando el validador escanea el QR con la cámara, obtiene ese código hash. Luego lo envía a `/validaciones/` para que el backend lo valide.
