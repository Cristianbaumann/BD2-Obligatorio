import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, GitCommitHorizontal, ArrowRight, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { ADMIN_LINKS } from '../../constants/navLinks'

const ESTADO_STYLES = {
  ACEPTADA: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  PENDIENTE: { bg: 'rgba(201,162,39,0.1)', color: '#C9A227', border: 'rgba(201,162,39,0.3)' },
  RECHAZADA: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
}

function Badge({ estado }) {
  const s = ESTADO_STYLES[estado] || ESTADO_STYLES.PENDIENTE
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.5px', fontWeight: 600,
    }}>
      {estado}
    </span>
  )
}

function PersonaNode({ mail, nombre, label, isFirst }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: isFirst ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.06)',
        border: `2px solid ${isFirst ? 'rgba(201,162,39,0.5)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <User size={20} color={isFirst ? '#C9A227' : 'rgba(255,255,255,0.4)'} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0 }}>{nombre || '—'}</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>{mail}</p>
      </div>
    </div>
  )
}

export default function HistorialTransferencias() {
  const [entradaId, setEntradaId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleBuscar(e) {
    e.preventDefault()
    if (!entradaId.trim()) return
    setLoading(true)
    setData(null)
    try {
      const [histRes, entRes] = await Promise.all([
        api.get(`/entradas/${entradaId.trim()}/historial`),
        api.get(`/entradas/${entradaId.trim()}`),
      ])
      setData({ historial: histRes.data, entrada: entRes.data })
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Entrada no encontrada'
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  const historial = data?.historial
  const entrada = data?.entrada

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227', marginBottom: '4px' }}>
            Log de Transferencias
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            Reconstruye la cadena de custodia de una entrada desde su emisión hasta el titular actual.
          </p>
        </div>

        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            value={entradaId}
            onChange={e => setEntradaId(e.target.value)}
            placeholder="ID de la entrada (UUID)"
            className="form-input"
            style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
          />
          <button type="submit" disabled={loading || !entradaId.trim()} className="btn-gold" style={{ padding: '0 24px', gap: '8px' }}>
            <Search size={16} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {data && (
            <motion.div key={entradaId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

              {/* Evento info */}
              {entrada?.evento && (
                <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#C9A227', letterSpacing: '1px', margin: 0 }}>
                      {entrada.evento.equipo_local} vs {entrada.evento.equipo_visitante}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>
                      {entrada.evento.sector_nombre} · {entrada.evento.fecha ? new Date(entrada.evento.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '4px 12px', borderRadius: '20px',
                    background: entrada.consumido ? 'rgba(34,197,94,0.1)' : 'rgba(201,162,39,0.1)',
                    color: entrada.consumido ? '#22c55e' : '#C9A227',
                    border: `1px solid ${entrada.consumido ? 'rgba(34,197,94,0.3)' : 'rgba(201,162,39,0.3)'}`,
                  }}>
                    {entrada.consumido ? 'CONSUMIDA' : 'ACTIVA'}
                  </span>
                </div>
              )}

              {/* Transfer chain */}
              <div className="glass-card" style={{ padding: '32px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', overflowX: 'auto', paddingBottom: '8px' }}>

                  {/* Emisor original */}
                  {historial.emisor_original && (
                    <>
                      <PersonaNode
                        mail={historial.emisor_original.mail}
                        nombre={`${historial.emisor_original.nombre} ${historial.emisor_original.apellido}`}
                        label="Emisor original"
                        isFirst
                      />
                      {historial.transferencias?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', marginTop: '52px' }}>
                          <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Transferencias */}
                  {historial.transferencias?.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <PersonaNode
                          mail={t.destino_mail}
                          nombre={t.destino_nombre}
                          label={`Transferencia ${i + 1}`}
                        />
                        <Badge estado={t.estado} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(t.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {i < historial.transferencias.length - 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', marginTop: '52px' }}>
                          <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                    </div>
                  ))}

                  {historial.transferencias?.length === 0 && (
                    <div style={{ padding: '20px 0 0 24px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                      Sin transferencias — la entrada nunca fue transferida.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  )
}
