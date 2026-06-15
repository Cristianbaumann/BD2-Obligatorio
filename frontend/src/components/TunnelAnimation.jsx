import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const RECTS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  inset: `${i * 5}%`,
  delay: i * 0.04,
}))

export default function TunnelAnimation({ onComplete }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { rol } = useAuthStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      } else {
        const from = location.state?.from?.pathname
        if (from) navigate(from, { replace: true })
        else if (rol === 'ADMIN') navigate('/admin/dashboard')
        else if (rol === 'FUNCIONARIO') navigate('/funcionario/dashboard')
        else navigate('/dashboard')
      }
    }, 2600)
    return () => clearTimeout(timer)
  }, [navigate, rol, onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A12',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '800px',
      }}
    >
      {RECTS.map((rect) => (
        <motion.div
          key={rect.id}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 0.1, opacity: 0 }}
          transition={{
            duration: 2.2,
            delay: rect.delay,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            position: 'absolute',
            inset: rect.inset,
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '4px',
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 8, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, ease: 'easeIn' }}
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 40px 20px rgba(34,197,94,0.4)',
        }}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1] }}
        style={{
          position: 'absolute',
          bottom: '15%',
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '24px',
          letterSpacing: '8px',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Bienvenido al estadio
      </motion.p>
    </motion.div>
  )
}
