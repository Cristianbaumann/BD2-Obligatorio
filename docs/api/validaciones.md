# Endpoints: /validaciones

## POST /validaciones/

**¿Qué hace?** Valida (escanea) una entrada usando su código QR. Marca la entrada como consumida.

**Acceso**: FUNCIONARIO (o ADMIN)

**Body**:
```json
{
  "codigo_hash": "a3f8c2d1e4b5a6f7...",
  "dispositivo_id": "uuid-dispositivo"
}
```

**Proceso detallado**:

### Paso 1: Verificar dispositivo
```sql
SELECT id, funcionario_mail FROM Dispositivo
WHERE id = ? AND funcionario_mail = ? AND activo = TRUE
```
El dispositivo debe pertenecer al funcionario autenticado y estar activo. Evita que un funcionario use el dispositivo de otro, o que use un dispositivo dado de baja.

### Paso 2: Verificar QR
```sql
SELECT id, entrada_id, creado_en FROM Qr
WHERE codigo_hash = ? AND activo = TRUE
AND creado_en > DATE_SUB(NOW(), INTERVAL 30 SECOND)
```
El QR debe:
- Existir en la base de datos (el hash es correcto)
- Estar activo (`activo = TRUE`)
- Tener menos de 30 segundos de antigüedad

Si el QR tiene más de 30 segundos → expirado → el usuario debe regenerarlo (abriendo la pantalla del QR de nuevo).

### Paso 3: Verificar entrada (con bloqueo)
```sql
SELECT id, consumido, evento_id, sector_id FROM Entrada WHERE id = ? FOR UPDATE
```
`FOR UPDATE` bloquea la fila. Si dos dispositivos escanean el mismo QR simultáneamente, el segundo encontrará `consumido = TRUE` y devolverá error. Previene doble entrada.

### Paso 4: Verificar cobertura del funcionario
```sql
SELECT 1 FROM FuncionarioSectorEvento
WHERE funcionario_mail = ? AND evento_id = ? AND sector_id = ?
```
El funcionario solo puede validar entradas en los sectores a los que fue asignado para ese evento específico. Evita que un funcionario del sector VIP valide entradas de la tribuna.

### Paso 5: Registrar
```sql
UPDATE Entrada SET consumido = TRUE WHERE id = ?

INSERT INTO Validacion (id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val)
VALUES (UUID(), ?, ?, ?, ?, NOW())
```

**Respuesta 201**:
```json
{
  "id": "uuid-validacion",
  "entrada_id": "uuid-entrada",
  "qr_id": "uuid-qr",
  "dispositivo_id": "uuid-dispositivo",
  "funcionario_mail": "funcionario@example.com",
  "timestamp_val": "2026-06-15T20:05:33"
}
```

**Errores posibles**:
- 403: Dispositivo no autorizado para este funcionario
- 404: QR no encontrado, inactivo o expirado
- 404: Entrada no encontrada
- 409: Entrada ya fue consumida
- 403: Funcionario no asignado a este sector

---

## GET /validaciones/

**¿Qué hace?** Lista todas las validaciones del sistema.

**Acceso**: público (sin restricción — esto podría refinarse en el futuro)

**SQL**:
```sql
SELECT id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val
FROM Validacion
ORDER BY timestamp_val DESC
```

---

## Flujo visual en el Scanner

El scanner del funcionario (página `/funcionario/scanner`) tiene dos modos:
1. **Cámara**: usa `Html5Qrcode` para leer QRs con la cámara del dispositivo
2. **Código manual**: input de texto donde se escribe el `codigo_hash` directamente

Ambos modos llaman al mismo endpoint `POST /validaciones/` con el mismo body.

Resultado visual:
- **VÁLIDA** (verde): entrada aceptada, se anima con pantalla verde
- **INVÁLIDA** (rojo): cualquier error, pantalla roja con el mensaje del error
