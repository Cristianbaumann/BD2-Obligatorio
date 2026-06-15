import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, ArrowLeft, Trophy, LogIn } from 'lucide-react'
import useAuthStore from '../store/authStore'

function NavLink({ to, label }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      style={{
        color: active ? '#C9A227' : 'rgba(255,255,255,0.55)',
        textDecoration: 'none',
        fontSize: '14px',
        letterSpacing: '0.4px',
        transition: 'color 0.15s',
        borderBottom: active ? '1.5px solid #C9A227' : '1.5px solid transparent',
        paddingBottom: '2px',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#C9A227' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
    >
      {label}
    </Link>
  )
}

export default function Layout({
  children,
  brand = 'MUNDIAL 2026',
  links = [],
  backTo = null,
  backLabel = 'Volver',
  rightSlot = null,
}) {
  const { logout, user, token } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh' }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(14, 26, 46, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(201,162,39,0.18)',
      }}>
        <div style={{ minWidth: '160px' }}>
          {backTo ? (
            <Link to={backTo} style={{ color: '#C9A227', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <ArrowLeft size={16} /> {backLabel}
            </Link>
          ) : (
            <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} />
              {brand}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} label={label} />
          ))}
        </div>

        <div style={{ minWidth: '160px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {user?.nombre && (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nombre}
            </span>
          )}
          {rightSlot}
          {token ? (
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 10px', borderRadius: '6px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9A227'; e.currentTarget.style.background = 'rgba(201,162,39,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none' }}
            >
              <LogOut size={15} /> Salir
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{ background: '#C9A227', border: 'none', color: '#0A0A12', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'Bebas Neue, cursive', letterSpacing: '1.5px', padding: '7px 16px', borderRadius: '6px', transition: 'background 0.14s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E4BC3A' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A227' }}
            >
              <LogIn size={14} /> Ingresar
            </button>
          )}
        </div>
      </nav>

      {children}
    </div>
  )
}
