# Flujos de Negocio

## Flujo completo: desde el registro hasta ingresar al estadio

```
[REGISTRO] → [VERIFICACIÓN] → [COMPRA] → [CARRITO] → [PAGO] → [ENTRADA QR] → [ESCANEO]
```

---

## 1. Registro de usuario

**¿Quién lo hace?** Cualquier persona, sin autenticación.

**Pasos**:
1. Llenar formulario: nombre, apellido, email, contraseña, documento, dirección, al menos 1 teléfono
2. El backend crea el usuario en Auth0 y en MySQL
3. El sistema devuelve un JWT de acceso y el usuario ya está logueado
4. El estado de verificación es `PENDIENTE` — todavía no puede comprar entradas

---

## 2. Verificación de identidad

**¿Quién lo hace?** El administrador (o el propio usuario).

**¿Por qué existe?** Para evitar que bots o usuarios falsos compren entradas masivamente. Un admin revisa los documentos y marca al usuario como VERIFICADO.

**Endpoint**: `PATCH /usuarios/{mail}/verificar`

**Restricción en compra**:
```python
if uf["estado_verificacion"] != "VERIFICADO":
    raise HTTPException(403, "Identidad no verificada")
```

---

## 3. Configuración previa (rol ADMIN)

Antes de que los usuarios puedan comprar, el admin debe configurar:

### 3a. Crear equipos
`POST /equipos/` — define los equipos que juegan en el mundial

### 3b. Crear estadios
`POST /estadios/` — solo el admin del país del estadio puede crearlo
- Dirección completa como PK
- Aforo total

### 3c. Crear sectores dentro del estadio
`POST /estadios/{nombre}/sectores` — subdivision del estadio (tribuna norte, VIP, etc.)
- La suma de capacidades de todos los sectores no puede superar el aforo del estadio

### 3d. Crear evento (partido)
`POST /eventos/` — asigna dos equipos, un estadio, fecha/hora
- Solo el admin del país donde está el estadio puede crearlo

### 3e. Habilitar sectores en el evento
`POST /eventos/{id}/sectores` — especifica qué sectores del estadio estarán disponibles y a qué precio para ese evento específico
- Un estadio puede tener 5 sectores pero solo 3 habilitarse para cierto partido

---

## 4. Compra de entradas (carrito)

**¿Quién lo hace?** USUARIO_FINAL verificado.

**Restricciones**:
- Máximo 5 entradas en el carrito
- El carrito expira a los 15 minutos si no se paga
- Solo un carrito activo a la vez (si se agrega más, se suma al carrito existente)

**Flujo**:

```
POST /ventas/
  body: { entradas: [{ evento_id, sector_id, cantidad }] }
```

1. Verifica que el usuario esté verificado
2. Limpia carritos expirados (DELETE entrada y venta con > 15 min en PENDIENTE)
3. Verifica si ya tiene carrito activo → si sí, reutiliza esa venta
4. Para cada sector: verifica disponibilidad (capacidad - entradas reservadas/pagadas)
5. Crea la venta (estado PENDIENTE) si no existía
6. Crea una Entrada por cada unidad pedida
7. Recalcula el precio total: `SUM(costo) * (1 + tasa_comision)`
8. Devuelve la venta con todas las entradas

**El precio de comisión** se congela al momento de crear el carrito (`tasa_comision` se guarda en la venta). Si el admin cambia la tasa después, la venta ya creada no se ve afectada.

---

## 5. Pagar

**Endpoint**: `PATCH /ventas/{id}/pagar`

1. Verifica que la venta sea del usuario y esté PENDIENTE
2. Verifica que el carrito no haya expirado (< 15 minutos desde `fecha`)
3. Avanza el estado: PENDIENTE → CONFIRMADA → PAGA (dos UPDATE seguidos)
4. Devuelve la venta pagada

**¿Por qué dos UPDATE?** El estado CONFIRMADA es un estado intermedio de "reserva confirmada". Se usa para representar el flujo de pago en dos fases (common en e-commerce: confirmar → procesar pago). En la implementación actual se hacen los dos pasos seguidos, simulando el pago instantáneo.

---

## 6. Ver mis entradas

**Endpoint**: `GET /entradas/mis-entradas`

Devuelve todas las entradas donde `titular_mail = usuario_autenticado`.

La consulta hace joins con Evento, Equipo, Sector, Estadio y Qr para devolver toda la info en un solo request, evitando N+1 queries:

```sql
SELECT e.*, ev.fecha, ev.cancelado, el.nombre AS equipo_local, ...
FROM Entrada e
JOIN Evento ev ON ev.id = e.evento_id
JOIN Equipo el ON el.id = ev.equipo_local_id
...
LEFT JOIN Qr q ON q.entrada_id = e.id AND q.activo = TRUE
WHERE e.titular_mail = %s
```

---

## 7. Ver el QR de una entrada

**Endpoint**: `GET /entradas/{id}/qr` o `GET /qr/{entrada_id}`

Diferencia entre ambos:
- `/entradas/{id}/qr` devuelve los datos del QR (código_hash, id, creado_en)
- `/qr/{entrada_id}` devuelve una URL de imagen del QR (servicies externo qrserver.com)

