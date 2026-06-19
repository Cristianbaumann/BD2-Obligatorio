import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, LogOut, LogIn, ArrowLeft, Menu, X, Search, MapPin, Calendar } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useEventosStore from '../store/eventosStore'
import api from '../services/api'

function NavLink({ to, label, onClick, showDot = false }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        color: active ? '#C9A227' : 'rgba(255,255,255,0.55)',
        textDecoration: 'none',
        fontSize: '14px',
        letterSpacing: '0.4px',
        transition: 'color 0.15s',
        borderBottom: active ? '1.5px solid #C9A227' : '1.5px solid transparent',
        paddingBottom: '2px',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#C9A227' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
    >
      {label}
      {showDot && (
        <span style={{ position: 'relative', display: 'inline-flex', width: '11px', height: '11px', flexShrink: 0 }}>
          <span className="animate-ping" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: '#ef4444', opacity: 0.75,
          }} />
          <span style={{
            position: 'relative', width: '11px', height: '11px', borderRadius: '50%',
            background: '#ef4444', display: 'inline-block',
          }} />
        </span>
      )}
    </Link>
  )
}

export default function Navbar({ brand = 'MUNDIAL 2026', links = [], backTo = null, backLabel = 'Volver', rightSlot = null }) {
  const { logout, user, token, rol, estado_verificacion } = useAuthStore()
  const brandTo = rol === 'ADMIN' ? '/admin/dashboard' : rol === 'FUNCIONARIO' ? '/funcionario/dashboard' : '/'
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [searchVal, setSearchVal] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [pendingTransfers, setPendingTransfers] = useState(0)
  const searchWrapRef = useRef(null)
  const eventos = useEventosStore(s => s.eventos)

  useEffect(() => {
    if (rol !== 'USUARIO_FINAL' || !user?.mail) { setPendingTransfers(0); return }
    api.get(`/transferencias/mis-transferencias?mail_usuario=${encodeURIComponent(user.mail)}`)
      .then(r => {
        const all = r.data?.transferencias || []
        setPendingTransfers(all.filter(t => t.estado === 'PENDIENTE' && t.destino_mail === user.mail).length)
      })
      .catch(() => {})
  }, [pathname, rol, user?.mail])

  const searchResults = searchVal.trim()
    ? eventos.filter(e => {
        const lq = searchVal.trim().toLowerCase()
        return (
          e.equipo_local.toLowerCase().includes(lq) ||
          e.equipo_visitante.toLowerCase().includes(lq) ||
          (e.estadio || '').toLowerCase().includes(lq)
        )
      }).slice(0, 6)
    : []

  function handleSearch(e) {
    e.preventDefault()
    if (searchResults.length === 1) {
      handleResultClick(searchResults[0].id)
    }
    setSearchVal('')
  }

  function handleResultClick(eventoId) {
    setSearchVal('')
    navigate(`/comprar/${eventoId}`)
    setMenuOpen(false)
  }

  function handleSearchChange(val) {
    setSearchVal(val)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchVal('')
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: '64px',
    background: 'rgba(10,10,18,0.82)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(201,162,39,0.18)',
  }

  const brandContent = backTo ? (
    <Link
      to={backTo}
      style={{ color: '#C9A227', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
    >
      <ArrowLeft size={16} /> {backLabel}
    </Link>
  ) : (
    <Link
      to={brandTo}
      style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '20px',
        color: '#C9A227',
        letterSpacing: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}
    >
      <Trophy size={18} /> {brand}
    </Link>
  )

  const authSection = token ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {user?.nombre && (
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.nombre}
        </span>
      )}
      <button
        onClick={() => { logout(); setMenuOpen(false) }}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 10px', borderRadius: '6px', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#C9A227'; e.currentTarget.style.background = 'rgba(201,162,39,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none' }}
      >
        <LogOut size={15} /> Salir
      </button>
    </div>
  ) : (
    <button
      onClick={() => { navigate('/login'); setMenuOpen(false) }}
      style={{ background: '#C9A227', border: 'none', color: '#0A0A12', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'Bebas Neue, cursive', letterSpacing: '1.5px', padding: '7px 16px', borderRadius: '6px', transition: 'background 0.14s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#E4BC3A' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#C9A227' }}
    >
      <LogIn size={14} /> Ingresar
    </button>
  )

  return (
    <>
      <nav style={navStyle}>
        {/* LEFT — brand or back */}
        <div style={{ minWidth: '160px' }}>
          {brandContent}
        </div>

        {/* CENTER — links + search (desktop only) */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            {links.map(([label, to]) => (
              <NavLink
                key={to} to={to} label={label}
                showDot={
                  (to === '/perfil' && rol === 'USUARIO_FINAL' && estado_verificacion !== 'VERIFICADO') ||
                  (to === '/mis-entradas' && pendingTransfers > 0)
                }
              />
            ))}
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <div ref={searchWrapRef} style={{ position: 'relative' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${searchFocused ? 'rgba(201,162,39,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '7px', padding: '5px 10px',
                  transition: 'border-color 0.15s',
                  boxShadow: searchFocused ? '0 0 0 3px rgba(201,162,39,0.08)' : 'none',
                }}>
                  <Search size={13} color={searchFocused ? '#C9A227' : 'rgba(255,255,255,0.25)'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
                  <input
                    value={searchVal}
                    onChange={e => handleSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Buscar equipo o estadio…"
                    style={{
                      background: 'none', border: 'none', outline: 'none',
                      color: '#fff', fontSize: '13px', width: '170px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  {searchVal && (
                    <button
                      type="button"
                      onClick={() => setSearchVal('')}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </form>

              {/* Search dropdown */}
              <AnimatePresence>
                {searchVal.trim() && (
                  <motion.div
                    key="search-dropdown"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      minWidth: '320px',
                      background: 'rgba(10,10,20,0.97)',
                      border: '1px solid rgba(201,162,39,0.22)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                      zIndex: 200,
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '16px 18px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                        Sin resultados para &ldquo;{searchVal}&rdquo;
                      </div>
                    ) : (
                      <>
                        {searchResults.map(e => {
                          const fecha = new Date(e.fecha)
                          return (
                            <button
                              key={e.id}
                              onMouseDown={ev => { ev.preventDefault(); handleResultClick(e.id) }}
                              style={{
                                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(201,162,39,0.07)'}
                              onMouseLeave={ev => ev.currentTarget.style.background = 'none'}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontFamily: 'Bebas Neue, cursive', fontSize: '15px', color: '#fff',
                                  margin: 0, letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {e.equipo_local} <span style={{ color: 'rgba(201,162,39,0.6)', fontSize: '12px' }}>vs</span> {e.equipo_visitante}
                                </p>
                                <p style={{
                                  fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                                  margin: '3px 0 0 0', display: 'flex', gap: '10px', alignItems: 'center',
                                }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Calendar size={9} />
                                    {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }).toUpperCase()}
                                  </span>
                                  {e.estadio && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <MapPin size={9} /> {e.estadio}
                                    </span>
                                  )}
                                </p>
                              </div>
                              {e.precio_minimo != null && (
                                <span style={{
                                  fontFamily: 'JetBrains Mono, monospace', fontSize: '12px',
                                  color: '#C9A227', fontWeight: 700, flexShrink: 0,
                                }}>
                                  ${e.precio_minimo.toLocaleString()}
                                </span>
                              )}
                            </button>
                          )
                        })}
                        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: 0, textAlign: 'center', letterSpacing: '0.5px' }}>
                            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} · clic para comprar
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* RIGHT — auth (desktop) or hamburger (mobile) */}
        {isMobile ? (
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ background: 'none', border: '1px solid rgba(201,162,39,0.35)', color: '#C9A227', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px', transition: 'all 0.15s' }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        ) : (
          <div style={{ minWidth: '160px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            {rightSlot}
            {authSection}
          </div>
        )}
      </nav>

      {/* MOBILE SLIDE-DOWN PANEL */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              zIndex: 99,
              background: '#0A0A12',
              borderBottom: '1px solid rgba(201,162,39,0.25)',
              padding: '24px 40px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {/* Mobile search */}
            <div style={{ marginBottom: '20px' }}>
              <form onSubmit={handleSearch}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '10px 14px',
                }}>
                  <Search size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                  <input
                    value={searchVal}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Buscar equipo o estadio…"
                    style={{
                      background: 'none', border: 'none', outline: 'none',
                      color: '#fff', fontSize: '14px', flex: 1,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  {searchVal && (
                    <button type="button" onClick={() => setSearchVal('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </form>
              {/* Mobile search results */}
              {searchVal.trim() && (
                <div style={{
                  marginTop: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(201,162,39,0.15)',
                  borderRadius: '8px', overflow: 'hidden',
                }}>
                  {searchResults.length === 0 ? (
                    <p style={{ padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      Sin resultados
                    </p>
                  ) : searchResults.map(e => {
                    const fecha = new Date(e.fecha)
                    return (
                      <button
                        key={e.id}
                        onMouseDown={ev => { ev.preventDefault(); handleResultClick(e.id) }}
                        onClick={() => handleResultClick(e.id)}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '15px', color: '#fff', margin: 0 }}>
                            {e.equipo_local} <span style={{ color: 'rgba(201,162,39,0.6)', fontSize: '12px' }}>vs</span> {e.equipo_visitante}
                          </p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0' }}>
                            {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }).toUpperCase()} · {e.estadio}
                          </p>
                        </div>
                        {e.precio_minimo != null && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#C9A227', fontWeight: 700, flexShrink: 0 }}>
                            ${e.precio_minimo.toLocaleString()}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
              {links.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: pathname === to ? '#C9A227' : 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '22px',
                    fontFamily: 'Bebas Neue, cursive',
                    letterSpacing: '2px',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {pathname === to && <span style={{ width: '3px', height: '20px', background: '#C9A227', borderRadius: '2px', display: 'inline-block' }} />}
                  {label}
                  {((to === '/perfil' && rol === 'USUARIO_FINAL' && estado_verificacion !== 'VERIFICADO') ||
                    (to === '/mis-entradas' && pendingTransfers > 0)) && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', marginLeft: '2px' }} />
                  )}
                </Link>
              ))}
            </div>

            {/* Auth section */}
            <div>
              {user?.nombre && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  {user.nombre}
                </p>
              )}
              {rightSlot && <div style={{ marginBottom: '12px' }}>{rightSlot}</div>}
              {token ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '10px 20px', borderRadius: '8px', width: '100%' }}
                >
                  <LogOut size={15} /> Salir
                </button>
              ) : (
                <button
                  onClick={() => { navigate('/login'); setMenuOpen(false) }}
                  style={{ background: '#C9A227', border: 'none', color: '#0A0A12', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontFamily: 'Bebas Neue, cursive', letterSpacing: '2px', padding: '12px 20px', borderRadius: '8px', width: '100%', justifyContent: 'center' }}
                >
                  <LogIn size={16} /> Ingresar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
