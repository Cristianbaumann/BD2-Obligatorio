import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Eye, EyeOff, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import TunnelAnimation from '../components/TunnelAnimation'

const FIELD_LABELS = {
  email: 'Email', password: 'Contraseña',
  nombre: 'Nombre', apellido: 'Apellido',
  doc_pais: 'País del documento', doc_tipo: 'Tipo de documento', doc_numero: 'Número de documento',
  dir_pais: 'País', dir_localidad: 'Localidad', dir_calle: 'Calle', dir_numero: 'Número de calle',
}

function extractDetail(err, fallback = 'Error') {
  const d = err?.response?.data?.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    const missing = d
      .filter(x => x.msg?.toLowerCase().includes('required'))
      .map(x => FIELD_LABELS[x.loc?.at(-1)] ?? null)
      .filter(Boolean)
    if (missing.length) return `Completá los campos: ${missing.join(', ')}`
    return d.map(x => FIELD_LABELS[x.loc?.at(-1)] ? `${FIELD_LABELS[x.loc.at(-1)]}: ${x.msg}` : x.msg).join('; ')
  }
  return fallback
}

const SLIDES = [
  '/assets/mundial/img1.jpg',
  '/assets/mundial/img2.jpg',
  '/assets/mundial/img3.jpg',
  '/assets/mundial/img4.jpg',
  '/assets/mundial/img5.jpg',
]

// ─── SlidingPanel ─────────────────────────────────────────────────────────────
// The image panel that slides left↔right to reveal/cover forms.
// Contains the CTA to switch modes.
function SlidingPanel({ mode, onSwitch, disabled }) {
  const [current, setCurrent] = useState(0)
  const isLogin = mode === 'login'

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
      {/* Slideshow images */}
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={SLIDES[current]}
          alt="World Cup"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.72, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          draggable={false}
        />
      </AnimatePresence>

      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,18,0.55)' }} />

      {/* Panel content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 40px', textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Bebas Neue, cursive', color: '#C9A227', fontSize: '12px', letterSpacing: '7px', marginBottom: '4px' }}>
          FIFA WORLD CUP
        </p>
        <p style={{ fontFamily: 'Bebas Neue, cursive', color: '#fff', fontSize: '15px', letterSpacing: '6px', marginBottom: '52px' }}>
          2026
        </p>

        <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '44px', color: '#fff', letterSpacing: '2px', lineHeight: 1, marginBottom: '14px' }}>
          {isLogin ? '¿Primera vez?' : '¿Ya tenés cuenta?'}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.75, marginBottom: '40px', maxWidth: '210px' }}>
          {isLogin
            ? 'Creá tu cuenta y viví la experiencia única del Mundial de Fútbol'
            : 'Iniciá sesión para ver partidos, estadios y comprar tus entradas'}
        </p>

        <button
          onClick={onSwitch}
          disabled={disabled}
          style={{
            padding: '13px 44px', borderRadius: '9999px',
            background: 'transparent', border: '2px solid rgba(201,162,39,0.75)',
            color: '#C9A227', fontFamily: 'Bebas Neue, cursive',
            fontSize: '15px', letterSpacing: '3px',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(201,162,39,0.12)'; e.currentTarget.style.borderColor = '#C9A227' } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,162,39,0.75)' }}
        >
          {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </button>
      </div>

      {/* Slide dots */}
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            height: '4px', width: i === current ? '24px' : '6px', borderRadius: '9999px',
            border: 'none', cursor: 'pointer', padding: 0,
            background: i === current ? '#C9A227' : 'rgba(255,255,255,0.2)',
            transition: 'width 0.3s, background 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── AuthInput ────────────────────────────────────────────────────────────────
