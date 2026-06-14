import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import TunnelAnimation from '../components/TunnelAnimation'

// ─── Slides ──────────────────────────────────────────────────────
const SLIDES = [
  '/assets/mundial/img1.jpg',
  '/assets/mundial/img2.jpg',
  '/assets/mundial/img3.jpg',
  '/assets/mundial/img4.jpg',
  '/assets/mundial/img5.jpg',
]

// ─── ImagePanel ───────────────────────────────────────────────────
function ImagePanel({ gradientDir }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={SLIDES[current]}
          alt="World Cup"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.62, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          draggable={false}
        />
      </AnimatePresence>

      <div style={{
        position: 'absolute', inset: 0,
        background: gradientDir === 'left'
          ? 'linear-gradient(to left,  #0A0A12 0%, rgba(10,10,18,0.35) 38%, transparent 100%)'
          : 'linear-gradient(to right, #0A0A12 0%, rgba(10,10,18,0.35) 38%, transparent 100%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,18,0.1)' }} />

      <div style={{
        position: 'absolute', bottom: '4.5rem',
        ...(gradientDir === 'left' ? { right: '2.5rem', textAlign: 'right' } : { left: '2.5rem', textAlign: 'left' }),
      }}>
        <p style={{ fontFamily: 'Bebas Neue, cursive', color: '#C9A227', fontSize: '48px', lineHeight: 1, letterSpacing: '4px' }}>FIFA</p>
        <p style={{ fontFamily: 'Bebas Neue, cursive', color: '#fff', fontSize: '1.5rem', letterSpacing: '5px', lineHeight: 1.2 }}>World Cup 2026</p>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginTop: '10px', lineHeight: 1.6 }}>Viví la experiencia única del fútbol mundial</p>
      </div>

      <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
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

// ─── AuthInput ────────────────────────────────────────────────────
// Top-level → stable ref → no remount on parent re-render
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

// ─── GoldButton ───────────────────────────────────────────────────
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}
        className="[transform:skew(-13deg)_translateX(-100%)] group-hover:duration-700 group-hover:[transform:skew(-13deg)_translateX(100%)]">
        <div style={{ width: '2rem', height: '100%', background: 'rgba(255,255,255,0.22)' }} />
      </div>
    </button>
  )
}

