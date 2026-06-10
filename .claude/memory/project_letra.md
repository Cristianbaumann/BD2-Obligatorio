---
name: project-letra-obligatorio
description: Letra completa del obligatorio BD2 2026 — requerimientos, entregas, fechas. Consultar para verificar que nada falte.
metadata:
  type: project
---

# Obligatorio BD2 2026 — Sistema de Ticketing Mundial 2026

**Universidad Católica del Uruguay — Facultad de Ingeniería y Tecnologías**
**Grupo 5**

## Contexto
Sistema de ticketing con modelo de Entrada Dinámica — QR que muta cada 30s para evitar fraude. Registro histórico de cadena de custodia de cada entrada.

## Stack elegido por el grupo
Python 3.11 + FastAPI, MySQL 8, React + JavaScript, JWT, Docker.

---

## Requerimientos obligatorios

### Usuarios y Roles (RBAC)
- Registro con: mail (PK), documento (País+Tipo+Número único), dirección (País+Localidad+Calle+Número+CodPostal), múltiples teléfonos
- **ADMIN**: gestiona estadios/eventos de su jurisdicción. Atributo: FechaAsignacionCargo
- **FUNCIONARIO**: vinculado a dispositivo físico. Atributo: NúmeroLegajo
- **USUARIO_FINAL**: compra/recibe/transfiere entradas. Atributos: FechaRegistro, EstadoVerificación

### Infraestructura y Eventos
- Estadios con Sectores (A/B/C/D) — cada sector tiene capacidad máxima (límite duro) y costo
- Eventos: equipos local/visitante, estadio, fecha/hora. **No superposición** en mismo estadio
- Cada evento habilita uno o más sectores del estadio
- Solo el Admin da de alta eventos

### Ventas
- Una venta puede tener múltiples entradas (distintos sectores o mismo sector)
- Cada entrada tiene ID único, queda bajo titularidad del comprador
- **Máximo 5 entradas por transacción**
- Venta registra: fecha, estado (PENDIENTE/CONFIRMADA/PAGA), monto total
- Monto = costo entradas + **comisión 5%** (tasa variable en el tiempo — guardar snapshot)

### Transferencias
- Usuario puede transferir entrada a otro usuario
- Destinatario debe aceptar para cambiar propietario
- Log histórico completo (cadena de custodia)
- **Máximo 3 transferencias** por entrada antes de validación

### Seguridad y Validación
- **QR Dinámico**: se regenera cada 30s mientras app está en primer plano
- **Dispositivos autorizados**: solo dispositivos vinculados a un funcionario pueden escanear
- Al validar: verificar QR activo, registrar código aceptado + identidad del funcionario
- Entrada marcada como "consumida" de forma **irreversible**
- Funcionario debe haber validado en todos los sectores a los que fue asignado en un evento

### Funcionalidades mínimas
- [ ] Registro de usuarios
- [ ] Compra de entradas
- [ ] Transferencia de entradas
- [ ] Registro de eventos (Admin)
- [ ] Validación de ingreso a eventos (Funcionario + dispositivo)
- [ ] Listar compras y transferencias por usuario
- [ ] Listar entradas asignadas a cada usuario
- [ ] Eventos con más entradas vendidas (ranking)
- [ ] Ranking de mayores compradores

### Requerimientos opcionales (implementados)
- [x] QR dinámico
- [x] Reportes estadísticos para admin
- [x] Optimización con índices
- [x] Docker

---

## Fechas de entrega

| Entregable | Fecha |
|---|---|
| Letra | 15/04/2026 |
| MER | 18/05/2026 |
| Informe (PDF, máx 50 págs) | 22/06/2026 |
| Ejecutable + docs | 24/06/2026 |
| Defensas | 29/06/2026 y 01/07/2026 |

**Why:** Tener siempre presente qué es obligatorio vs opcional, y las fechas, para priorizar correctamente.
**How to apply:** Antes de marcar algo como "completo" verificar contra esta lista. Si falta algo de los requerimientos obligatorios, es prioridad máxima.
