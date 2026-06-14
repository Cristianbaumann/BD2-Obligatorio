import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import StadiumBackground from '../components/StadiumBackground'
import StadiumField from '../components/StadiumField'
import MessiEyeTracking from '../components/MessiEyeTracking'
import Spotlight from '../components/ui/Spotlight'

export default function Home() {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const fadeLeft = prefersReduced
    ? {}
    : { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.7, ease: 'easeOut' } }

  const fadeRight = prefersReduced
    ? {}
    : { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.7, ease: 'easeOut', delay: 0.2 } }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <StadiumBackground />
      <Spotlight />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 50vw)',
          height: 'min(480px, 50vw)',
          opacity: 0.1,
          pointerEvents: 'none',
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        <StadiumField animate />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <motion.div
          {...fadeLeft}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <MessiEyeTracking style={{ maxWidth: '400px', width: '100%' }} />
        </motion.div>

        <motion.div
          {...fadeRight}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <p style={{
            fontFamily: 'Bebas Neue, cursive',
            fontSize: '14px',
            color: '#C9A227',
            letterSpacing: '6px',
            textTransform: 'uppercase',
          }}>
            FIFA World Cup 2026
          </p>

          <h1 style={{
            fontFamily: 'Bebas Neue, cursive',
            fontSize: 'clamp(64px, 9vw, 120px)',
            color: '#C9A227',
            lineHeight: 0.9,
            textTransform: 'uppercase',
          }}>
            Viví el<br />Mundial
          </h1>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.6,
            maxWidth: '440px',
          }}>
            Conseguí tus entradas y viví la experiencia única del Mundial en los estadios más icónicos.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/eventos')}
              style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '18px',
                letterSpacing: '2px',
                padding: '14px 36px',
                background: '#C9A227',
                color: '#0A0A12',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.04)'
                e.currentTarget.style.boxShadow = '0 0 32px rgba(201,162,39,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Comprar Entradas
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '18px',
                letterSpacing: '2px',
                padding: '14px 36px',
                background: 'transparent',
                color: '#C9A227',
                border: '2px solid #C9A227',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(201,162,39,0.1)'
                e.currentTarget.style.transform = 'scale(1.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Iniciar Sesión
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
