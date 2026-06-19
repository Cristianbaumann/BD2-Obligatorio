# Endpoints: /reportes

## GET /reportes/ventas

**¿Qué hace?** Totales globales de ventas: entradas vendidas, recaudación, comisión, eventos activos.

**Acceso**: público

**SQL (2 queries)**:
```sql
-- Totales globales
SELECT
    COUNT(*)                        AS total_vendidas,
    COALESCE(SUM(costo), 0)         AS total_recaudado,
    COALESCE(SUM(costo) * 0.10, 0)  AS comision_total,
    (SELECT COUNT(*) FROM Evento)   AS eventos_activos
FROM Entrada

-- Top 10 eventos por entradas vendidas
SELECT CONCAT(el.nombre, ' vs ', ev2.nombre) AS evento,
       COUNT(e.id) AS vendidas
FROM Entrada e
JOIN Evento ev  ON ev.id  = e.evento_id
JOIN Equipo el  ON el.id  = ev.equipo_local_id
JOIN Equipo ev2 ON ev2.id = ev.equipo_visitante_id
GROUP BY e.evento_id, el.nombre, ev2.nombre
ORDER BY vendidas DESC
LIMIT 10
```

**Nota**: `comision_total` usa `0.10` hardcodeado, no la tasa histórica real. Es una aproximación.

---

## GET /reportes/ocupacion

**¿Qué hace?** Entradas emitidas por sector.

**Acceso**: público

**SQL**:
```sql
SELECT s.nombre AS sector, COUNT(e.id) AS ocupadas, s.capacidad AS total
FROM Sector s
LEFT JOIN Entrada e ON e.sector_id = s.id
GROUP BY s.id, s.nombre, s.capacidad
ORDER BY ocupadas DESC
LIMIT 20
```

---

## GET /reportes/eventos

**¿Qué hace?** Entradas vendidas por evento con capacidad total.

**Acceso**: público

**SQL**:
```sql
SELECT CONCAT(el.nombre, ' vs ', ev2.nombre) AS partido,
       ev.fecha,
       COUNT(e.id) AS vendidas,
       (SELECT SUM(s.capacidad) FROM EventoSector es2
        JOIN Sector s ON s.id = es2.sector_id
        WHERE es2.evento_id = ev.id) AS capacidad
FROM Evento ev
JOIN Equipo el  ON el.id  = ev.equipo_local_id
JOIN Equipo ev2 ON ev2.id = ev.equipo_visitante_id
LEFT JOIN Entrada e ON e.evento_id = ev.id
GROUP BY ev.id, el.nombre, ev2.nombre, ev.fecha
ORDER BY ev.fecha
```

---

## GET /reportes/mas-vendidos

**¿Qué hace?** Top 10 eventos con más entradas vendidas.

**Acceso**: ADMIN

---

## GET /reportes/mayores-compradores

**¿Qué hace?** Top 10 usuarios por cantidad de entradas compradas y gasto total.

**Acceso**: ADMIN

**SQL**:
```sql
SELECT u.mail, COUNT(e.id) AS total_entradas_compradas, SUM(v.precio) AS total_gastado
FROM Usuario u
JOIN Venta v   ON v.usuario_mail = u.mail
JOIN Entrada e ON e.venta_id     = v.id
GROUP BY u.mail
ORDER BY total_entradas_compradas DESC
LIMIT 10
```

---

## GET /reportes/funcionario/{mail}/cobertura

**¿Qué hace?** Para un funcionario, muestra qué sectores tiene asignados y si ya validó alguna entrada en cada uno.

**Acceso**: ADMIN

**SQL**:
```sql
SELECT
    fse.funcionario_mail,
    fse.evento_id,
    fse.sector_id,
    s.nombre AS sector_nombre,
    EXISTS (
        SELECT 1 FROM Validacion val
        JOIN Entrada en2 ON en2.id = val.entrada_id
        WHERE en2.evento_id = fse.evento_id
          AND en2.sector_id = fse.sector_id
          AND val.funcionario_mail = fse.funcionario_mail
    ) AS sector_cubierto
FROM FuncionarioSectorEvento fse
JOIN Sector s ON s.id = fse.sector_id
WHERE fse.funcionario_mail = ?
```

`sector_cubierto` es `1` si el funcionario ya hizo al menos una validación en ese sector para ese evento, `0` si no.

---

## GET /reportes/disponibilidad_evento/{id}

**¿Qué hace?** Disponibilidad de plazas por sector para un evento específico.

**Acceso**: autenticado

**SQL**:
```sql
SELECT es.evento_id, es.sector_id, s.nombre AS sector_nombre,
       s.estadio_pais, s.estadio_localidad,
       s.capacidad AS capacidad_maxima,
       COUNT(e.id) AS entradas_emitidas,
       s.capacidad - COUNT(e.id) AS disponibles
FROM EventoSector es
JOIN Sector s ON s.id = es.sector_id
LEFT JOIN Entrada e ON e.evento_id = es.evento_id AND e.sector_id = es.sector_id
WHERE es.evento_id = ?
GROUP BY es.evento_id, es.sector_id, s.nombre, s.estadio_pais, s.estadio_localidad, s.capacidad
```

**Diferencia con `GET /eventos/{id}/disponibilidad`**: este endpoint filtra carritos expirados (más preciso). El de reportes cuenta todas las entradas emitidas sin filtrar.
