# Backend — FastAPI + MySQL

## Requisitos

- Python 3.10+
- MySQL 8+

## Setup

### 1. Crear entorno virtual

```bash
python -m venv venv
```

Activar:

- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus datos:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ticketing
JWT_SECRET_KEY=una_clave_secreta_larga
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

### 4. Crear la base de datos

En MySQL:

```sql
CREATE DATABASE ticketing;
```

Luego ejecutar el schema:

```bash
mysql -u root -p ticketing < sql/schema.sql
```

### 5. Levantar el servidor

```bash
uvicorn main:app --reload
```

El servidor corre en: `http://localhost:8000`

Documentación interactiva: `http://localhost:8000/docs`

## Estructura

```
backend/
├── main.py            ← app FastAPI + routers + CORS
├── database.py        ← get_connection(), get_db()
├── core/
│   ├── config.py      ← variables de entorno (Settings)
│   └── security.py    ← JWT y hashing de passwords
├── routers/           ← un archivo por recurso
├── schemas/           ← modelos Pydantic (request/response)
├── services/          ← lógica de negocio
├── middleware/        ← auth middleware
└── sql/
    └── schema.sql     ← DDL de la base de datos
```

## Comandos útiles

```bash
# Ver logs detallados
uvicorn main:app --reload --log-level debug

# Correr en otro puerto
uvicorn main:app --reload --port 8001
```