// ─── FormContent ─────────────────────────────────────────────────
// Stable top-level — all state via props
function FormContent({ mode, loginForm, setL, registerForm, setR, onLogin, onRegister, onSwitch }) {
  const isLogin = mode === 'login'
  return (
    <div style={{ width: '100%', maxWidth: '360px' }}>
      <div style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
        background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.22)',
        color: '#C9A227', fontSize: '10px', letterSpacing: '3px',
        textTransform: 'uppercase', fontWeight: 500, marginBottom: '20px',
      }}>
        {isLogin ? 'FIFA World Cup 2026' : 'Nueva cuenta'}
      </div>

      <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '58px', lineHeight: 1, color: '#fff', letterSpacing: '2px', marginBottom: '10px' }}>
        {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: 1.65, marginBottom: '36px' }}>
        {isLogin ? 'Ingresá con tu cuenta para continuar' : 'Registrate para comprar tus entradas'}
      </p>
      <div style={{ height: '1px', width: '48px', marginBottom: '32px', background: 'linear-gradient(to right, #C9A227, transparent)' }} />

      <form onSubmit={isLogin ? onLogin : onRegister}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLogin ? (
            <>
              <AuthInput label="Email" type="email" placeholder="tu@email.com" autoComplete="email" value={loginForm.email} onChange={setL('email')} />
              <AuthInput label="Contraseña" type="password" placeholder="••••••••" autoComplete="current-password" value={loginForm.password} onChange={setL('password')} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a href="#" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <AuthInput label="Nombre" placeholder="Lionel" value={registerForm.nombre} onChange={setR('nombre')} />
                <AuthInput label="Apellido" placeholder="Messi" value={registerForm.apellido} onChange={setR('apellido')} />
              </div>
              <AuthInput label="Documento" placeholder="12345678" value={registerForm.documento} onChange={setR('documento')} />
              <AuthInput label="Email" type="email" placeholder="tu@email.com" autoComplete="email" value={registerForm.email} onChange={setR('email')} />
              <AuthInput label="Contraseña" type="password" placeholder="••••••••" autoComplete="new-password" value={registerForm.password} onChange={setR('password')} />
            </>
          )}
        </div>
        <div style={{ marginTop: '32px' }}>
          <GoldButton>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</GoldButton>
        </div>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button type="button" onClick={onSwitch} style={{ color: '#C9A227', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
            {isLogin ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </form>
    </div>
  )
}

// ─── TIMING CONSTANTS ─────────────────────────────────────────────
const FOLD_EASE    = [0.35, 0, 0.65, 1]   // balanced ease-in-out for fold/unfold
const FOLD_DUR     = 0.38                   // seconds — deliberate, not rushed
const FORM_EXIT_DUR= 0.28

// ─── AuthPage ─────────────────────────────────────────────────────
export default function AuthPage({ initialMode = 'login' }) {
  const { login } = useAuthStore()
  const [mode, setMode] = useState(initialMode)
  const [animating, setAnimating] = useState(false)
  const [showTunnel, setShowTunnel] = useState(false)

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ nombre: '', apellido: '', email: '', password: '', documento: '' })

  // Two permanent slots — LEFT and RIGHT — their CSS never changes.
  // Content inside them changes based on mode.
  // leftControls / rightControls drive the animation for the WHOLE slot.
  const leftControls  = useAnimation()
  const rightControls = useAnimation()

  const setL = field => e => setLoginForm(f  => ({ ...f,  [field]: e.target.value }))
  const setR = field => e => setRegisterForm(f => ({ ...f, [field]: e.target.value }))

  // ── Book-flip ─────────────────────────────────────────────────
  // login  → register: image RIGHT→LEFT, new form enters LEFT→RIGHT (x: -300→0)
  // register → login:  image LEFT→RIGHT, new form enters RIGHT→LEFT (x: +300→0)
  // overflow:hidden on each slot clips the form until it crosses the divider edge,
  // creating the illusion it's sliding out from under the image page.
  async function switchMode(target) {
    if (animating || target === mode) return
    setAnimating(true)

    const toRegister = target === 'register'

    const imgControls  = toRegister ? rightControls : leftControls  // currently has image
    const formControls = toRegister ? leftControls  : rightControls // currently has form

    const foldAngle  = toRegister ? -90 : 90
    // Both exits go LEFT: image sweeps toward form, form retreats toward divider
    const formExitX  = -160
    // Enter from OPPOSITE side to image sweep (clipped by slot overflow:hidden)
    // login→register: image goes left  → form enters right-slot from left  (x:-320→0, slides RIGHT)
    // register→login: image goes right → form enters left-slot  from right (x:+320→0, slides LEFT)
    const formEnterX = toRegister ? -320 : 320

    // ── Phase 1: exit ──────────────────────────────────────────
    await Promise.all([
      imgControls.start({
        rotateY: foldAngle,
        transition: { duration: FOLD_DUR, ease: FOLD_EASE },
      }),
      formControls.start({
        x: formExitX, opacity: 0,
        transition: { duration: FORM_EXIT_DUR, ease: [0.4, 0, 1, 0.6] },
      }),
    ])

    // ── Phase 2: teleport — SET positions while invisible, THEN change mode ──
    // Critical order: set transforms first (both slots at opacity:0) so React
    // re-render sees correct starting positions — avoids the "flash at x:0" bug.
    //
    // imgSlot: image was at rotateY:foldAngle — reposition for form entry
    imgControls.set({ opacity: 0, rotateY: 0, x: formEnterX })
    // formSlot: form was at x:formExitX — reposition for image unfold entry
    formControls.set({ opacity: 0, x: 0, rotateY: -foldAngle })

    // Now swap content — slots are opacity:0 so the content swap is invisible
    setMode(target)

    // One rAF: let React paint new content before revealing
    await new Promise(r => requestAnimationFrame(r))

    // ── Phase 3: image unfolds on new side (spring, reveal with opacity) ──
    formControls.start({
      rotateY: 0, opacity: 1,
      transition: { type: 'spring', stiffness: 180, damping: 28, mass: 1 },
    })

    // Head-start for image before form slides in
    await new Promise(r => setTimeout(r, 100))

    // ── Phase 4: form slides out from under the page ───────────
    // login→register: x:-320→0  (slides LEFT→RIGHT, opposite to image)
    // register→login: x:+320→0  (slides RIGHT→LEFT, opposite to image)
    await imgControls.start({
      x: 0, opacity: 1,
      transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
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
      toast.error(err.response?.data?.detail || 'Credenciales incorrectas')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    try {
      await api.post('/auth/register', registerForm)
      toast.success('¡Cuenta creada! Iniciá sesión.')
      await switchMode('login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrarse')
    }
  }

  const isLogin = mode === 'login'

  // Slot styles — NEVER change (no position flicker)
  const slotBase = { position: 'absolute', top: 0, bottom: 0, width: '50%', overflow: 'hidden' }

  return (
    <>
      <AnimatePresence>{showTunnel && <TunnelAnimation />}</AnimatePresence>

      <div style={{ height: '100vh', width: '100%', background: '#0A0A12', position: 'relative', overflow: 'hidden' }}>

        {/* ── LEFT slot ─────────────────────────────────────────── */}
        {/* perspective on wrapper, transformOrigin on inner = spine on RIGHT edge */}
        <div style={{ ...slotBase, left: 0, perspective: '1200px', perspectiveOrigin: 'right center' }}>
          <motion.div
            animate={leftControls}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 56px',
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          >
            {isLogin
              ? <FormContent mode={mode} loginForm={loginForm} setL={setL} registerForm={registerForm} setR={setR} onLogin={handleLogin} onRegister={handleRegister} onSwitch={() => switchMode('register')} />
              : <ImagePanel gradientDir="right" />
            }
          </motion.div>
        </div>

        {/* ── Divider (spine of the book) ──────────────────────── */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', zIndex: 10, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(201,162,39,0.22) 25%, rgba(201,162,39,0.22) 75%, transparent 100%)',
        }} />

        {/* ── RIGHT slot ────────────────────────────────────────── */}
        {/* perspective on wrapper, transformOrigin on inner = spine on LEFT edge */}
        <div style={{ ...slotBase, left: '50%', perspective: '1200px', perspectiveOrigin: 'left center' }}>
          <motion.div
            animate={rightControls}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 56px',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          >
            {isLogin
              ? <ImagePanel gradientDir="left" />
              : <FormContent mode={mode} loginForm={loginForm} setL={setL} registerForm={registerForm} setR={setR} onLogin={handleLogin} onRegister={handleRegister} onSwitch={() => switchMode('login')} />
            }
          </motion.div>
        </div>

      </div>
    </>
  )
}
