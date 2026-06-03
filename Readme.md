# 🎫 Sistema de Ticketing — Mundial 2026

Sistema integral de comercialización, transferencia y validación de entradas para los partidos del Mundial 2026. Desarrollado como trabajo obligatorio para la materia **Bases de Datos II** — Universidad Católica del Uruguay, 2026.

---

## 📋 Descripción

La plataforma implementa un modelo de **Entrada Dinámica**, donde el activo digital no es una imagen estática sino un token que muta periódicamente para evitar el fraude y la reventa no autorizada. El sistema mantiene un registro histórico completo de la cadena de custodia de cada entrada, desde su emisión original hasta su validación final en puerta.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11 + FastAPI |
| Base de datos | MySQL 8 |
| Queries | SQL|
| Autenticación | JWT (python-jose + passlib) |
| Validación | Pydantic v2 |
| Servidor | Uvicorn |
| Frontend | React + JavaScript |

---

## 📁 Estructura del Proyecto

```
ticketing/
├── main.py                  # Instancia FastAPI, routers, CORS
├── database.py              # Conexión MySQL, get_connection(), get_db()
├── requirements.txt         # Dependencias
├── .env.example             # Variables de entorno de ejemplo
├── .gitignore
│
├── core/
│   ├── config.py            # Configuración desde variables de entorno
│   └── security.py          # JWT: crear/verificar token, hashear password
│
├── routers/                 # Endpoints agrupados por módulo
│   ├── auth.py              # Registro y login
│   ├── usuarios.py          # Perfil y gestión de usuarios
│   ├── estadios.py          # Estadios y sectores
│   ├── equipos.py           # Equipos participantes
│   ├── eventos.py           # Eventos (partidos)
│   ├── ventas.py            # Compra de entradas
│   ├── entradas.py          # Consulta de entradas
│   ├── transferencias.py    # Transferencia entre usuarios
│   ├── qr.py                # Generación de QR dinámico
│   ├── validaciones.py      # Validación de acceso en puerta
│   ├── dispositivos.py      # Dispositivos de escaneo autorizados
│   └── reportes.py          # Estadísticas y rankings
│
├── schemas/                 # Modelos Pydantic (request/response)
├── services/                # Lógica de negocio
├── middleware/
│   └── auth_middleware.py   # Dependencias JWT: get_current_user, require_admin
│
├── sql/
│   └── schema.sql           # Schema completo de MySQL
│
└── frontend/                # Interfaz de usuario — React + JavaScript
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Python 3.11+
- MySQL 8.0+
- pip

### 1. Clonar el repositorio

```bash
git clone https://github.com/[usuario]/ticketing-mundial-2026.git
cd ticketing-mundial-2026
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ticketing_db
JWT_SECRET_KEY=tu_clave_secreta
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

### 4. Crear la base de datos

```bash
mysql -u root -p < sql/schema.sql
```

### 5. Levantar el servidor

```bash
uvicorn main:app --reload
```

La API queda disponible en `http://localhost:8000`  
La documentación interactiva (Swagger) en `http://localhost:8000/docs`

---

## 🔑 Roles y Permisos

El sistema implementa control de acceso basado en roles (RBAC):

| Rol | Descripción | Permisos principales |
|-----|-------------|---------------------|
| `ADMIN` | Administrador por País Sede | Gestionar estadios, eventos, usuarios y reportes |
| `FUNCIONARIO` | Validador en puerta | Escanear y validar entradas con dispositivo autorizado |
| `USUARIO_FINAL` | Consumidor | Comprar, transferir y visualizar entradas |

---

## 📡 Endpoints Principales

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de nuevo usuario |
| POST | `/api/auth/login` | Login y obtención de JWT |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios/me` | Perfil del usuario autenticado |
| PUT | `/api/usuarios/me` | Actualizar datos personales |

### Eventos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/eventos` | Listar eventos disponibles |
| POST | `/api/eventos` | Crear evento *(Admin)* |
| GET | `/api/eventos/{id}` | Detalle de un evento |

### Ventas y Entradas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ventas` | Comprar entradas (máx. 5 por transacción) |
| GET | `/api/ventas/mis-ventas` | Historial de compras |
| GET | `/api/entradas/mis-entradas` | Entradas en posesión actual |

### Transferencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/transferencias` | Iniciar transferencia a otro usuario |
| PATCH | `/api/transferencias/{id}/aceptar` | Aceptar transferencia recibida |
| PATCH | `/api/transferencias/{id}/rechazar` | Rechazar transferencia recibida |
| GET | `/api/entradas/{id}/historial` | Cadena de custodia completa |

### Validación
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/entradas/{id}/qr` | Obtener QR activo (se regenera cada 30s) |
| POST | `/api/validaciones` | Escanear y validar entrada *(Funcionario)* |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/eventos-mas-vendidos` | Ranking de eventos por entradas vendidas |
| GET | `/api/reportes/mayores-compradores` | Ranking de usuarios compradores |
| GET | `/api/reportes/disponibilidad/{eventoId}` | Disponibilidad por sector en tiempo real |

---

## 🗄️ Modelo de Datos

El schema implementa las siguientes entidades principales:

`Usuario` · `Admin` · `Funcionario` · `UsuarioFinal` · `UsuarioTelefono` · `Estadio` · `Sector` · `Equipo` · `Evento` · `EventoSector` · `Estado` · `ComisionHistorica` · `Venta` · `Entrada` · `Transferencia` · `Qr` · `Dispositivo` · `Validacion` · `FuncionarioSectorEvento`

El modelo completo (MER, Modelo Lógico y scripts SQL) se encuentra documentado en el informe del trabajo.

---

## 🔒 Lógica de Negocio Clave

- **Máximo 5 entradas** por transacción de compra
- **Máximo 3 transferencias** por entrada antes de su validación
- **QR dinámico** que se regenera cada 30 segundos mientras la app está activa
- **No superposición** de eventos en el mismo estadio a la misma hora
- **Tasa de comisión variable** — cada venta guarda snapshot de la tasa vigente
- **Validación irreversible** — una entrada consumida no puede reactivarse
- **Dispositivos autorizados** — solo dispositivos vinculados a un funcionario pueden validar

---

## 📄 Documentación adicional

La documentación completa del proyecto incluye:

- Evolución del MER 
- Modelo Lógico
- Scripts de creación de base de datos
- Diagrama de componentes
- Justificación de decisiones de diseño


---

## 📅 Fechas de Entrega

| Entregable | Fecha |
|------------|-------|
| MER | 18/05/2026 |
| Informe | 22/06/2026 |
| Ejecutable | 24/06/2026 |
| Defensas | 29/06 y 01/07/2026 |