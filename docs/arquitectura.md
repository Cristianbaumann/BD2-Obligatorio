# Arquitectura del Proyecto

## Stack tecnológico

### Backend
- **Python 3.11+** con **FastAPI** — framework web asíncrono
- **MySQL** — base de datos relacional
- **mysql-connector-python** — driver MySQL (sin ORM)
- **Auth0** — proveedor de identidad externo (autenticación y emisión de JWT)
- **Pydantic** — validación de datos de entrada/salida
- **python-jose** — decodificación y verificación de JWT
- **httpx** — cliente HTTP para llamadas a la API de Auth0

### Frontend
- **React 18** con **Vite**
- **React Router DOM** — navegación y rutas protegidas
- **Axios** — cliente HTTP con interceptores
- **Zustand** — estado global (autenticación)
- **Framer Motion** — animaciones
- **Lucide React** — iconos
- **react-hot-toast** — notificaciones

---

## Estructura de carpetas

```
BD2-Obligatorio/
├── backend/
│   ├── main.py                  ← punto de entrada, configura FastAPI y middleware
│   ├── database.py              ← conexión MySQL + generador get_db
│   ├── core/
│   │   ├── config.py            ← variables de entorno (DB, Auth0)
│   │   └── security.py          ← decodificación JWT Auth0, constantes de roles
│   ├── dependencies/
│   │   └── auth.py              ← guards: get_current_user, require_admin, require_funcionario
│   ├── routers/                 ← un archivo por dominio de la API
│   │   ├── auth.py              ← /auth/register, /auth/login, /auth/me
│   │   ├── usuarios.py          ← /usuarios/...
│   │   ├── estadios.py          ← /estadios/... y /estadios/{nombre}/sectores/...
│   │   ├── eventos.py           ← /eventos/...
│   │   ├── ventas.py            ← /ventas/... (carrito, pago, comisión)
│   │   ├── entradas.py          ← /entradas/... (mis-entradas, qr, historial)
│   │   ├── transferencias.py    ← /transferencias/...
│   │   ├── validaciones.py      ← /validaciones/ (escaneo QR)
│   │   ├── dispositivos.py      ← /dispositivos/...
│   │   ├── asignaciones.py      ← /asignaciones/ (funcionario-sector-evento)
│   │   ├── reportes.py          ← /reportes/...
│   │   ├── equipos.py           ← /equipos/...
│   │   └── qr.py                ← /qr/{entrada_id} (URL de imagen QR)
│   ├── schemas/                 ← modelos Pydantic para request/response
│   │   ├── auth.py
│   │   ├── usuario.py
│   │   ├── estadio.py
│   │   ├── evento.py
│   │   ├── venta.py
│   │   ├── entrada.py
│   │   ├── transferencia.py
│   │   ├── validacion.py
│   │   ├── dispositivo.py
│   │   ├── reporte.py
│   │   └── equipo.py
│   ├── services/
│   │   └── auth0_service.py     ← wrapper para la API de Auth0 (Management + ROPG)
│   └── middleware/
│       └── auth_middleware.py   ← (existe pero la lógica está en dependencies/auth.py)
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             ← punto de entrada React
│   │   ├── App.jsx              ← router principal, rutas protegidas
│   │   ├── store/
│   │   │   └── authStore.js     ← estado global de autenticación (Zustand)
│   │   ├── services/
│   │   │   └── api.js           ← instancia Axios con interceptores
│   │   ├── constants/
│   │   │   ├── navLinks.js      ← links de navegación por rol
│   │   │   └── countryCodes.js  ← lista de países con código telefónico
│   │   ├── components/          ← componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── QRCountdown.jsx
│   │   │   └── admin/           ← componentes específicos del panel admin
│   │   └── pages/               ← vistas por rol
│   │       ├── Home.jsx
│   │       ├── AuthPage.jsx     ← login + registro (un solo componente con animación)
│   │       ├── usuario/         ← Eventos, ComprarEntrada, MisEntradas, etc.
│   │       ├── funcionario/     ← Dashboard, Scanner
│   │       └── admin/           ← Dashboard, Eventos, Estadios, Funcionarios, etc.
│
└── docs/                        ← esta documentación
```

