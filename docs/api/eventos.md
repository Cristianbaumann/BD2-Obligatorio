# Endpoints: /eventos

## GET /eventos/

**¿Qué hace?** Lista todos los eventos con datos enriquecidos: equipos, estadio, precio mínimo, disponibilidad.

**Acceso**: público

**SQL** (query compleja con subqueries correlacionadas):
```sql
SELECT
    e.id,
    e.fecha,
    e.cancelado,
    eq_local.nombre  AS equipo_local,
    eq_visit.nombre  AS equipo_visitante,
    est.nombre       AS estadio,
    (SELECT MIN(es2.costo)
       FROM EventoSector es2
      WHERE es2.evento_id = e.id)                              AS precio_minimo,
    (SELECT SUM(s2.capacidad)
       FROM EventoSector es2
       JOIN Sector s2 ON s2.id = es2.sector_id
      WHERE es2.evento_id = e.id)                              AS capacidad,
    (SELECT SUM(s2.capacidad)
       FROM EventoSector es2
       JOIN Sector s2 ON s2.id = es2.sector_id
      WHERE es2.evento_id = e.id)
    - (SELECT COUNT(*) FROM Entrada ent2
       WHERE ent2.evento_id = e.id)                            AS entradas_disponibles
FROM Evento e
JOIN Equipo  eq_local ON eq_local.id = e.equipo_local_id
JOIN Equipo  eq_visit ON eq_visit.id = e.equipo_visitante_id
JOIN Estadio est      ON est.dir_pais = e.estadio_pais
                     AND est.dir_localidad = e.estadio_localidad
                     AND est.dir_calle = e.estadio_calle
                     AND est.dir_numero = e.estadio_numero
ORDER BY e.fecha
```

**Subqueries explicadas**:
- `precio_minimo`: el costo más bajo entre todos los sectores del evento. Se usa para mostrar "desde $X" en la UI.
- `capacidad`: suma de capacidades de todos los sectores habilitados para el evento. Distinto al aforo total del estadio.
- `entradas_disponibles`: capacidad total menos entradas ya emitidas (sin filtrar expiradas en esta lista — es aproximado).

**Respuesta 200**: array de eventos ordenados por fecha.

---

## GET /eventos/mi-pais

**¿Qué hace?** Lista los eventos del país del admin autenticado (filtrado por jurisdicción).

**Acceso**: ADMIN (requiere token)

**Proceso**:
1. Obtiene `pais_sede` del admin
2. Filtra eventos donde `estadio_pais = pais_sede`

**SQL**: misma query enriquecida que `GET /eventos/` pero con `WHERE e.estadio_pais = ?`.

**Respuesta 200**: array de eventos del país del admin, ordenados por fecha.

**¿Por qué existe?** El admin solo puede gestionar eventos de su país. Este endpoint garantiza que el panel admin muestre solo los eventos relevantes, sin que el frontend necesite conocer el país del admin.

---

## POST /eventos/

**¿Qué hace?** Crea un nuevo evento (partido).

**Acceso**: ADMIN de la jurisdicción del estadio

**Body**:
```json
{
  "fecha": "2026-06-15T20:00:00",
  "equipo_local_id": "uuid-del-equipo",
  "equipo_visitante_id": "uuid-del-equipo-2",
  "estadio_pais": "Uruguay",
  "estadio_localidad": "Montevideo",
  "estadio_calle": "Av. Luis A. de Herrera",
  "estadio_numero": "4444",
  "sectores": [
    { "sector_id": 1, "costo": 500.00 },
    { "sector_id": 2, "costo": 1200.00 }
  ]
}
```

**Proceso**:
1. Obtiene `pais_sede` del admin
2. Compara con `estadio_pais` usando `_norm()` → 403 si no coinciden
3. INSERT en `Evento`
4. Si fecha+estadio ya existe → IntegrityError → 409
5. Si se enviaron `sectores`: INSERT en `EventoSector` por cada uno

Los sectores son opcionales al crear. Se pueden agregar después con `POST /eventos/{id}/sectores`.

**Respuesta 201**: datos del evento creado.

---

## GET /eventos/{id}

**¿Qué hace?** Devuelve el detalle de un evento por su ID.

**Acceso**: público

**SQL**: mismo que el listado pero filtrado por `e.id = ?`.

**Errores**:
- 404: Evento no encontrado

---

## GET /eventos/{id}/disponibilidad

**¿Qué hace?** Lista los sectores habilitados con su disponibilidad actual.

**Acceso**: público

