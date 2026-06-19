import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Smartphone, KeyRound } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../services/api'

const STATES = { SCANNING: 'scanning', VALID: 'valid', INVALID: 'invalid' }

export default function Scanner() {
  const [state, setState] = useState(STATES.SCANNING)
  const [result, setResult] = useState(null)
  const [dispositivos, setDispositivos] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [manualHash, setManualHash] = useState('')
  const [submittingManual, setSubmittingManual] = useState(false)
  const instanceRef = useRef(null)
  const processingRef = useRef(false)

  async function handleManualSubmit(e) {
    e.preventDefault()
    const hash = manualHash.trim()
    if (!hash || !selectedDevice) return
    setSubmittingManual(true)
    try {
      const res = await api.post('/validaciones/', { codigo_hash: hash, dispositivo_id: selectedDevice })
      setResult({ ...res.data, hash })
      setState(STATES.VALID)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Entrada inválida'
      setResult({ error: detail, hash })
      setState(STATES.INVALID)
    } finally {
      setSubmittingManual(false)
      setManualHash('')
      setTimeout(() => { setState(STATES.SCANNING); setResult(null) }, 2500)
    }
  }

  useEffect(() => {
    api.get('/dispositivos/mis-dispositivos')
      .then(r => {
        setDispositivos(r.data)
        if (r.data.length === 1) setSelectedDevice(r.data[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingDevices(false))
  }, [])

  useEffect(() => {
    if (!selectedDevice) return

    const scanner = new Html5Qrcode('qr-reader')
    instanceRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        if (processingRef.current) return
        processingRef.current = true

        try {
          const res = await api.post('/validaciones/', {
            codigo_hash: decodedText,
            dispositivo_id: selectedDevice,
          })
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
  }, [selectedDevice])

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

        {loadingDevices ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : dispositivos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Smartphone size={48} color="rgba(255,255,255,0.15)" />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: 0 }}>
              No tenés dispositivos asignados
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
              Contactá al administrador para que te asigne un dispositivo autorizado.
            </p>
          </div>
        ) : (
          <>
            {dispositivos.length > 1 && (
              <div style={{ width: '100%', maxWidth: '420px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Dispositivo
                </label>
                <select
                  value={selectedDevice || ''}
                  onChange={e => setSelectedDevice(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,162,39,0.3)',
                    borderRadius: '8px', color: '#fff', fontSize: '13px',
                    fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                  }}
                >
                  <option value="" disabled>Seleccioná un dispositivo</option>
                  {dispositivos.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#0E1A2E' }}>
                      {d.id.slice(0, 8).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDevice && (
              <>
                <div
                  id="qr-reader"
                  style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(201,162,39,0.3)', boxShadow: '0 0 40px rgba(201,162,39,0.1)' }}
                />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', letterSpacing: '1px' }}>
                  Apuntá la cámara al código QR de la entrada
                </p>
                <div style={{
                  background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)',
                  borderRadius: '8px', padding: '6px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <Smartphone size={13} color="#C9A227" />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#C9A227', letterSpacing: '1px' }}>
                    {selectedDevice.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Manual hash input */}
                <form onSubmit={handleManualSubmit} style={{ width: '100%', maxWidth: '420px', marginTop: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <KeyRound size={11} /> Código manual
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={manualHash}
                      onChange={e => setManualHash(e.target.value)}
                      placeholder="Pegar hash del QR..."
                      style={{
                        flex: 1, padding: '9px 12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)',
                        borderRadius: '8px', color: '#fff', fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!manualHash.trim() || submittingManual}
                      style={{
                        padding: '9px 16px',
                        background: manualHash.trim() ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(201,162,39,0.3)',
                        borderRadius: '8px', color: '#C9A227', fontSize: '12px', fontWeight: 600,
                        cursor: manualHash.trim() && !submittingManual ? 'pointer' : 'not-allowed',
                        transition: 'background 0.15s',
                      }}
                    >
                      {submittingManual ? '...' : 'Validar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
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