function AuthInput({ label, type = 'text', placeholder, value, onChange, autoComplete }) {
  const [mouseX, setMouseX] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div
        style={{ position: 'relative' }}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setMouseX(e.clientX - r.left) }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <input
          type={type === 'password' ? (showPwd ? 'text' : 'password') : type}
          value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: '48px', boxSizing: 'border-box',
            padding: `0 ${type === 'password' ? '2.75rem' : '1rem'} 0 1rem`,
            borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? '#C9A227' : 'rgba(201,162,39,0.18)'}`,
            color: '#fff', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
          }}
        />
        {hovering && !focused && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            borderRadius: '12px 12px 0 0', overflow: 'hidden', pointerEvents: 'none',
            background: `radial-gradient(60px circle at ${mouseX}px 0, rgba(201,162,39,0.9) 0%, transparent 70%)`,
          }} />
        )}
        {type === 'password' && (
          <button type="button" tabIndex={-1} onClick={() => setShowPwd(s => !s)} style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
          }}>
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── GoldButton ───────────────────────────────────────────────────────────────
function GoldButton({ children }) {
  return (
    <button type="submit" style={{
      position: 'relative', width: '100%', height: '48px', borderRadius: '12px',
      overflow: 'hidden', background: 'linear-gradient(135deg, #B8901F 0%, #E8C84A 50%, #B8901F 100%)',
      border: 'none', cursor: 'pointer',
    }} className="group">
      <span style={{ fontFamily: 'Bebas Neue, cursive', color: '#0A0A12', fontSize: '18px', letterSpacing: '3px', position: 'relative', zIndex: 1 }}>
        {children}
      </span>
      <div
        style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}
        className="[transform:skew(-13deg)_translateX(-100%)] group-hover:duration-700 group-hover:[transform:skew(-13deg)_translateX(100%)]"
      >
        <div style={{ width: '2rem', height: '100%', background: 'rgba(255,255,255,0.22)' }} />
      </div>
    </button>
  )
}

// ─── LoginForm ────────────────────────────────────────────────────────────────
function LoginForm({ form, setField, onSubmit }) {
  return (
    <div style={{ width: '100%', maxWidth: '360px' }}>
      <div style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
        background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.22)',
        color: '#C9A227', fontSize: '10px', letterSpacing: '3px',
        textTransform: 'uppercase', fontWeight: 500, marginBottom: '20px',
      }}>
        FIFA World Cup 2026
      </div>
      <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '58px', lineHeight: 1, color: '#fff', letterSpacing: '2px', marginBottom: '10px' }}>
        Bienvenido
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: 1.65, marginBottom: '36px' }}>
        Ingresá con tu cuenta para continuar
      </p>
      <div style={{ height: '1px', width: '48px', marginBottom: '32px', background: 'linear-gradient(to right, #C9A227, transparent)' }} />
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AuthInput label="Email" type="email" placeholder="tu@email.com" autoComplete="email" value={form.email} onChange={setField('email')} />
          <AuthInput label="Contraseña" type="password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={setField('password')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="#" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
          </div>
        </div>
        <div style={{ marginTop: '32px' }}>
          <GoldButton>Iniciar Sesión</GoldButton>
        </div>
      </form>
    </div>
  )
}

// ─── AuthSelect ───────────────────────────────────────────────────────────────
function AuthSelect({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: '48px', boxSizing: 'border-box',
          padding: '0 1rem', borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? '#C9A227' : 'rgba(201,162,39,0.18)'}`,
          color: '#fff', fontSize: '14px', outline: 'none',
          transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o} value={o} style={{ background: '#0A0A12' }}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────
