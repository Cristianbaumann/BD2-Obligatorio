# Base de Datos

## Conexión MySQL — `database.py`

```python
import mysql.connector
from core.config import settings

def get_connection():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )

def get_db():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
```

### Parámetros del cursor

`dictionary=True` hace que `cursor.fetchone()` y `cursor.fetchall()` devuelvan diccionarios (`{"mail": "...", "rol": "..."}`) en lugar de tuplas. Sin esto, los resultados son tuplas y hay que acceder por índice (`row[0]`), lo cual es frágil.

`buffered=True` carga todos los resultados en memoria del cliente inmediatamente después del query. Sin esto, el cursor es "lazy" y puede dar errores si se hacen múltiples queries sin consumir todos los resultados del anterior.

### El patrón `yield` — generador de FastAPI

`get_db` es un **generador de Python**. FastAPI lo usa como dependencia:

1. El código antes de `yield cursor` se ejecuta al inicio del request (abre conexión, crea cursor)
2. `yield cursor` entrega el cursor al handler
3. El código después de `yield` se ejecuta cuando el handler termina (commit o rollback, cierre)

Esto garantiza que la conexión siempre se cierra, incluso si el handler lanza una excepción.

### Transacciones

FastAPI ejecuta el `commit()` automáticamente si el handler termina sin error. Si el handler lanza una excepción, ejecuta `rollback()`. Esto significa que un handler puede hacer múltiples INSERTs/UPDATEs y si algo falla en el medio, todo queda sin efecto — comportamiento atómico.

---

## Tablas principales

### `Usuario`
Tabla base para todos los roles. Clave primaria: `mail` (string).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `mail` | VARCHAR PK | Email del usuario, identificador único |
| `auth0_id` | VARCHAR UNIQUE | ID externo de Auth0 (ej. `auth0|abc123`) |
| `nombre` | VARCHAR | Nombre del usuario |
| `apellido` | VARCHAR | Apellido |
| `rol` | ENUM | `ADMIN`, `FUNCIONARIO`, `USUARIO_FINAL` |
| `doc_pais` | VARCHAR | País del documento de identidad |
| `doc_tipo` | VARCHAR | Tipo: CI, Pasaporte, DNI, Otro |
| `doc_numero` | VARCHAR | Número de documento |
| `dir_pais` | VARCHAR | País de residencia |
| `dir_localidad` | VARCHAR | Ciudad/localidad |
| `dir_calle` | VARCHAR | Calle |
| `dir_numero` | VARCHAR | Número de calle |
| `dir_codigo_postal` | VARCHAR NULL | Código postal (opcional) |

### `UsuarioFinal`
Extiende `Usuario` para compradores. Relación 1:1.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `usuario_mail` | VARCHAR FK → Usuario.mail | |
| `estado_verificacion` | ENUM | `PENDIENTE`, `VERIFICADO`, `RECHAZADO` |
| `saldo` | DECIMAL | Saldo acumulado por reembolsos de eventos cancelados |

### `Admin`
Extiende `Usuario` para administradores.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `usuario_mail` | FK → Usuario.mail | |
| `pais_sede` | VARCHAR | País que administra (define jurisdicción) |
| `fecha_asignacion_cargo` | DATE | |

### `Funcionario`
Extiende `Usuario` para funcionarios de control.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `usuario_mail` | FK → Usuario.mail | |
| `numero_legajo` | VARCHAR | Identificador generado: `LEG-0001`, `LEG-0002`, etc. |

### `UsuarioTelefono`
Relación muchos-a-uno: un usuario puede tener múltiples teléfonos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `usuario_mail` | FK → Usuario.mail | |
| `telefono` | VARCHAR | Número incluyendo código de país (ej. `+59899123456`) |

### `Estadio`
PK compuesta: dirección física completa.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `dir_pais` | VARCHAR PK | País del estadio |
| `dir_localidad` | VARCHAR PK | Ciudad |
| `dir_calle` | VARCHAR PK | Calle |
| `dir_numero` | VARCHAR PK | Número |
| `nombre` | VARCHAR UNIQUE | Nombre del estadio (usado en URLs de la API) |
| `aforo` | INT | Capacidad máxima total del estadio |

**Por qué PK compuesta**: la dirección física es el identificador real de un estadio. Dos estadios en la misma dirección son el mismo estadio. Esto evita duplicados y es la forma académicamente correcta de modelar una entidad con identificador natural.

### `Sector`
Subdivisión de un estadio (tribuna norte, platea, VIP, etc.).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT AI PK | ID autoincremental |
| `estadio_pais` | VARCHAR FK → Estadio | |
| `estadio_localidad` | VARCHAR FK → Estadio | |
| `estadio_calle` | VARCHAR FK → Estadio | |
| `estadio_numero` | VARCHAR FK → Estadio | |
| `nombre` | VARCHAR | Nombre del sector |
| `capacidad` | INT | Cantidad máxima de asientos |

La capacidad total de todos los sectores de un estadio no puede superar el `aforo` del estadio.

### `Equipo`
Los equipos participantes del mundial.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | |
| `nombre` | VARCHAR UNIQUE | Nombre del equipo (ej. "Uruguay") |

### `Evento`
Un partido entre dos equipos en un estadio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | |
| `fecha` | DATETIME | Fecha y hora del partido |
| `equipo_local_id` | FK → Equipo.id | |
| `equipo_visitante_id` | FK → Equipo.id | |
| `estadio_pais` | FK → Estadio | |
| `estadio_localidad` | FK → Estadio | |
| `estadio_calle` | FK → Estadio | |
| `estadio_numero` | FK → Estadio | |
| `cancelado` | BOOLEAN DEFAULT FALSE | Indica si el evento fue cancelado |

