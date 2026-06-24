# Sistema de Ticketing — Mundial 2026

Sistema integral de comercialización, transferencia y validación de entradas para los partidos del Mundial 2026. Trabajo obligatorio para **Bases de Datos II** — Universidad Católica del Uruguay, 2026. Grupo 5.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI |
| Base de datos | MySQL 8 (servidor remoto `mysql.reto-ucu.net`) |
| Queries | SQL puro — sin ORM |
| Autenticación | Auth0 (ROPG) + JWT custom claims |
| Validación | Pydantic v2 |
| Servidor | Uvicorn |
| Frontend | React + Vite + JavaScript |
| Estado frontend | Zustand |

---

## Estructura del Proyecto

```
BD2-Obligatorio/
├── Readme.md
│
├── backend/
│   ├── main.py                  # FastAPI app, routers, CORS
│   ├── database.py              # get_connection(), get_db() (cursor dictionary)
│   ├── requirements.txt
│   ├── .env                     # Variables de entorno (no commitear)
│   ├── AUTH0_SETUP.md           # Guía completa Auth0 + troubleshooting
│   │
│   ├── core/
│   │   ├── config.py            # Settings desde .env (pydantic-settings)
│   │   └── security.py          # decode_auth0_token(), constantes de roles
│   │
│   ├── dependencies/
│   │   └── auth.py              # get_current_user, require_admin, require_funcionario
│   │
│   ├── routers/
│   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   ├── usuarios.py          # GET/PUT /usuarios/me, verificación, funcionarios
│   │   ├── estadios.py          # CRUD estadios y sectores (admin)
│   │   ├── equipos.py           # GET equipos
│   │   ├── eventos.py           # CRUD eventos, GET /eventos/mi-pais (admin)
│   │   ├── ventas.py            # Carrito, PATCH /ventas/{id}/pagar
│   │   ├── entradas.py          # GET /entradas/mis-entradas, QR, historial
│   │   ├── transferencias.py    # Iniciar / aceptar / rechazar transferencia
│   │   ├── validaciones.py      # POST /validaciones (escaneo en puerta)
│   │   ├── dispositivos.py      # Gestión de dispositivos de escaneo
│   │   ├── asignaciones.py      # Asignación funcionario ↔ sector/evento
│   │   ├── reportes.py          # Rankings y estadísticas
│   │   └── qr.py                # Generación de QR
│   │
│   ├── schemas/                 # Modelos Pydantic (request / response)
│   ├── services/
│   │   └── auth0_service.py     # Management API: crear/eliminar usuarios Auth0
│   │
│   └── sql/
│       ├── 01_schemas.sql       # DDL completo (tablas, FKs, índices)
│       ├── 02_seed_data.sql     # Datos iniciales (equipos, estadios, eventos, sectores)
│       └── 03_admin_seed.sql    # Bootstrap admins + template para promover usuarios
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Rutas React Router
    │   ├── services/api.js      # Axios con baseURL y auth header automático
    │   ├── store/
    │   │   ├── authStore.js     # Zustand: token, rol, mail, estado_verificacion
    │   │   └── eventosStore.js
    │   ├── pages/
    │   │   ├── usuario/         # Eventos, ComprarEntrada, Carrito, MisEntradas, Transferir, Perfil
    │   │   ├── admin/           # Dashboard, Estadios, Eventos, Funcionarios, Dispositivos, Configuracion
    │   │   └── funcionario/     # Dashboard, Scanner
    │   └── components/          # Layout, Navbar, MatchCard, QRCountdown, StadiumSelector…
    └── package.json
```

---

## Configuración y Arranque

### Variables de entorno (`backend/.env`)

```env
# Base de datos
DB_HOST=mysql.reto-ucu.net
DB_PORT=50006
DB_USER=ic_g5_admin
DB_PASSWORD=<password>
DB_NAME=IC_Grupo5

# Auth0
AUTH0_DOMAIN="dev-ks16wg37q4clzdxd.us.auth0.com"
AUTH0_MGMT_CLIENT_ID="<M2M client id>"
AUTH0_MGMT_CLIENT_SECRET="<M2M client secret>"
AUTH0_CLIENT_ID="<Regular Web App client id>"
AUTH0_CLIENT_SECRET="<Regular Web App client secret>"
AUTH0_AUDIENCE="https://api.mundial2026"
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI disponible en `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en `http://localhost:5173`

### Base de datos

Ejecutar en orden (solo la primera vez):

```bash
# 1. Crear tablas
mysql -h mysql.reto-ucu.net -P 50006 -u ic_g5_admin -p IC_Grupo5 < backend/sql/01_schemas.sql

# 2. Cargar datos iniciales
mysql -h mysql.reto-ucu.net -P 50006 -u ic_g5_admin -p IC_Grupo5 < backend/sql/02_seed_data.sql

# 3. Crear admins bootstrap
mysql -h mysql.reto-ucu.net -P 50006 -u ic_g5_admin -p IC_Grupo5 < backend/sql/03_admin_seed.sql
```

---

## Roles y Permisos