function RegisterForm({ form, setField, onSubmit, setTelefono, addTelefono, removeTelefono }) {
  const sectionLabel = (text) => (
    <p style={{ fontSize: '9px', color: 'rgba(201,162,39,0.5)', letterSpacing: '3px', textTransform: 'uppercase', margin: '4px 0 0' }}>{text}</p>
  )

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
        background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.22)',
        color: '#C9A227', fontSize: '10px', letterSpacing: '3px',
        textTransform: 'uppercase', fontWeight: 500, marginBottom: '16px',
      }}>
        Nueva Cuenta
      </div>
      <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', lineHeight: 1, color: '#fff', letterSpacing: '2px', marginBottom: '8px' }}>
        Crear Cuenta
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: 1.65, marginBottom: '20px' }}>
        Registrate para comprar tus entradas
      </p>
      <div style={{ height: '1px', width: '48px', marginBottom: '20px', background: 'linear-gradient(to right, #C9A227, transparent)' }} />
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {sectionLabel('Datos personales')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AuthInput label="Nombre" placeholder="Lionel" value={form.nombre} onChange={setField('nombre')} />
            <AuthInput label="Apellido" placeholder="Messi" value={form.apellido} onChange={setField('apellido')} />
          </div>

          {sectionLabel('Documento')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AuthSelect label="Tipo" value={form.doc_tipo} onChange={setField('doc_tipo')} options={['CI', 'Pasaporte', 'DNI', 'Otro']} />
            <AuthInput label="País emisor" placeholder="Argentina" value={form.doc_pais} onChange={setField('doc_pais')} />
          </div>
          <AuthInput label="Número de documento" placeholder="12345678" value={form.doc_numero} onChange={setField('doc_numero')} />

          {sectionLabel('Dirección')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AuthInput label="País" placeholder="Argentina" value={form.dir_pais} onChange={setField('dir_pais')} />
            <AuthInput label="Localidad" placeholder="Buenos Aires" value={form.dir_localidad} onChange={setField('dir_localidad')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <AuthInput label="Calle" placeholder="Av. Corrientes" value={form.dir_calle} onChange={setField('dir_calle')} />
            <AuthInput label="Número" placeholder="1234" value={form.dir_numero} onChange={setField('dir_numero')} />
          </div>

          {sectionLabel('Teléfonos (opcional)')}
          {form.telefonos.map((tel, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <AuthInput
                  label={idx === 0 ? 'Teléfono' : undefined}
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={tel}
                  onChange={e => setTelefono(idx, e.target.value)}
                />
              </div>
              {form.telefonos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTelefono(idx)}
                  style={{
                    marginTop: idx === 0 ? '26px' : '0',
                    flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
                    color: 'rgba(255,80,80,0.7)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {form.telefonos.length < 4 && (
            <button
              type="button"
              onClick={addTelefono}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(201,162,39,0.55)', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', padding: '2px 0',
              }}
            >
              <Plus size={12} /> Agregar teléfono
            </button>
          )}

          {sectionLabel('Cuenta')}
          <AuthInput label="Email" type="email" placeholder="tu@email.com" autoComplete="email" value={form.email} onChange={setField('email')} />
          <AuthInput label="Contraseña" type="password" placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={setField('password')} />
        </div>
        <div style={{ marginTop: '24px' }}>
          <GoldButton>Crear Cuenta</GoldButton>
        </div>
      </form>
    </div>
  )
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────
export default function AuthPage({ initialMode = 'login' }) {
  const { login } = useAuthStore()
  const [mode, setMode] = useState(initialMode)
  const [animating, setAnimating] = useState(false)
  const [showTunnel, setShowTunnel] = useState(false)

  const [loginForm, setLoginForm]       = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    nombre: '', apellido: '',
    email: '', password: '',
    doc_pais: '', doc_tipo: 'CI', doc_numero: '',
    dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '',
    telefonos: [''],
  })

  // Three independent controls:
  //   imageControls  — the sliding image panel (x: 0 = left half, x:'100%' = right half)
  //   loginControls  — login form opacity (always rendered in left slot)
  //   registerControls — register form opacity (always rendered in right slot)
  const imageControls    = useAnimation()
  const loginControls    = useAnimation()
  const registerControls = useAnimation()

  const setL = field => e => setLoginForm(f    => ({ ...f, [field]: e.target.value }))
  const setR = field => e => setRegisterForm(f => ({ ...f, [field]: e.target.value }))

  const setTelefono = (idx, val) => setRegisterForm(f => {
    const t = [...f.telefonos]; t[idx] = val; return { ...f, telefonos: t }
  })
  const addTelefono = () => setRegisterForm(f => ({ ...f, telefonos: [...f.telefonos, ''] }))
  const removeTelefono = (idx) => setRegisterForm(f => ({
    ...f, telefonos: f.telefonos.filter((_, i) => i !== idx)
  }))

  async function switchMode(target) {
    if (animating || target === mode) return
    setAnimating(true)

    const toRegister = target === 'register'

    // Phase 1: fade out current form
    await (toRegister ? loginControls : registerControls).start({
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    })

    // Phase 2: slide image panel to new side
    setMode(target)
    await imageControls.start({
      x: toRegister ? '0%' : '100%',
      transition: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    })

    // Phase 3: fade in new form
    await (toRegister ? registerControls : loginControls).start({
      opacity: 1,
      transition: { duration: 0.22, ease: 'easeOut' },
    })

    setAnimating(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', loginForm)
      const { access_token, ...userData } = res.data
      login(access_token, userData)
      setShowTunnel(true)
    } catch (err) {
      toast.error(extractDetail(err, 'Credenciales incorrectas'))
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    try {
      const payload = { ...registerForm, telefonos: registerForm.telefonos.filter(t => t.trim() !== '') }
      const res = await api.post('/auth/register', payload)
      const { access_token, ...userData } = res.data
      login(access_token, userData)
      setShowTunnel(true)
    } catch (err) {
      toast.error(extractDetail(err, 'Error al registrarse'))
    }
  }

  const formSlot = {
    position: 'absolute', top: 0, bottom: 0, width: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: mode === 'register' ? '0 32px' : '0 56px',
    overflowY: 'auto',
    zIndex: 5,
  }

  return (
    <>
      <AnimatePresence>{showTunnel && <TunnelAnimation />}</AnimatePresence>

      <div style={{ height: '100vh', width: '100%', background: '#0A0A12', position: 'relative', overflow: 'hidden' }}>

        {/* ── Login form — always LEFT ──────────────────────────────── */}
        <motion.div
          animate={loginControls}
          initial={{ opacity: initialMode === 'login' ? 1 : 0 }}
          style={{ ...formSlot, left: 0, pointerEvents: mode === 'login' && !animating ? 'auto' : 'none' }}
        >
          <LoginForm form={loginForm} setField={setL} onSubmit={handleLogin} />
        </motion.div>

        {/* ── Register form — always RIGHT ─────────────────────────── */}
        <motion.div
          animate={registerControls}
          initial={{ opacity: initialMode === 'register' ? 1 : 0 }}
          style={{ ...formSlot, left: '50%', pointerEvents: mode === 'register' && !animating ? 'auto' : 'none' }}
        >
          <RegisterForm
            form={registerForm} setField={setR} onSubmit={handleRegister}
            setTelefono={setTelefono} addTelefono={addTelefono} removeTelefono={removeTelefono}
          />
        </motion.div>

        {/* ── Sliding image panel — covers whichever form is inactive ── */}
        {/* x:'0%'  = left half  (register mode — covers login form)     */}
        {/* x:'100%'= right half (login mode   — covers register form)   */}
        <motion.div
          animate={imageControls}
          initial={{ x: initialMode === 'login' ? '100%' : '0%' }}
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
            zIndex: 10,
            boxShadow: '0 0 60px rgba(0,0,0,0.7)',
          }}
        >
          <SlidingPanel
            mode={mode}
            onSwitch={() => switchMode(mode === 'login' ? 'register' : 'login')}
            disabled={animating}
          />
        </motion.div>

      </div>
    </>
  )
}
