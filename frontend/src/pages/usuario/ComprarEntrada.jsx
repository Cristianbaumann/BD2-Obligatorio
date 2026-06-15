import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import StadiumBowl from '../../components/admin/StadiumBowl'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

function availColor(disponibles, total) {
  if (disponibles === 0) return '#374151'
  const pct = disponibles / total
  if (pct > 0.5) return '#22c55e'
  if (pct > 0.15) return '#eab308'
  return '#ef4444'
}

export default function ComprarEntrada() {
  const { eventoId } = useParams()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [sectores, setSectores] = useState([])
  const [selecciones, setSelecciones] = useState({})
  const [activeSectorId, setActiveSectorId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingEvento, setLoadingEvento] = useState(true)
  const [tasa, setTasa] = useState(0.05)

  useEffect(() => {
    api.get(`/eventos/${eventoId}`)
      .then(r => setEvento(r.data))
      .catch(() => toast.error('Error al cargar el evento'))
      .finally(() => setLoadingEvento(false))
    api.get(`/eventos/${eventoId}/disponibilidad`)
      .then(r => setSectores(r.data || []))
      .catch(() => {})
    api.get('/ventas/comision')
      .then(r => setTasa(r.data.tasa))
      .catch(() => {})
  }, [eventoId])

  const totalSelected = Object.values(selecciones).reduce((a, b) => a + b, 0)

  function cambiarQty(sectorId, delta, disponibles) {
    setSelecciones(prev => {
      const curr = prev[sectorId] || 0
      const maxSector = Math.min(disponibles, 5 - (totalSelected - curr))
      const next = Math.min(Math.max(0, curr + delta), maxSector)
      return { ...prev, [sectorId]: next }
    })
  }

  function toggleActive(id) {
    setActiveSectorId(prev => prev === id ? null : id)
  }

  async function handleCompra() {
    if (totalSelected === 0) return
    setLoading(true)
    try {
      await api.post('/ventas', {
        entradas: Object.entries(selecciones)
          .filter(([, c]) => c > 0)
          .map(([sid, cantidad]) => ({
            evento_id: eventoId,
            sector_id: Number(sid),
            cantidad,
          })),
      })
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#C9A227', '#ffffff', '#22c55e'] })
      toast.success(`¡${totalSelected} entrada${totalSelected > 1 ? 's' : ''} comprada${totalSelected > 1 ? 's' : ''}!`)
      setTimeout(() => navigate('/mis-entradas'), 2000)
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al procesar la compra')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = Object.entries(selecciones).reduce((sum, [sid, qty]) => {
    const s = sectores.find(x => x.sector_id === Number(sid))
    return sum + (s ? s.costo * qty : 0)
  }, 0)
  const comisionMonto = subtotal * tasa
  const totalPrice = totalSelected > 0 ? subtotal + comisionMonto : null

  const availColors = Object.fromEntries(sectores.map(s => [s.sector_id, availColor(s.disponibles, s.total)]))
  const sectoresForBowl = sectores.map(s => ({ id: s.sector_id, nombre: s.nombre }))

  const selectedLines = Object.entries(selecciones)
    .filter(([, qty]) => qty > 0)
    .map(([sid, qty]) => {
      const s = sectores.find(x => x.sector_id === Number(sid))
      return s ? { ...s, qty } : null
    })
    .filter(Boolean)

  return (
    <Layout links={USER_LINKS} backTo="/eventos" backLabel="Eventos">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        {loadingEvento ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Event header */}
            {evento && (
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {evento.estadio}
                </p>
                <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '44px', color: '#fff', marginBottom: '4px' }}>
                  {evento.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {evento.equipo_visitante}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(evento.fecha).toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            )}

            {sectores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                <p>Este evento no tiene sectores configurados</p>
              </div>
            ) : (
              <>
                {/* Stadium bowl */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}
                >
                  <StadiumBowl
                    sectores={sectoresForBowl}
                    selectedId={activeSectorId}
                    onSelect={toggleActive}
                    availColors={availColors}
                  />
                </motion.div>

                {/* Sector cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {sectores.map((s, i) => {
                    const color = availColors[s.sector_id]
                    const soldOut = s.disponibles === 0
                    const isActive = activeSectorId === s.sector_id
                    const qty = selecciones[s.sector_id] || 0
                    const highlighted = isActive || qty > 0
                    const pct = s.total > 0 ? s.disponibles / s.total : 0

                    return (
                      <motion.div
                        key={s.sector_id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => !soldOut && toggleActive(s.sector_id)}
                        style={{
                          borderRadius: '10px',
                          border: `1px solid ${highlighted ? '#C9A227' : 'rgba(255,255,255,0.08)'}`,
                          borderLeft: `4px solid ${highlighted ? '#C9A227' : color}`,
                          background: highlighted ? 'rgba(201,162,39,0.06)' : 'rgba(255,255,255,0.02)',
                          padding: '16px 18px',
                          cursor: soldOut ? 'default' : 'pointer',
                          opacity: soldOut ? 0.45 : 1,
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        {soldOut && (
                          <span style={{
                            position: 'absolute', top: '12px', right: '12px',
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
                            color: '#9CA3AF', background: 'rgba(55,65,81,0.4)',
                            border: '1px solid rgba(156,163,175,0.2)',
                            borderRadius: '4px', padding: '2px 7px',
                          }}>
                            AGOTADO
                          </span>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: highlighted ? '#C9A227' : '#fff', letterSpacing: '1px', lineHeight: 1 }}>
                            {s.nombre}
                          </p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: highlighted ? '#C9A227' : 'rgba(255,255,255,0.7)', fontWeight: 700, marginLeft: '8px', flexShrink: 0 }}>
                            ${s.costo.toLocaleString('es-UY', { minimumFractionDigits: 0 })}/ent
                          </p>
                        </div>

                        {/* Progress bar — filled = ocupado */}
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', marginBottom: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (1 - pct) * 100))}%`, background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>

                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: soldOut ? 0 : '14px' }}>
                          {s.disponibles.toLocaleString()} / {s.total.toLocaleString()} disponibles
                        </p>

                        {!soldOut && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}
                          >
                            <button
                              onClick={() => cambiarQty(s.sector_id, -1, s.disponibles)}
                              disabled={qty === 0}
                              style={{
                                width: '30px', height: '30px', borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: qty === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                                color: qty === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                                fontSize: '18px', cursor: qty === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >−</button>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: qty > 0 ? '#C9A227' : 'rgba(255,255,255,0.4)', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => cambiarQty(s.sector_id, 1, s.disponibles)}
                              disabled={totalSelected >= 5}
                              style={{
                                width: '30px', height: '30px', borderRadius: '6px',
                                border: `1px solid ${totalSelected >= 5 ? 'rgba(255,255,255,0.08)' : 'rgba(201,162,39,0.4)'}`,
                                background: totalSelected >= 5 ? 'rgba(255,255,255,0.03)' : 'rgba(201,162,39,0.1)',
                                color: totalSelected >= 5 ? 'rgba(255,255,255,0.2)' : '#C9A227',
                                fontSize: '18px', cursor: totalSelected >= 5 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >+</button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {totalSelected >= 5 && (
                  <p style={{ fontSize: '12px', color: '#eab308', textAlign: 'center', marginBottom: '16px', letterSpacing: '0.5px' }}>
                    Máximo 5 entradas por transacción
                  </p>
                )}

                {/* Order summary */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="glass-card"
                  style={{ padding: '24px' }}
                >
                  {totalSelected === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', textAlign: 'center' }}>
                      Seleccioná sectores y cantidades para continuar
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {selectedLines.map(s => (
                          <div key={s.sector_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                              {s.nombre} <span style={{ color: 'rgba(255,255,255,0.3)' }}>× {s.qty}</span>
                            </span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#fff' }}>
                              ${(s.costo * s.qty).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Subtotal</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                              ${subtotal.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                              Comisión ({(tasa * 100).toFixed(0)}%)
                            </span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                              ${comisionMonto.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', color: '#C9A227', fontWeight: 700 }}>Total</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', color: '#C9A227', fontWeight: 700 }}>
                              ${totalPrice.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleCompra}
                          disabled={loading}
                          className="btn-gold"
                          style={{ padding: '14px 40px', fontSize: '20px', letterSpacing: '2px' }}
                        >
                          {loading ? 'Procesando...' : `Comprar (${totalSelected})`}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