### `EventoSector`
Tabla de relación entre Evento y Sector. Habilita un sector para la venta en un evento específico.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `evento_id` | FK → Evento.id | |
| `sector_id` | FK → Sector.id | |
| `costo` | DECIMAL | Precio de la entrada en ese sector para ese evento |

PK compuesta: `(evento_id, sector_id)`. Un sector puede tener distinto precio en cada evento.

### `Estado`
Tabla de estados posibles de una venta.

| id | descripcion |
|----|-------------|
| 1 | PENDIENTE |
| 2 | CONFIRMADA |
| 3 | PAGA |

### `ComisionHistorica`
Historial de tasas de comisión. En todo momento solo hay una fila con `fecha_hasta IS NULL` (la vigente).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT AI PK | |
| `tasa` | DECIMAL | Ej. 0.10 = 10% |
| `fecha_desde` | DATE | Inicio de vigencia |
| `fecha_hasta` | DATE NULL | Fin de vigencia (NULL = activa) |

### `Venta`
Una transacción de compra. Contiene N entradas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | |
| `usuario_mail` | FK → Usuario.mail | Comprador original |
| `fecha` | DATETIME | Cuándo se creó |
| `estado_id` | FK → Estado.id | 1=PENDIENTE, 2=CONFIRMADA, 3=PAGA |
| `precio` | DECIMAL | Total incluyendo comisión |
| `tasa_comision` | DECIMAL | Tasa vigente al momento de la compra |

### `Entrada`
Una entrada individual para un evento en un sector específico.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | |
| `venta_id` | FK → Venta.id | Venta que la generó |
| `titular_mail` | FK → Usuario.mail | **Actual poseedor** (cambia con transferencias) |
| `costo` | DECIMAL | Precio sin comisión |
| `evento_id` | FK → Evento.id | |
| `sector_id` | FK → Sector.id | |
| `consumido` | BOOLEAN DEFAULT FALSE | TRUE después de ser escaneada en el estadio |

`titular_mail` vs `venta.usuario_mail`: el comprador (`venta.usuario_mail`) no cambia nunca. El titular (`entrada.titular_mail`) cambia cuando la entrada se transfiere. El reembolso en caso de cancelación va al titular actual, no al comprador original.

### `Qr`
Código QR asociado a una entrada. Un QR tiene vida corta (30 segundos).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | |
| `entrada_id` | FK → Entrada.id | |
| `codigo_hash` | VARCHAR(64) | Token aleatorio de 64 caracteres hex |
| `creado_en` | DATETIME | Cuándo se generó |
| `activo` | BOOLEAN | Solo uno activo a la vez por entrada |

Cuando se genera un QR nuevo, se desactivan todos los anteriores de esa entrada.

### `Transferencia`
Registro de una transferencia de entrada entre dos usuarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT AI PK | |
| `entrada_id` | FK → Entrada.id | |
| `origen_mail` | FK → Usuario.mail | Quien transfiere |
| `destino_mail` | FK → Usuario.mail | Quien recibe |
| `fecha` | DATETIME | |
| `estado` | ENUM | `PENDIENTE`, `ACEPTADA`, `RECHAZADA` |

Restricción: máximo 3 transferencias aceptadas por entrada. No puede haber más de una pendiente a la vez.

### `Dispositivo`
Un scanner (smartphone/tablet) autorizado para validar entradas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | VARCHAR(36) UUID PK | Generado con `SELECT UUID()` en MySQL |
| `funcionario_mail` | FK → Funcionario | Funcionario asignado |
| `activo` | BOOLEAN | Si puede usarse o no |

### `FuncionarioSectorEvento`
Asignación de un funcionario a un sector específico de un evento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT AI PK | |
| `funcionario_mail` | FK → Funcionario | |
| `evento_id` | FK → Evento | |
| `sector_id` | FK → Sector | |

Un funcionario solo puede validar entradas en los sectores a los que fue asignado para ese evento.

### `Validacion`
Registro del escaneo de una entrada.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | |
| `entrada_id` | FK → Entrada | |
| `qr_id` | FK → Qr | |
| `dispositivo_id` | FK → Dispositivo | |
| `funcionario_mail` | FK → Funcionario | |
| `timestamp_val` | DATETIME | Momento del escaneo |

---

## SQL de consultas complejas explicadas

### Disponibilidad de sectores en un evento

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
WHERE es.evento_id = %s
GROUP BY es.sector_id, s.nombre, es.costo, s.capacidad
```

**Por qué el `EXISTS` con la condición de tiempo**: Las ventas en estado `PENDIENTE` (estado_id = 1) con más de 15 minutos de antigüedad son "carritos expirados". Esas entradas ya no deberían contar como vendidas. El `NOT (estado_id = 1 AND fecha < hace 15 min)` incluye:
- Entradas de ventas pagadas (estado 3) → siempre cuentan
- Entradas de ventas confirmadas (estado 2) → siempre cuentan
- Entradas de ventas pendientes recientes (< 15 min) → cuentan (están "reservadas")
- Entradas de ventas pendientes viejas (> 15 min) → NO cuentan (el carrito expiró)

### Reembolso por cancelación

```sql
SELECT ent.titular_mail,
       SUM(ent.costo * (1 + v.tasa_comision)) AS reembolso
FROM Entrada ent
JOIN Venta v ON v.id = ent.venta_id
WHERE ent.evento_id = %s
  AND v.estado_id IN (SELECT id FROM Estado WHERE descripcion IN ('PAGA', 'CONFIRMADA'))
GROUP BY ent.titular_mail
```

Agrupa por titular actual (`titular_mail`, no por `v.usuario_mail`). Solo incluye ventas pagadas o confirmadas. Las PENDIENTES no cobradas no se reembolsan. Suma `costo * (1 + tasa_comision)` = precio final que pagó el titular.
