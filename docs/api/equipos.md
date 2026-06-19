# Endpoints: /equipos

## GET /equipos/

**¿Qué hace?** Lista todos los equipos participantes del mundial.

**Acceso**: público

**SQL**: `SELECT id, nombre FROM Equipo ORDER BY nombre`

**Uso**: el frontend los muestra en los formularios de creación de eventos.

---

## POST /equipos/

**¿Qué hace?** Crea un nuevo equipo.

**Acceso**: ADMIN

**Body**:
```json
{ "nombre": "Uruguay" }
```

**Proceso**:
1. Genera UUID con Python: `str(uuid.uuid4())`
2. `INSERT INTO Equipo (id, nombre) VALUES (?, ?)`

**Respuesta 201**:
```json
{ "id": "uuid-generado", "nombre": "Uruguay" }
```
