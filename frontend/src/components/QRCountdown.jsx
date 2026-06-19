import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOTAL_SECONDS = 30

function ringColor(seconds) {
  if (seconds > 20) return '#C9A227'
  if (seconds > 10) return '#f97316'
  return '#ef4444'
}

export default function QRCountdown({ entradaId }) {
  const [qrData, setQrData] = useState(null)
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const [flipping, setFlipping] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchQR = useCallback(async () => {
    try {
      const res = await api.get(`/qr/${entradaId}`)
      setQrData(res.data)
      setSeconds(TOTAL_SECONDS)
    } catch {
      setQrData(null)
    } finally {
      setLoading(false)
    }
  }, [entradaId])

  useEffect(() => {
    fetchQR()
  }, [fetchQR])

  useEffect(() => {
    if (!qrData) return
    if (seconds <= 0) {
      setFlipping(true)
      setTimeout(() => {
        fetchQR().then(() => setFlipping(false))
      }, 600)
      return
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds, qrData, fetchQR])

  const dashOffset = CIRCUMFERENCE * (1 - seconds / TOTAL_SECONDS)
  const color = ringColor(seconds)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!qrData) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)' }}>
        No se pudo cargar el QR
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg
          viewBox="0 0 120 120"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={flipping ? 'flip' : 'normal'}
            initial={{ rotateY: flipping ? -90 : 0 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: '12px',
              background: '#fff',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src={qrData.qr_url}
              alt="QR"
              width={100}
              height={100}
              style={{ display: 'block' }}
            />
          </motion.div>
        </AnimatePresence>

        <div style={{
          position: 'absolute',
          bottom: '-28px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '28px',
          color,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transition: 'color 0.5s',
        }}>
          {seconds}s
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', marginTop: '16px' }}>
        QR se renueva cada 30 segundos
      </p>
    </div>
  )
}