| Rol | Descripción | Permisos principales |
|-----|-------------|---------------------|
| `ADMIN` | Administrador por país sede | Gestionar estadios, eventos y funcionarios de su país |
| `FUNCIONARIO` | Validador en puerta | Escanear y validar entradas con dispositivo autorizado |
| `USUARIO_FINAL` | Comprador | Comprar, transferir y visualizar sus entradas |

El rol vive en **dos lugares sincronizados**: `app_metadata.rol` en Auth0 y `Usuario.rol` en la BD.

### Promover usuario a ADMIN (3 pasos obligatorios)

1. Auth0 Dashboard → Users → Edit → App Metadata: `{ "rol": "ADMIN" }`
2. `UPDATE Usuario SET rol = 'ADMIN' WHERE mail = 'usuario@ejemplo.com';`
3. `INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo) VALUES ('usuario@ejemplo.com', 'Canada', CURDATE());`

Ver `backend/sql/03_admin_seed.sql` para el ejemplo listo para ejecutar.  
Ver `backend/AUTH0_SETUP.md` para la guía completa de Auth0.

---

## Endpoints Principales

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registro — crea usuario en Auth0 y BD |
| POST | `/auth/login` | Login ROPG — devuelve JWT de Auth0 |
| GET  | `/auth/me` | Info del token actual |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/usuarios/me` | Perfil propio |
| PUT  | `/usuarios/me` | Actualizar dirección y teléfonos |
| GET  | `/usuarios/` | Listar usuarios con filtros *(Admin)* |
| PATCH | `/usuarios/{mail}/verificar` | Verificar identidad |
| PATCH | `/usuarios/{mail}/promover-funcionario` | Promover a funcionario *(Admin)* |

### Eventos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/eventos/` | Listar eventos públicos (excluye cancelados) |
| GET  | `/eventos/mi-pais` | Eventos del país del admin autenticado |
| POST | `/eventos/` | Crear evento *(Admin)* |
| PUT  | `/eventos/{id}` | Editar evento *(Admin)* |
| POST | `/eventos/{id}/cancelar` | Cancelar evento *(Admin)* |

### Ventas y Carrito
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST  | `/ventas/` | Agregar entradas al carrito (máx. 5 total) |
| GET   | `/ventas/carrito` | Ver carrito activo (TTL 15 min) |
| PATCH | `/ventas/{id}/pagar` | Pagar — PENDIENTE → CONFIRMADA → PAGA (15 s delay background) |
| DELETE | `/ventas/{id}` | Eliminar item del carrito |
| GET   | `/ventas/mis-ventas` | Historial de compras |

Estados de venta: `1=PENDIENTE` (carrito) · `2=CONFIRMADA` (procesando) · `3=PAGA` (activa)

### Entradas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/entradas/mis-entradas` | Entradas del usuario (solo estado ≥ 2) |
| GET | `/entradas/{id}` | Detalle de una entrada |
| GET | `/entradas/{id}/qr` | QR activo de la entrada |
| GET | `/entradas/{id}/historial` | Cadena de custodia completa |

### Transferencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST  | `/transferencias/` | Transferir entrada directamente (por mail) |
| POST  | `/transferencias/solicitar` | Solicitar transferencia |
| PATCH | `/transferencias/{id}/aceptar` | Aceptar transferencia recibida |
| PATCH | `/transferencias/{id}/rechazar` | Rechazar transferencia |
| GET   | `/transferencias/recibidas` | Solicitudes pendientes recibidas |

### Validación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/validaciones/` | Escanear QR y marcar entrada como consumida *(Funcionario)* |

### Estadios y Sectores
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/estadios/` | Listar estadios del país del admin |
| POST | `/estadios/` | Crear estadio *(Admin)* |
| POST | `/estadios/{...}/sectores` | Agregar sector a estadio *(Admin)* |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reportes/eventos-mas-vendidos` | Ranking por entradas vendidas |
| GET | `/reportes/mayores-compradores` | Ranking de compradores |
| GET | `/reportes/disponibilidad/{eventoId}` | Disponibilidad por sector en tiempo real |

---

## Lógica de Negocio Clave

- **Carrito con TTL** — reserva expira a los 15 minutos; entradas se liberan automáticamente
- **Máximo 5 entradas** por usuario en el carrito en simultáneo
- **Estados de venta** — PENDIENTE → CONFIRMADA (15 s simulados) → PAGA; solo PAGA habilita acciones
- **Tasa de comisión variable** — cada venta guarda snapshot de la tasa vigente al momento de compra
- **Transferencia verificada** — solo entradas de ventas PAGA pueden transferirse; máximo 3 transferencias por entrada
- **QR por entrada** — se genera al solicitarlo; una entrada consumida no puede reactivarse
- **Jurisdicción por país** — cada admin gestiona únicamente estadios y eventos de su `pais_sede`
- **Eventos cancelados** — no aparecen en búsqueda pública ni permiten compra
- **Identidad verificada** — solo usuarios con `estado_verificacion = VERIFICADO` pueden comprar

---

## Fechas de Entrega

| Entregable | Fecha |
|------------|-------|
| MER | 18/05/2026 |
| Informe | 22/06/2026 |
| Ejecutable | 24/06/2026 |
| Defensas | 29/06 y 01/07/2026 |