---

## SQL puro — prohibido ORM

**Regla del proyecto**: todas las consultas a la base de datos se escriben en SQL directo. No se usa SQLAlchemy, ni ningún ORM.

**Por qué**: el obligatorio requiere que los alumnos dominen SQL a mano — joins, subqueries, transacciones, índices. Usar un ORM abstraería toda esa lógica y no se podría evaluar el manejo de la base de datos.

**Cómo se hace**:
```python
# ✅ Correcto — SQL puro
cursor.execute(
    "SELECT mail, rol FROM Usuario WHERE auth0_id = %s",
    (auth0_id,),
)
user = cursor.fetchone()

# ❌ Prohibido — ORM / SQLAlchemy
user = db.query(Usuario).filter(Usuario.auth0_id == auth0_id).first()
```

Los parámetros siempre se pasan como tupla separada del SQL (nunca concatenados en el string) para evitar inyección SQL.

---

## Configuración y variables de entorno

El archivo `backend/.env` (no commiteado) contiene:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=ticketing

AUTH0_DOMAIN=tu-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_MGMT_CLIENT_ID=...
AUTH0_MGMT_CLIENT_SECRET=...
AUTH0_AUDIENCE=https://api.mundial2026.com
```

La clase `Settings` en `core/config.py` usa `pydantic-settings` para leer estas variables y proveer defaults. Se accede como `settings.DB_HOST`, etc.

---

## CORS

En `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # en producción se restringe al dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Qué es CORS**: Cross-Origin Resource Sharing. Es un mecanismo del navegador que bloquea requests HTTP desde un origen (dominio/puerto) distinto al servidor, a menos que el servidor explícitamente lo permita con headers especiales (`Access-Control-Allow-Origin`, etc.). En desarrollo, el frontend corre en `localhost:5173` y el backend en `localhost:8000` — son orígenes distintos, entonces sin CORS el navegador bloquearía todos los requests. El middleware de FastAPI agrega automáticamente los headers necesarios.

---

## Manejo global de errores

`main.py` registra tres manejadores de excepciones:

1. **IntegrityError** → HTTP 409 Conflict. Se activa cuando MySQL detecta una restricción violada (clave única duplicada, FK inexistente, etc.). Se transforma en una respuesta JSON legible.

2. **DatabaseError** → HTTP 500. Error genérico de base de datos no tipificado.

3. **Exception** → HTTP 500. Captura cualquier excepción no manejada, imprime el traceback en consola y devuelve el mensaje.

Esto evita que los errores crudos de MySQL lleguen como texto sin formato al cliente.

---

## Estructura de un router típico

```python
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from dependencies.auth import require_admin
from schemas.estadio import EstadioCreate, EstadioOut

router = APIRouter(prefix="/estadios", tags=["estadios"])

@router.post("/", response_model=EstadioOut, status_code=201)
def create_estadio(
    estadio: EstadioCreate,   # body del request — Pydantic valida automáticamente
    cursor=Depends(get_db),   # inyecta la conexión MySQL
    admin=Depends(require_admin),  # inyecta el usuario autenticado, verifica que sea ADMIN
):
    cursor.execute("INSERT INTO Estadio ...", (...))
    return estadio.model_dump()
```

**`Depends()`** es el sistema de inyección de dependencias de FastAPI. Permite que funciones (como `get_db` o `require_admin`) se ejecuten automáticamente antes del handler y provean objetos al mismo.

---

## Convención de IDs

- **Usuarios**: identificados por `mail` (string, clave primaria natural)
- **Estadios**: PK compuesta por dirección física (pais + localidad + calle + numero). El campo `nombre` es una clave alternativa usada en las URLs
- **Sectores**: ID autoincremental entero
- **Eventos**: UUID v4 generado en Python
- **Ventas**: UUID v4 generado en Python
- **Entradas**: UUID v4 generado en Python
- **QR**: UUID v4 generado en Python; el `codigo_hash` es `secrets.token_hex(32)` (64 chars hex aleatorios)
- **Dispositivos**: UUID generado con `SELECT UUID()` en MySQL
- **Equipos**: UUID v4 generado en Python
- **Transferencias**: ID autoincremental entero
