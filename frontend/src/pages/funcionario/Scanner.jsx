import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../services/api'

const STATES = { SCANNING: 'scanning', VALID: 'valid', INVALID: 'invalid' }

export default function Scanner() {
  const [state, setState] = useState(STATES.SCANNING)
  const [result, setResult] = useState(null)
  const instanceRef = useRef(null)
  const processingRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    instanceRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        if (processingRef.current) return
        processingRef.current = true

        try {
          const res = await api.post('/validaciones/validar', { codigo_hash: decodedText })
          setResult({ ...res.data, hash: decodedText })
          setState(STATES.VALID)
        } catch (err) {
          const detail = err.response?.data?.detail || 'Entrada inválida'
          setResult({ error: detail, hash: decodedText })
          setState(STATES.INVALID)
        }

        setTimeout(() => {
          setState(STATES.SCANNING)
          setResult(null)
          processingRef.current = false
        }, 2500)
      },
      () => {}
    ).catch(() => {})

    return () => { scanner.stop().catch(() => {}) }
  }, [])

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '64px',
        background: 'rgba(14, 26, 46, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(201,162,39,0.18)',
      }}>
        <Link to="/funcionario/dashboard" style={{ color: '#C9A227', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Volver
        </Link>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', letterSpacing: '3px' }}>
          Escanear QR
        </span>
        <div style={{ width: '80px' }} />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', padding: '32px' }}>
        <div
          id="qr-reader"
          style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(201,162,39,0.3)', boxShadow: '0 0 40px rgba(201,162,39,0.1)' }}
        />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', letterSpacing: '1px' }}>
          Apuntá la cámara al código QR de la entrada
        </p>
      </div>

      <AnimatePresence>
        {state === STATES.VALID && (
          <motion.div
            key="valid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(22,163,74,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <CheckCircle size={120} color="#fff" />
            </motion.div>
            <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '56px', color: '#fff', letterSpacing: '6px' }}>VÁLIDA</h2>
            {result?.titular && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '20px' }}>{result.titular}</p>}
            {result?.sector && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>Sector {result.sector} · Asiento {result.asiento}</p>}
          </motion.div>
        )}

        {state === STATES.INVALID && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, -14, 14, -8, 8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ x: { duration: 0.45, ease: 'easeOut' } }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(220,38,38,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <XCircle size={120} color="#fff" />
            </motion.div>
            <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '56px', color: '#fff', letterSpacing: '6px' }}>INVÁLIDA</h2>
            {result?.error && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', textAlign: 'center', maxWidth: '300px' }}>{result.error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
