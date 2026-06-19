# Documentación — Sistema de Ticketing FIFA World Cup 2026

## Índice

| Archivo | Contenido |
|---------|-----------|
| [arquitectura.md](arquitectura.md) | Stack, estructura de carpetas, decisiones de diseño, SQL puro |
| [autenticacion.md](autenticacion.md) | Auth0, JWT, ROPG, roles, guards, flujo completo de tokens |
| [base_de_datos.md](base_de_datos.md) | Conexión MySQL, `get_db`, por qué no ORM, manejo de errores |
| [flujos_negocio.md](flujos_negocio.md) | Flujos end-to-end: registro → compra → entrada → escaneo |
| [api/auth.md](api/auth.md) | Endpoints `/auth` |
| [api/usuarios.md](api/usuarios.md) | Endpoints `/usuarios` |
| [api/estadios.md](api/estadios.md) | Endpoints `/estadios` y `/estadios/{nombre}/sectores` |
| [api/eventos.md](api/eventos.md) | Endpoints `/eventos` |
| [api/ventas.md](api/ventas.md) | Endpoints `/ventas` (carrito, pago, comisión) |
| [api/entradas.md](api/entradas.md) | Endpoints `/entradas` y `/qr` |
| [api/transferencias.md](api/transferencias.md) | Endpoints `/transferencias` |
| [api/validaciones.md](api/validaciones.md) | Endpoints `/validaciones` (escaneo QR) |
| [api/dispositivos.md](api/dispositivos.md) | Endpoints `/dispositivos` |
| [api/asignaciones.md](api/asignaciones.md) | Endpoints `/asignaciones` (funcionario-sector-evento) |
| [api/reportes.md](api/reportes.md) | Endpoints `/reportes` |
| [api/equipos.md](api/equipos.md) | Endpoints `/equipos` |
| [frontend.md](frontend.md) | Arquitectura frontend: rutas, store, interceptores |

---

## Tabla de todos los endpoints

| Método | Ruta | Rol requerido | Descripción breve |
|--------|------|---------------|-------------------|
| POST | `/auth/register` | público | Crear cuenta nueva |
| POST | `/auth/login` | público | Iniciar sesión |
| GET | `/auth/me` | cualquier rol | Token → datos del usuario |
| GET | `/usuarios/` | ADMIN | Listar usuarios (filtros) |
| GET | `/usuarios/me` | autenticado | Mi perfil completo |
| PUT | `/usuarios/me` | autenticado | Actualizar dirección/teléfonos |
| PATCH | `/usuarios/{mail}/verificar` | ADMIN o yo mismo | Verificar identidad |
| GET | `/usuarios/funcionarios` | ADMIN | Listar funcionarios |
| PATCH | `/usuarios/{mail}/promover-funcionario` | ADMIN | Ascender a funcionario |
| GET | `/estadios/` | público | Listar estadios |
| POST | `/estadios/` | ADMIN | Crear estadio |
| GET | `/estadios/{nombre}` | público | Detalle + sectores |
| PUT | `/estadios/{nombre}` | ADMIN | Editar estadio |
| DELETE | `/estadios/{nombre}` | ADMIN | Eliminar estadio |
| POST | `/estadios/{nombre}/sectores` | ADMIN | Crear sector |
| PUT | `/estadios/{nombre}/sectores/{id}` | ADMIN | Editar capacidad de sector |
| DELETE | `/estadios/{nombre}/sectores/{id}` | ADMIN | Eliminar sector |
| GET | `/eventos/` | público | Listar eventos con disponibilidad |
| POST | `/eventos/` | ADMIN | Crear evento |
| GET | `/eventos/{id}` | público | Detalle de evento |
| PUT | `/eventos/{id}` | ADMIN | Editar evento |
| DELETE | `/eventos/{id}` | ADMIN | Eliminar evento (sin entradas) |
| GET | `/eventos/{id}/disponibilidad` | público | Sectores con plazas disponibles |
| POST | `/eventos/{id}/sectores` | ADMIN | Habilitar sectores en evento |
| DELETE | `/eventos/{id}/sectores/{sector_id}` | ADMIN | Deshabilitar sector en evento |
| PATCH | `/eventos/{id}/cancelar` | ADMIN | Cancelar evento + reembolso |
| POST | `/ventas/` | USUARIO_FINAL | Agregar al carrito / crear venta |
| GET | `/ventas/carrito` | autenticado | Ver carrito activo |
| GET | `/ventas/mis-ventas` | autenticado | Historial de compras |
| PATCH | `/ventas/{id}/pagar` | autenticado | Pagar carrito |
| DELETE | `/ventas/{id}` | autenticado | Cancelar ítem del carrito |
| GET | `/ventas/{id}` | autenticado | Detalle de venta |
| PATCH | `/ventas/{id}/estado` | ADMIN | Cambiar estado de venta |
| GET | `/ventas/comision` | público | Tasa de comisión vigente |
| GET | `/ventas/comision/historial` | ADMIN | Historial de tasas |
| PUT | `/ventas/comision` | ADMIN | Actualizar tasa de comisión |
| GET | `/entradas/mis-entradas` | autenticado | Mis entradas con QR y evento |
| GET | `/entradas/{id}` | titular o ADMIN | Detalle de entrada |
| GET | `/entradas/{id}/qr` | titular | QR activo de entrada |
| GET | `/entradas/{id}/historial` | titular o ADMIN | Cadena de custodia |
| GET | `/qr/{entrada_id}` | autenticado | URL de imagen QR |
| POST | `/transferencias/` | autenticado | Iniciar transferencia |
| GET | `/transferencias/mis-transferencias` | autenticado | Mis transferencias |
| PATCH | `/transferencias/{id}/aceptar` | destinatario | Aceptar transferencia |
| PATCH | `/transferencias/{id}/rechazar` | destinatario | Rechazar transferencia |
| POST | `/validaciones/` | FUNCIONARIO | Validar (escanear) entrada |
| GET | `/validaciones/` | público | Listar validaciones |
| GET | `/dispositivos/` | ADMIN | Listar dispositivos |
| GET | `/dispositivos/mis-dispositivos` | FUNCIONARIO | Mis dispositivos activos |
| GET | `/dispositivos/autorizados` | ADMIN | Dispositivos activos |
| POST | `/dispositivos/` | ADMIN | Registrar dispositivo |
| DELETE | `/dispositivos/{id}` | ADMIN | Eliminar dispositivo |
| POST | `/asignaciones/` | ADMIN | Asignar funcionario a sector |
| GET | `/asignaciones/` | ADMIN | Listar asignaciones |
| DELETE | `/asignaciones/{id}` | ADMIN | Eliminar asignación |
| GET | `/equipos/` | público | Listar equipos |
| POST | `/equipos/` | ADMIN | Crear equipo |
| GET | `/reportes/ventas` | público | Totales de ventas |
| GET | `/reportes/ocupacion` | público | Ocupación por sector |
| GET | `/reportes/eventos` | público | Vendidas por evento |
| GET | `/reportes/mas-vendidos` | ADMIN | Top 10 eventos más vendidos |
| GET | `/reportes/mayores-compradores` | ADMIN | Top 10 compradores |
| GET | `/reportes/funcionario/{mail}/cobertura` | ADMIN | Cobertura de un funcionario |
| GET | `/reportes/disponibilidad_evento/{id}` | autenticado | Disponibilidad por sector |
