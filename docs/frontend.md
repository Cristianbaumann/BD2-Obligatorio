# Frontend — Arquitectura y Funcionamiento

## Stack

- **React 18** — biblioteca de UI basada en componentes
- **Vite** — build tool y dev server (reemplaza a CRA)
- **React Router DOM v6** — navegación SPA
- **Axios** — cliente HTTP
- **Zustand** — gestión de estado global
- **Framer Motion** — animaciones
- **Lucide React** — iconos SVG
- **react-hot-toast** — notificaciones tipo toast

---

## Punto de entrada

### `src/main.jsx`
Monta `<App />` en el DOM. Nada especial.

### `src/App.jsx`
Define todo el sistema de rutas. Tres conceptos clave:

**`ProtectedRoute`**: componente wrapper que verifica autenticación y rol antes de renderizar una página.
```jsx
function ProtectedRoute({ children, allowedRoles }) {
  const { rol } = useAuthStore()
  
  if (!useAuthStore.getState().isAuthenticated()) {
    return <Navigate to="/login" />
  }
  if (allowedRoles && !allowedRoles.includes(rol)) {
    // redirige al dashboard correcto según el rol real
    if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" />
    ...
  }
  return children
}
```

`isAuthenticated()` decodifica el JWT almacenado y verifica que `exp * 1000 > Date.now()`. Si el token expiró, devuelve `false` aunque exista en el storage.

**`RootRedirect`**: la ruta `/` decide a dónde ir según el rol. ADMINs van al dashboard admin, FUNCIONARIOs al dashboard funcionario, resto ve el Home.

**`SmartEventosRoute`**: `/eventos` carga la vista correcta según el rol (el admin ve su panel de eventos, no la vista de compra).

---

## Estado global: `src/store/authStore.js`

Usa **Zustand** con persistencia en `sessionStorage`.

**¿Qué es Zustand?** Una biblioteca de estado global minimalista para React. Similar a Redux pero sin boilerplate. Crea un store con estado y funciones que cualquier componente puede leer o llamar.

**¿Por qué `sessionStorage` y no `localStorage`?** `sessionStorage` se borra cuando el usuario cierra la pestaña. `localStorage` persiste entre sesiones. Se usa `sessionStorage` para que al cerrar el navegador el usuario quede deslogueado.

**Estado almacenado**:
```js
{
  token: "eyJ...",                    // JWT de Auth0
  user: { mail, nombre, rol, ... },   // datos del usuario
  rol: "USUARIO_FINAL",               // copia del rol para acceso rápido
  estado_verificacion: "VERIFICADO"   // para mostrar/ocultar la alerta de verificación
}
```

**Funciones**:
- `login(token, userData)`: decodifica el JWT para extraer el rol (del claim personalizado `https://mundial-auth/rol`), almacena todo.
- `logout()`: limpia todo el estado.
- `setVerificado()`: actualiza solo el estado_verificacion a 'VERIFICADO' sin refrescar el token.
- `isAuthenticated()`: decodifica el token, verifica `exp`.

**`decodeJWT(token)`**:
```js
function decodeJWT(token) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}
```
Los JWTs usan base64 url-safe (con `-` y `_` en lugar de `+` y `/`). `atob()` decodifica base64 estándar, por eso se reemplazan antes.

---

## HTTP Client: `src/services/api.js`

Instancia de Axios con dos interceptores:

**Request interceptor**: agrega el token JWT al header de cada request:
```js
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

`useAuthStore.getState()` obtiene el estado actual sin suscribirse a cambios (acceso directo al store).

**Response interceptor**: maneja errores 401 (no autorizado):
```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

La condición `!url.includes('/auth/login')` es fundamental: cuando el login falla (credenciales incorrectas), el backend devuelve 401. Sin esta condición, el interceptor capturaría ese 401 y haría redirect a /login antes de que el componente de login pudiera mostrar el toast de error. Con la condición, el 401 del endpoint de login se deja pasar al `.catch()` del componente.

---

## Rutas y páginas

### Rutas públicas
- `/` — Home (o redirect si logueado)
- `/login` — Login (usa `AuthPage` en modo login)
- `/register` — Registro (usa `AuthPage` en modo register)
- `/eventos` — Lista de eventos (vista de compra para usuarios, redirect para admins)

### Rutas de USUARIO_FINAL
- `/comprar/:eventoId` — Seleccionar sector y comprar
- `/mis-entradas` — Ver entradas propias con QR
- `/transferir` — Transferir entrada a otro usuario
- `/perfil` — Ver/editar perfil
- `/carrito` — Ver carrito y pagar

