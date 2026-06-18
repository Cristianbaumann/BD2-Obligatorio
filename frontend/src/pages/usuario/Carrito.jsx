import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, CreditCard, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { USER_LINKS } from '../../constants/navLinks'

function formatTime(secs) {
  if (secs <= 0) return '00:00'
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function Countdown({ segs }) {
  const urgent = segs <= 120
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Clock size={13} color={urgent ? '#ef4444' : 'rgba(255,255,255,0.4)'} />
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        fontWeight: 700,
        color: urgent ? '#ef4444' : 'rgba(255,255,255,0.5)',
        transition: 'color 0.3s',
      }}>
        {formatTime(segs)}
      </span>
    </div>
  )
}

function PaymentModal({ venta, onClose, onSuccess }) {
  const [form, setForm] = useState({ nombre: '', numero: '', expiry: '', cvv: '' })
  const [loading, setLoading] = useState(false)

  function handleChange(field, val) {
    if (field === 'numero') val = formatCardNumber(val)
    if (field === 'expiry') val = formatExpiry(val)
    if (field === 'cvv') val = val.replace(/\D/g, '').slice(0, 3)
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const valid = form.nombre.trim().length > 2
    && form.numero.replace(/\s/g, '').length === 16
    && form.expiry.length === 5
    && form.cvv.length === 3

  async function handlePagar() {
    if (!valid) return
    setLoading(true)
    try {
      await api.patch(`/ventas/${venta.id}/pagar`)
      toast.success('Pago completado')
      onSuccess()
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al procesar el pago'
      toast.error(detail)
      if (err?.response?.status === 410) onClose()
    } finally {
      setLoading(false)
    }
  }

  const entradas = venta.entradas || []
  const grupos = entradas.reduce((acc, e) => {
    const key = `${e.evento_nombre}|${e.sector_nombre}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        style={{
          background: '#0E1A2E',
          border: '1px solid rgba(201,162,39,0.3)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={18} color="#C9A227" />
            <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C9A227', letterSpacing: '2px' }}>
              Pasarela de Pago
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Order summary */}
        <div style={{
          background: 'rgba(201,162,39,0.05)', border: '1px solid rgba(201,162,39,0.15)',
          borderRadius: '10px', padding: '14px 16px', marginBottom: '20px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {Object.entries(grupos).map(([key, qty]) => {
            const [evento, sector] = key.split('|')
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                  {evento} — {sector} <span style={{ color: 'rgba(255,255,255,0.3)' }}>×{qty}</span>
                </span>
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '6px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#C9A227', fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#C9A227', fontWeight: 700 }}>
              ${venta.precio.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Nombre en la tarjeta', field: 'nombre', placeholder: 'JUAN PEREZ', type: 'text' },
            { label: 'Número de tarjeta', field: 'numero', placeholder: '0000 0000 0000 0000', type: 'text' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                {label}
              </label>
              <input
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: '#fff', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Vencimiento', field: 'expiry', placeholder: 'MM/AA' },
              { label: 'CVV', field: 'cvv', placeholder: '123' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  {label}
                </label>
                <input
                  value={form[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: '#fff', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handlePagar}
          disabled={!valid || loading}
          style={{
            marginTop: '20px', width: '100%', padding: '14px',
            background: (!valid || loading) ? 'rgba(201,162,39,0.25)' : 'linear-gradient(135deg, #B8901F 0%, #E8C84A 50%, #B8901F 100%)',
            border: 'none', borderRadius: '8px',
            color: (!valid || loading) ? 'rgba(255,255,255,0.3)' : '#0A0A12',
            fontFamily: 'Bebas Neue, cursive', fontSize: '18px', letterSpacing: '2px',
            cursor: (!valid || loading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
          Simulación — ningún dato real es procesado
        </p>
      </motion.div>
    </div>
  )
}

export default function Carrito() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [quitando, setQuitando] = useState(null)
  const [pagando, setPagando] = useState(null)
  const [segs, setSegs] = useState({})
  const tickRef = useRef(null)

  async function fetchCarrito() {
    try {
      const r = await api.get('/ventas/carrito')
      setVentas(r.data)
    } catch {
      toast.error('Error al cargar el carrito')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCarrito() }, [])

  // Initialize countdowns when ventas change
  useEffect(() => {
    setSegs(prev => {
      const next = {}
      ventas.forEach(v => {
        next[v.id] = v.id in prev ? prev[v.id] : (v.segundos_restantes ?? 900)
      })
      return next
    })
  }, [ventas])

  // Single global tick
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setSegs(prev => {
        const next = {}
        Object.entries(prev).forEach(([id, s]) => { next[id] = Math.max(0, s - 1) })
        return next
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [])

  async function handleQuitar(ventaId) {
    setQuitando(ventaId)
    try {
      await api.delete(`/ventas/${ventaId}`)
      toast.success('Item eliminado del carrito')
      setVentas(prev => prev.filter(v => v.id !== ventaId))
    } catch {
      toast.error('Error al eliminar del carrito')
    } finally {
      setQuitando(null)
    }
  }

  function handlePagoExitoso() {
    setPagando(null)
    fetchCarrito()
    navigate('/mis-entradas')
  }

  const ventaPagando = ventas.find(v => v.id === pagando)

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShoppingCart size={22} color="#C9A227" />
          <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '38px', color: '#fff', letterSpacing: '2px', margin: 0 }}>
            Carrito
          </h1>
          {ventas.length > 0 && (
            <span style={{
              background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
              borderRadius: '20px', padding: '2px 10px',
              fontSize: '12px', color: '#C9A227', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {ventas.length} reserva{ventas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : ventas.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <ShoppingCart size={40} color="rgba(255,255,255,0.1)" />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px', margin: 0 }}>Tu carrito está vacío</p>
            <button
              onClick={() => navigate('/eventos')}
              style={{
                padding: '10px 28px', borderRadius: '8px',
                background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
                color: '#C9A227', fontFamily: 'Bebas Neue, cursive', fontSize: '15px',
                letterSpacing: '1.5px', cursor: 'pointer',
              }}
            >
              Ver Eventos
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {ventas.map(venta => {
              const segsLeft = segs[venta.id] ?? venta.segundos_restantes ?? 0
              const expired = segsLeft === 0
              const subtotal = venta.entradas.reduce((s, e) => s + e.costo, 0)
              const comision = venta.precio - subtotal

              const grupos = venta.entradas.reduce((acc, e) => {
                const key = `${e.evento_nombre || e.evento_id}|${e.sector_nombre || e.sector_id}`
                acc[key] = (acc[key] || 0) + 1
                return acc
              }, {})

              return (
                <motion.div
                  key={venta.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: expired ? 0.4 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card"
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {/* Header: countdown + quitar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {expired ? (
                      <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Reserva expirada</span>
                    ) : (
                      <div style={{ display: 'flex', align: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginRight: '6px' }}>Expira en</span>
                        <Countdown segs={segsLeft} />
                      </div>
                    )}
                    <button
                      onClick={() => handleQuitar(venta.id)}
                      disabled={quitando === venta.id}
                      style={{
                        background: 'none', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '6px', padding: '5px 10px',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', opacity: quitando === venta.id ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={12} /> Quitar
                    </button>
                  </div>

                  {/* Entradas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(grupos).map(([key, qty]) => {
                      const [evento, sector] = key.split('|')
                      const precio = venta.entradas.find(e =>
                        (e.evento_nombre || e.evento_id) === evento &&
                        (e.sector_nombre || e.sector_id).toString() === sector
                      )?.costo || 0
                      return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#fff', fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.5px' }}>
                              {evento}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                              {sector} × {qty}
                            </p>
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                            ${(precio * qty).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Price breakdown + pay button */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Subtotal</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          ${subtotal.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          Comisión ({(venta.tasa_comision * 100).toFixed(0)}%)
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          ${comision.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#C9A227', fontWeight: 700 }}>Total</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#C9A227', fontWeight: 700 }}>
                          ${venta.precio.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPagando(venta.id)}
                      disabled={expired}
                      style={{
                        padding: '12px 32px', borderRadius: '8px',
                        background: expired ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #B8901F 0%, #E8C84A 50%, #B8901F 100%)',
                        border: 'none',
                        color: expired ? 'rgba(255,255,255,0.3)' : '#0A0A12',
                        fontFamily: 'Bebas Neue, cursive', fontSize: '17px', letterSpacing: '2px',
                        cursor: expired ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <CreditCard size={15} /> Pagar
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {pagando && ventaPagando && (
          <PaymentModal
            venta={ventaPagando}
            onClose={() => setPagando(null)}
            onSuccess={handlePagoExitoso}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