**Lógica**:
1. Verificar que el usuario sea el titular
2. Buscar QR activo no expirado (creado hace menos de 30 segundos)
3. Si no hay → desactivar todos los anteriores y crear uno nuevo con `secrets.token_hex(32)`
4. Devolver el QR

**¿Por qué 30 segundos de vida?** El QR tiene vida muy corta para evitar capturas de pantalla. Cada vez que el usuario abre la pantalla del QR, se genera uno nuevo. El validador en el estadio tiene 30 segundos para escanearlo desde que se mostró.

---

## 8. Transferencia de entrada

**¿Para qué?** El titular puede transferir una entrada a otro usuario registrado (regalo, venta entre particulares).

**Flujo**:
```
POST /transferencias/
  body: { entrada_id, destino_mail }
```

1. Verifica que el destinatario esté registrado
2. Verifica que el solicitante sea el titular actual
3. Verifica que la entrada no esté consumida
4. Verifica que no se transfiera a sí mismo
5. Verifica que no haya 3 transferencias ACEPTADAS (límite de reventas)
6. Verifica que no haya una transferencia PENDIENTE activa
7. Crea la transferencia en estado PENDIENTE

**El destinatario luego:**
- `PATCH /transferencias/{id}/aceptar` → cambia `titular_mail` en Entrada, invalida el QR anterior
- `PATCH /transferencias/{id}/rechazar` → cambia estado a RECHAZADA, nada más

**¿Por qué invalidar el QR al aceptar?** El titular anterior podría haber guardado una captura del QR. Al transferir, el QR se invalida y se generará uno nuevo para el nuevo titular.

---

## 9. Escaneo en el estadio (Validación)

**¿Quién lo hace?** FUNCIONARIO asignado al sector del evento.

**Flujo**:
```
POST /validaciones/
  body: { codigo_hash, dispositivo_id }
```

1. Verifica que el dispositivo pertenezca a ese funcionario y esté activo
2. Busca el QR por `codigo_hash` donde `activo = TRUE` y `creado_en > hace 30 segundos`
   - Si no encontrado → "QR inactivo o expirado"
3. Obtiene la entrada asociada al QR (con `FOR UPDATE` — bloqueo de fila para prevenir doble scan)
   - Si `consumido = TRUE` → "Entrada ya consumida"
4. Verifica que el funcionario esté asignado al sector del evento
   - Si no asignado → 403
5. Marca `Entrada.consumido = TRUE`
6. Inserta en Validacion

**`FOR UPDATE`**: bloqueo pesimista de la fila. Si dos funcionarios escanean el mismo QR al mismo tiempo, el primero bloquea la fila, marca consumido=TRUE, y el segundo encuentra consumido=TRUE y devuelve error. Previene doble entrada.

---

## Flujo de cancelación de evento

**¿Quién lo hace?** ADMIN de la jurisdicción.

```
PATCH /eventos/{id}/cancelar
```

1. Verifica que el evento exista y sea del admin
2. Verifica que no esté ya cancelado
3. `UPDATE Evento SET cancelado = TRUE`
4. Consulta todas las entradas con venta PAGA o CONFIRMADA:
   ```sql
   SELECT ent.titular_mail, SUM(ent.costo * (1 + v.tasa_comision)) AS reembolso
   FROM Entrada ent JOIN Venta v ON v.id = ent.venta_id
   WHERE ent.evento_id = %s
     AND v.estado_id IN (SELECT id FROM Estado WHERE descripcion IN ('PAGA', 'CONFIRMADA'))
   GROUP BY ent.titular_mail
   ```
5. Por cada titular: `UPDATE UsuarioFinal SET saldo = saldo + reembolso WHERE usuario_mail = titular`

El reembolso va al **titular actual** (quien tiene la entrada ahora), no al comprador original. Si alguien compró la entrada y la transfirió, el reembolso lo recibe quien la tiene.

---

## Configuración de comisión

La tasa de comisión es global y se aplica a todas las ventas. Hay un historial (tabla `ComisionHistorica`).

**Cambiar la tasa** (`PUT /ventas/comision`):
1. Cierra la tasa vigente: `UPDATE ComisionHistorica SET fecha_hasta = hoy WHERE fecha_hasta IS NULL`
2. Crea la nueva: `INSERT INTO ComisionHistorica (tasa, fecha_desde, fecha_hasta) VALUES (nueva, hoy, NULL)`

Las ventas ya creadas tienen su `tasa_comision` guardada y no se ven afectadas.

---

## Gestión de funcionarios y dispositivos

```
USUARIO_FINAL → (promover) → FUNCIONARIO
                                  ↓
                        asignar dispositivo(s)
                                  ↓
                        asignar a sectores de eventos
                                  ↓
                        puede escanear entradas en esos sectores
```

- Al promover a funcionario: se elimina el perfil `UsuarioFinal`, se actualiza el rol en Auth0
- Los dispositivos son entidades con UUID, asignados 1:1 a un funcionario
- Un funcionario puede tener múltiples dispositivos pero solo valida en los sectores asignados