### Rutas de FUNCIONARIO
- `/funcionario/dashboard` — Panel de funcionario
- `/funcionario/scanner` — Escáner de QR

### Rutas de ADMIN
- `/admin/dashboard` — Panel principal con reportes
- `/admin/eventos` — Gestión de eventos
- `/admin/estadios` — Gestión de estadios y sectores
- `/admin/funcionarios` — Gestión de funcionarios
- `/admin/configuracion` — Configurar comisión, equipos
- `/admin/dispositivos` — Gestión de dispositivos
- `/admin/historial` — Historial de transferencias

---

## Protección de rutas en el frontend

La protección de rutas en el frontend es **solo UX** — no es seguridad real. Un usuario podría bypassear la protección del frontend modificando el estado del store o la URL directamente.

La seguridad real está en el **backend**: cada endpoint verifica el JWT y el rol. Si alguien accede a una ruta admin en el frontend sin ser admin, cualquier llamada a la API devolverá 403.

---

## Autenticación y navegación por roles

El `Navbar` usa el store para mostrar los links correctos según el rol. Los links se definen en `src/constants/navLinks.js` separados por rol.

El Navbar también tiene dos funcionalidades especiales:
1. **Dot de verificación**: si `estado_verificacion === 'PENDIENTE'`, muestra un punto rojo en el link de Perfil.
2. **Dot de transferencias pendientes**: para USUARIO_FINAL, hace `GET /transferencias/mis-transferencias` y si hay transferencias en estado PENDIENTE donde el usuario es el destino, muestra un punto en "Mis Entradas".

---

## AuthPage — Login y Registro en un componente

`AuthPage.jsx` implementa tanto el login como el registro en un solo componente con una animación de panel deslizante. El panel de imagen se desliza de izquierda a derecha para revelar el formulario contrario.

**Estados de animación**:
- `imageControls`: controla la posición X del panel de imagen
- `loginControls`: controla la opacidad del formulario de login
- `registerControls`: controla la opacidad del formulario de registro

La animación usa `framer-motion`'s `useAnimation()` para secuenciar:
1. Fade out del formulario actual
2. Slide del panel de imagen
3. Fade in del nuevo formulario

---

## CountryPicker — Selector de código de país

`CountryPicker` es un componente inline dentro de `AuthPage.jsx`. Muestra el código de discado seleccionado como botón. Al hacer clic, abre un dropdown con:
- Input de búsqueda que filtra por nombre de país o código
- Lista scrolleable de países
- Al seleccionar: cierra el dropdown y llama `onChange(code)`

El dropdown se cierra al hacer clic fuera usando un event listener en `document`:
```js
useEffect(() => {
  const handler = (e) => {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false)
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [])
```

---

## Scanner de QR — `src/pages/funcionario/Scanner.jsx`

Usa `html5-qrcode` para acceder a la cámara del dispositivo.

**Flujo**:
1. Carga `GET /dispositivos/mis-dispositivos` → lista los dispositivos del funcionario
2. Si hay solo uno, lo selecciona automáticamente
3. Si hay varios, muestra un select
4. Una vez seleccionado el dispositivo, inicia el escáner de cámara con `scanner.start()`
5. Cuando se decodifica un QR: llama `POST /validaciones/` con el hash y el dispositivo
6. Muestra overlay verde (VÁLIDA) o rojo (INVÁLIDA) por 2.5 segundos
7. `processingRef` previene procesar múltiples scans simultáneos

**Modo manual**: formulario debajo del visor donde se escribe el hash a mano. Útil cuando el QR no puede escanearse (pantalla rota, mala iluminación).

---

## MisEntradas — Lógica de badges

Cada entrada tiene un estado visual:

```js
const cancelado = !!entrada.evento?.cancelado
const isActiva = !entrada.consumido && !cancelado

const badgeStyle = cancelado
  ? { label: 'BLOQUEADA', color: naranja }
  : entrada.consumido
    ? { label: 'CONSUMIDA', color: rojo }
    : { label: 'ACTIVA', color: verde }
```

- **ACTIVA**: entrada válida, puede mostrar QR y transferirse
- **CONSUMIDA**: ya fue escaneada en el estadio
- **BLOQUEADA**: el evento fue cancelado (no se puede usar, pero se recibe el reembolso)

Los botones de QR y Transferir solo aparecen cuando `isActiva === true`.
