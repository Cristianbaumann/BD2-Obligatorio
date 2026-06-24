# Endpoints: /asignaciones

Las asignaciones conectan un funcionario con un sector específico de un evento. Sin asignación, el funcionario no puede validar entradas en ese sector.

## POST /asignaciones/

**¿Qué hace?** Asigna un funcionario a un sector de un evento.

**Acceso**: ADMIN

**Body**:
```json
{
  "funcionario_mail": "funcionario@example.com",
  "evento_id": "uuid-evento",
  "sector_id": 1
}
```

**Proceso**:
1. Verifica que el funcionario exista en `Funcionario` → 404
2. Verifica que el sector esté habilitado en el evento (`EventoSector`) → 404
3. `INSERT INTO FuncionarioSectorEvento (funcionario_mail, evento_id, sector_id)`
4. Si el funcionario ya estaba asignado a ese sector en ese evento (viola `UNIQUE KEY uq_fse`) → 409 `"El funcionario ya está asignado a ese sector en este evento"`
5. Recupera el ID autoincremental con `SELECT LAST_INSERT_ID()`

**Respuesta 201**:
```json
{
  "id": 5,
  "funcionario_mail": "funcionario@example.com",
  "evento_id": "uuid-evento",
  "sector_id": 1
}
```

---

## GET /asignaciones/

**¿Qué hace?** Lista asignaciones. Con filtro opcional por evento.

**Acceso**: ADMIN

**Query param**: `evento_id` (opcional)

**SQL** (con nombres de funcionario y sector):
```sql
SELECT fse.id, fse.funcionario_mail, fse.evento_id, fse.sector_id,
       u.nombre, u.apellido, s.nombre AS sector_nombre
FROM FuncionarioSectorEvento fse
JOIN Usuario u ON u.mail = fse.funcionario_mail
JOIN Sector s ON s.id = fse.sector_id
[WHERE fse.evento_id = ?]
ORDER BY fse.sector_id
```

---

## PATCH /asignaciones/{id}

**¿Qué hace?** Cambia el sector de una asignación existente.

**Acceso**: ADMIN

**Body**:
```json
{ "sector_id": 3 }
```

**Proceso**:
1. Verifica que la asignación exista → 404
2. Verifica que el nuevo sector pertenezca al mismo evento de la asignación (`EventoSector`) → 404
3. `UPDATE FuncionarioSectorEvento SET sector_id = ? WHERE id = ?`
4. Devuelve la asignación actualizada con JOIN a `Usuario` y `Sector` para incluir nombres

**Respuesta 200**:
```json
{
  "id": 5,
  "funcionario_mail": "funcionario@example.com",
  "evento_id": "uuid-evento",
  "sector_id": 3,
  "nombre": "Carlos",
  "apellido": "López",
  "sector_nombre": "VIP"
}
```

---

## DELETE /asignaciones/{id}

**¿Qué hace?** Elimina una asignación.

**Acceso**: ADMIN

**Proceso**:
1. Verifica que la asignación exista → 404
2. `DELETE FROM FuncionarioSectorEvento WHERE id = ?`

**Nota**: eliminar la asignación no afecta validaciones ya registradas.