**SQL**:
```sql
SELECT
    es.sector_id,
    s.nombre,
    es.costo,
    s.capacidad AS total,
    s.capacidad - COUNT(ent.id) AS disponibles
FROM EventoSector es
JOIN Sector s ON s.id = es.sector_id
LEFT JOIN Entrada ent ON ent.evento_id = es.evento_id
                      AND ent.sector_id = es.sector_id
                      AND EXISTS (
                          SELECT 1 FROM Venta v
                          WHERE v.id = ent.venta_id
                            AND NOT (v.estado_id = 1 AND v.fecha < NOW() - INTERVAL 15 MINUTE)
                      )
WHERE es.evento_id = ?
GROUP BY es.sector_id, s.nombre, es.costo, s.capacidad
```

La subquery con `EXISTS` excluye las entradas de carritos expirados (PENDIENTE con > 15 minutos). Esto permite que esas plazas vuelvan a estar disponibles para otros usuarios.

---

## PUT /eventos/{id}

**¿Qué hace?** Actualiza un evento existente.

**Acceso**: ADMIN de la jurisdicción (verifica tanto el país del evento actual como el del nuevo estadio)

**Proceso**:
1. Verifica que el evento exista
2. Verifica que el estadio actual sea de la jurisdicción del admin
3. Verifica que el nuevo estadio también sea de la jurisdicción
4. UPDATE en `Evento`
5. Si se enviaron `sectores`: DELETE de todos los EventoSector del evento + INSERT nuevos

**Respuesta 200**: evento actualizado.

---

## DELETE /eventos/{id}

**¿Qué hace?** Elimina un evento. Solo funciona si no hay entradas vendidas.

**Acceso**: ADMIN de la jurisdicción

**Cuándo usar**: cuando se creó un evento por error, antes de que se vendan entradas.

**Proceso**:
1. Verifica jurisdicción
2. `SELECT COUNT(*) FROM Entrada WHERE evento_id = ?` → si > 0 → 409
3. DELETE FROM Evento (EventoSector se elimina por CASCADE)

**Diferencia con cancelar**: eliminar borra el registro (para eventos sin entradas). Cancelar marca `cancelado = TRUE` y hace reembolsos (para eventos con entradas). Ver `PATCH /eventos/{id}/cancelar`.

---

## POST /eventos/{id}/sectores

**¿Qué hace?** Habilita uno o más sectores para la venta en el evento.

**Acceso**: ADMIN de la jurisdicción

**Body**:
```json
[
  { "sector_id": 1, "costo": 500.00 },
  { "sector_id": 3, "costo": 800.00 }
]
```

**Proceso**:
1. Verifica que la lista no esté vacía y no tenga duplicados
2. Verifica jurisdicción del admin
3. Para cada sector: verifica que pertenezca al estadio del evento
4. INSERT en `EventoSector`
5. Si algún sector ya estaba habilitado → IntegrityError → 409

**Respuesta 201**: lista de sectores habilitados.

---

## DELETE /eventos/{id}/sectores/{sector_id}

**¿Qué hace?** Deshabilita un sector en un evento.

**Acceso**: ADMIN de la jurisdicción

**Proceso**:
1. Verifica jurisdicción
2. Verifica que no haya entradas vendidas para ese sector en ese evento
3. DELETE FROM EventoSector WHERE evento_id = ? AND sector_id = ?

---

## PATCH /eventos/{id}/cancelar

**¿Qué hace?** Cancela el evento y reembolsa a los titulares de entradas.

**Acceso**: ADMIN de la jurisdicción

**Proceso**:
1. Verifica jurisdicción y que el evento no esté ya cancelado
2. `UPDATE Evento SET cancelado = TRUE`
3. Query de reembolso:
   ```sql
   SELECT ent.titular_mail,
          SUM(ent.costo * (1 + v.tasa_comision)) AS reembolso
   FROM Entrada ent
   JOIN Venta v ON v.id = ent.venta_id
   WHERE ent.evento_id = ?
     AND v.estado_id IN (SELECT id FROM Estado WHERE descripcion IN ('PAGA', 'CONFIRMADA'))
   GROUP BY ent.titular_mail
   ```
4. Por cada titular: `UPDATE UsuarioFinal SET saldo = saldo + reembolso`

**Reembolso calculado**: `costo_entrada * (1 + tasa_comision)` = el precio final que pagó el usuario. Se devuelve todo, incluyendo la comisión.

**¿Quién recibe el reembolso?** El `titular_mail` actual (no el comprador original). Si A compra y transfiere a B, B es el titular. Si el evento se cancela, B recibe el reembolso.

**¿Qué pasa en la UI?** Las entradas de un evento cancelado muestran el badge "BLOQUEADA" (naranja) y no permiten mostrar QR ni transferir.

**Respuesta 200**:
```json
{
  "cancelado": true,
  "usuarios_reembolsados": 150,
  "total_reembolsado": 75000.00
}
```
