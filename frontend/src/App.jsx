import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

import Eventos from './pages/usuario/Eventos'
import ComprarEntrada from './pages/usuario/ComprarEntrada'
import MisEntradas from './pages/usuario/MisEntradas'
import Transferir from './pages/usuario/Transferir'
import Perfil from './pages/usuario/Perfil'
import Carrito from './pages/usuario/Carrito'

import FuncionarioDashboard from './pages/funcionario/Dashboard'
import Scanner from './pages/funcionario/Scanner'

import AdminDashboard from './pages/admin/Dashboard'
import AdminEventos from './pages/admin/Eventos'
import AdminEstadios from './pages/admin/Estadios'
import AdminFuncionarios from './pages/admin/Funcionarios'
import AdminConfiguracion from './pages/admin/Configuracion'

function ProtectedRoute({ children, allowedRoles }) {
  const { rol } = useAuthStore()
  const location = useLocation()

  if (!useAuthStore.getState().isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(rol)) {
    if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (rol === 'FUNCIONARIO') return <Navigate to="/funcionario/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return children
}

function RootRedirect() {
  const { rol } = useAuthStore()
  if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (rol === 'FUNCIONARIO') return <Navigate to="/funcionario/dashboard" replace />
  return <Home />
}

function SmartEventosRoute() {
  const { rol } = useAuthStore()
  if (rol === 'ADMIN') return <Navigate to="/admin/eventos" replace />
  if (rol === 'FUNCIONARIO') return <Navigate to="/funcionario/dashboard" replace />
  return <Eventos />
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0E1A2E',
            color: '#fff',
            border: '1px solid rgba(201,162,39,0.3)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/eventos" element={<SmartEventosRoute />} />
        <Route path="/comprar/:eventoId" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <ComprarEntrada />
          </ProtectedRoute>
        } />
        <Route path="/mis-entradas" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <MisEntradas />
          </ProtectedRoute>
        } />
        <Route path="/transferir" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <Transferir />
          </ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <Perfil />
          </ProtectedRoute>
        } />
        <Route path="/carrito" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <Carrito />
          </ProtectedRoute>
        } />

        <Route path="/funcionario/dashboard" element={
          <ProtectedRoute allowedRoles={['FUNCIONARIO']}>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="/funcionario/scanner" element={
          <ProtectedRoute allowedRoles={['FUNCIONARIO']}>
            <Scanner />
          </ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/eventos" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminEventos />
          </ProtectedRoute>
        } />
        <Route path="/admin/estadios" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminEstadios />
          </ProtectedRoute>
        } />
        <Route path="/admin/funcionarios" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminFuncionarios />
          </ProtectedRoute>
        } />
        <Route path="/admin/configuracion" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminConfiguracion />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
