# Endpoints: /estadios

## GET /estadios/

**¿Qué hace?** Lista todos los estadios. Con filtro opcional por país.

**Acceso**: público

**Query params**:
- `pais` (opcional): filtra por `dir_pais`

**SQL**:
```sql
SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo
FROM Estadio
[WHERE dir_pais = ?]
ORDER BY nombre
```

**Respuesta 200**: array de estadios.

---

## POST /estadios/

**¿Qué hace?** Crea un nuevo estadio.

**Acceso**: ADMIN (solo del país correspondiente)

**Body**:
```json
{
  "dir_pais": "Uruguay",
  "dir_localidad": "Montevideo",
  "dir_calle": "Av. Luis A. de Herrera",
  "dir_numero": "4444",
  "nombre": "Estadio Centenario",
  "aforo": 65000
}
```

**Proceso**:
1. Obtiene `pais_sede` del admin desde la tabla `Admin`
2. Compara `_norm(pais_sede)` con `_norm(dir_pais)` → 403 si no coinciden
3. INSERT en `Estadio`
4. Si ya existe un estadio con esa dirección → IntegrityError → 409

**`_norm()` — normalización de strings**:
```python
def _norm(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
```
Convierte "Uruguay", "uruguay", "URUGUAY" todos a "uruguay". También elimina acentos: "Canadá" → "canada". Esto permite que el campo `pais_sede` del admin sea "canada" y el `dir_pais` del estadio sea "Canada" — y la comparación funcione igual.

---

## GET /estadios/{nombre}

**¿Qué hace?** Devuelve el detalle de un estadio incluyendo todos sus sectores.

**Acceso**: público

**SQL (2 queries)**:
```sql
-- Query 1: datos del estadio
SELECT dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo
FROM Estadio WHERE nombre = ?

-- Query 2: sus sectores
SELECT id, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, nombre, capacidad
FROM Sector
WHERE estadio_pais = ? AND estadio_localidad = ? AND estadio_calle = ? AND estadio_numero = ?
ORDER BY id
```

**Respuesta 200**:
```json
{
  "dir_pais": "Uruguay",
  "dir_localidad": "Montevideo",
  "dir_calle": "Av. Luis A. de Herrera",
  "dir_numero": "4444",
  "nombre": "Estadio Centenario",
  "aforo": 65000,
  "sectores": [
    { "id": 1, "nombre": "Tribuna Norte", "capacidad": 10000, ... },
    { "id": 2, "nombre": "Platea", "capacidad": 5000, ... }
  ]
}
```

---

## PUT /estadios/{nombre}

**¿Qué hace?** Actualiza datos de un estadio (nombre, aforo, dirección).

**Acceso**: ADMIN de la jurisdicción

**Body (campos opcionales)**:
```json
{
  "nombre": "Estadio Centenario Renovado",
  "aforo": 70000
}
```

**Validación de aforo**:
Si se cambia el aforo, verifica que el nuevo aforo no sea menor que la suma de capacidades de los sectores existentes:
```sql
SELECT COALESCE(SUM(capacidad), 0) AS total FROM Sector WHERE estadio_* = ?
```
Si `nuevo_aforo < total_sectores` → 409.

**Respuesta 200**: estadio actualizado.

---

## DELETE /estadios/{nombre}

**¿Qué hace?** Elimina un estadio y todos sus sectores (CASCADE).

**Acceso**: ADMIN de la jurisdicción

**Proceso**:
1. Verifica jurisdicción (mismo `_norm()`)
2. Verifica que no tenga eventos asociados:
   ```sql
   SELECT COUNT(*) AS cnt FROM Evento
   WHERE estadio_pais = ? AND estadio_localidad = ? AND estadio_calle = ? AND estadio_numero = ?
   ```
   Si tiene eventos → 409 (no se puede eliminar)
3. DELETE con la PK compuesta (dirección). Los sectores se eliminan por CASCADE.

**¿Por qué no eliminar si tiene eventos?** Los eventos tienen entradas vendidas, validaciones, etc. Eliminar el estadio rompería la integridad referencial y dejaría datos huérfanos.

---

## POST /estadios/{nombre}/sectores

**¿Qué hace?** Crea un sector dentro del estadio.

**Acceso**: ADMIN de la jurisdicción

**Body**:
```json
{
  "nombre": "Tribuna Norte",
  "capacidad": 10000
}
```

**Proceso**:
1. Obtiene el estadio por nombre → determina su PK compuesta (dirección)
2. Verifica jurisdicción del admin
3. Verifica que no exista ya un sector con ese nombre en el estadio
4. Llama `_check_aforo()` para verificar que la suma de capacidades no supere el aforo:
   ```sql
   SELECT COALESCE(SUM(capacidad), 0) AS total FROM Sector WHERE estadio_* = ?
   -- si total + nueva_capacidad > aforo → 409
   ```
5. INSERT en `Sector`

**`_check_aforo()`**: función auxiliar que acepta un parámetro opcional `excluir_sector_id` para cuando se edita un sector existente (se excluye su propia capacidad anterior del total).

**Respuesta 201**: datos del sector creado incluyendo el `id` autoincremental.

---

## PUT /estadios/{nombre}/sectores/{sector_id}

**¿Qué hace?** Edita la capacidad (y/o nombre) de un sector.

**Acceso**: ADMIN de la jurisdicción

**Body**:
```json
{ "capacidad": 12000 }
```

**Validaciones**:
1. Verifica que el sector pertenece al estadio (JOIN por dirección completa)
2. Si se reduce la capacidad: verifica que ningún evento tenga más entradas vendidas que la nueva capacidad:
   ```sql
   SELECT COALESCE(MAX(cnt), 0) AS max_vendidas
   FROM (
       SELECT COUNT(*) AS cnt FROM Entrada
       WHERE sector_id = ? GROUP BY evento_id
   ) t
   -- si max_vendidas > nueva_capacidad → 409
   ```
3. Si se aumenta: verifica que el total de sectores no supere el aforo (con `_check_aforo` excluyendo el sector actual)

**¿Por qué `MAX(cnt)` y no `SUM`?** La restricción es por evento: si el sector tiene 100 asientos y hay 80 entradas vendidas para el Partido A, no se puede bajar a 70. Pero si el Partido B solo vendió 60, el máximo entre todos los eventos es 80. Por eso se usa MAX sobre la subconsulta agrupada por evento.

---

## DELETE /estadios/{nombre}/sectores/{sector_id}

**¿Qué hace?** Elimina un sector.

**Acceso**: ADMIN de la jurisdicción

**Proceso**:
1. Verifica que el sector pertenezca al estadio (evita eliminar sectores de otro estadio)
2. Verifica que no haya entradas emitidas para ese sector:
   ```sql
   SELECT COUNT(*) AS cnt FROM Entrada WHERE sector_id = ?
   ```
   Si hay entradas → 409
3. DELETE FROM Sector WHERE id = ?

**¿Por qué no puede haber entradas?** Una entrada referencia un sector. Si se elimina el sector, la entrada quedaría sin referencia válida.
