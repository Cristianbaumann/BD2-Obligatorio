# Frontend — React + Vite

## Requisitos

- Node.js 18+
- npm 9+

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar servidor de desarrollo

```bash
npm run dev
```

El servidor corre en: `http://localhost:5173`

### 3. Build para producción

```bash
npm run build
```

Genera la carpeta `dist/` con los archivos estáticos.

### 4. Preview del build

```bash
npm run preview
```

## Variables de entorno (opcional)

Crear `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:8000
```

Usar en el código:

```js
const API_URL = import.meta.env.VITE_API_URL
```

> Vite solo expone variables con prefijo `VITE_`.

## Estructura

```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx       ← entry point
    ├── App.jsx        ← componente raíz
    ├── App.css
    └── index.css
```
