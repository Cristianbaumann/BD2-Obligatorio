import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

import UsuarioDashboard from './pages/usuario/Dashboard'
import Eventos from './pages/usuario/Eventos'
import ComprarEntrada from './pages/usuario/ComprarEntrada'
import MisEntradas from './pages/usuario/MisEntradas'
import Transferir from './pages/usuario/Transferir'

import FuncionarioDashboard from './pages/funcionario/Dashboard'
import Scanner from './pages/funcionario/Scanner'

import AdminDashboard from './pages/admin/Dashboard'
import AdminEventos from './pages/admin/Eventos'
import AdminEstadios from './pages/admin/Estadios'
import AdminFuncionarios from './pages/admin/Funcionarios'

function ProtectedRoute({ children, allowedRoles }) {
  const { token, rol } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(rol)) {
    if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (rol === 'FUNCIONARIO') return <Navigate to="/funcionario/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <UsuarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="/eventos" element={
          <ProtectedRoute allowedRoles={['USUARIO_FINAL']}>
            <Eventos />
          </ProtectedRoute>
        } />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
