import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, ChevronDown, ChevronUp, ArrowRightLeft, X, AlertTriangle, Check, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCountdown from '../../components/QRCountdown'
import api from '../../services/api'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/authStore'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas']]

function TransferModal({ modal, onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    api.post('/transferencias/', { entrada_id: modal.entradaId, destino_mail: email.trim() })
      .then(() => {
        toast.success('Solicitud enviada. El destinatario debe aceptarla.')
        onSuccess()
        onClose()
      })
      .catch(err => {
        const detail = err.response?.data?.detail || 'Error al transferir'
        toast.error(detail)
      })
      .finally(() => setSending(false))
  }

  return (
    <AnimatePresence>
      {modal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 201,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              pointerEvents: 'all',
              width: 'min(460px, calc(100vw - 32px))',
              background: 'rgba(10,16,30,0.98)',
              border: '1px solid rgba(201,162,39,0.25)',
              borderRadius: '12px',
              padding: '28px 28px 24px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,162,39,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '28px',
                  color: '#fff',
                  letterSpacing: '1px',
                  margin: '0 0 4px 0',
                }}>
                  Transferir Entrada
                </h2>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: 'rgba(201,162,39,0.7)',
                  margin: 0,
                }}>
                  {modal.label}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'color 0.14s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(230,57,70,0.08)',
              border: '1px solid rgba(230,57,70,0.2)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <AlertTriangle size={14} color="#E63946" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
                lineHeight: 1.45,
              }}>
                Esta acción es <strong style={{ color: '#E63946' }}>irreversible</strong>. La entrada se transferirá permanentemente al destinatario.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}>
                  Email del destinatario
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.14s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.6)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.2)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'Bebas Neue, cursive',
                    fontSize: '15px',
                    letterSpacing: '1.5px',
                    cursor: 'pointer',
                    transition: 'border-color 0.14s, color 0.14s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: sending || !email.trim() ? 'rgba(230,57,70,0.3)' : '#E63946',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'Bebas Neue, cursive',
                    fontSize: '15px',
                    letterSpacing: '1.5px',
                    cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.14s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={e => { if (!sending && email.trim()) e.currentTarget.style.background = '#c4303c' }}
                  onMouseLeave={e => { if (!sending && email.trim()) e.currentTarget.style.background = '#E63946' }}
                >
                  {sending ? (
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'football-spin 0.7s linear infinite' }} />
                  ) : (
                    <><ArrowRightLeft size={14} /> Confirmar</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function EntradaRow({ entrada, onTransfer }) {
  const [open, setOpen] = useState(false)
  const isActiva = !entrada.consumido

  return (
    <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <div
        onClick={() => isActiva && setOpen(o => !o)}
        style={{
          padding: '11px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          cursor: isActiva ? 'pointer' : 'default',
        }}
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          #{String(entrada.id).padStart(6, '0')}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.25)', flex: 1 }}>
          ${entrada.costo.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isActiva && (
            <button
              onClick={e => { e.stopPropagation(); onTransfer(entrada.id, `#${String(entrada.id).padStart(6, '0')}`) }}
              title="Transferir esta entrada"
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '10px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.4)'; e.currentTarget.style.color = '#C9A227' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <ArrowRightLeft size={10} /> Transferir
            </button>
          )}
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '20px',
            background: isActiva ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: isActiva ? '#22c55e' : '#ef4444',
            border: `1px solid ${isActiva ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {entrada.consumido ? 'CONSUMIDA' : 'ACTIVA'}
          </span>
          {isActiva && (open
            ? <ChevronUp size={13} color="rgba(255,255,255,0.25)" />
            : <ChevronDown size={13} color="rgba(255,255,255,0.25)" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && isActiva && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: '1px solid rgba(201,162,39,0.1)', overflow: 'hidden' }}
          >
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <QRCountdown entradaId={entrada.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectorGroup({ sectorNombre, entradas, onTransfer }) {
  const activas = entradas.filter(e => !e.consumido).length
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '12px', color: '#C9A227', letterSpacing: '1.5px', flexShrink: 0 }}>
          {sectorNombre}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
          {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
          {activas < entradas.length && ` · ${activas} activa${activas !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {entradas.map(e => <EntradaRow key={e.id} entrada={e} onTransfer={onTransfer} />)}
      </div>
    </div>
  )
}

function EventGroup({ evento, entradas, index, onTransfer }) {
  const hasActive = entradas.some(e => !e.consumido)
  const [open, setOpen] = useState(hasActive)

  const bySector = entradas.reduce((acc, e) => {
    const k = e.evento.sector_nombre
    if (!acc[k]) acc[k] = []
    acc[k].push(e)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className="glass-card"
      style={{ overflow: 'hidden' }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ticket size={18} color="#C9A227" />
          </div>
          <div>
            <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', letterSpacing: '1px', lineHeight: 1.1, marginBottom: '3px' }}>
              {evento.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {evento.equipo_visitante}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              {evento.estadio_nombre} · {new Date(evento.fecha).toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, paddingTop: '4px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
          </span>
          {open ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ borderTop: '1px solid rgba(201,162,39,0.08)', overflow: 'hidden' }}
          >
            <div style={{ padding: '18px 24px 20px' }}>
              {Object.entries(bySector).map(([sectorNombre, sEntradas]) => (
                <SectorGroup key={sectorNombre} sectorNombre={sectorNombre} entradas={sEntradas} onTransfer={onTransfer} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MisEntradas() {
  const { user } = useAuthStore()
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [transferModal, setTransferModal] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [respondiendo, setRespondiendo] = useState(null)

  function fetchEntradas() {
    setLoading(true)
    api.get('/entradas/mis-entradas')
      .then(r => setEntradas(r.data))
      .catch(() => toast.error('Error al cargar tus entradas'))
      .finally(() => setLoading(false))
  }

  function fetchPendientes() {
    if (!user?.mail) return
    api.get(`/transferencias/mis-transferencias?mail_usuario=${encodeURIComponent(user.mail)}`)
      .then(r => {
        const all = r.data?.transferencias || []
        setPendientes(all.filter(t => t.estado === 'PENDIENTE' && t.destino_mail === user.mail))
      })
      .catch(() => {})
  }

  async function responderTransferencia(id, accion) {
    setRespondiendo(id)
    try {
      await api.patch(`/transferencias/${id}/${accion}`)
      toast.success(accion === 'aceptar' ? 'Entrada aceptada' : 'Transferencia rechazada')
      fetchPendientes()
      fetchEntradas()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error')
    } finally {
      setRespondiendo(null)
    }
  }

  useEffect(() => { fetchEntradas(); fetchPendientes() }, [])

  const eventos = Object.values(
    entradas.reduce((acc, e) => {
      if (!acc[e.evento_id]) acc[e.evento_id] = { evento_id: e.evento_id, evento: e.evento, entradas: [] }
      acc[e.evento_id].entradas.push(e)
      return acc
    }, {})
  ).sort((a, b) => new Date(b.evento.fecha) - new Date(a.evento.fecha))

  return (
    <Layout links={USER_LINKS}>
      <TransferModal
        modal={transferModal}
        onClose={() => setTransferModal(null)}
        onSuccess={fetchEntradas}
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '36px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '4px' }}>
            Mis Entradas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''} · {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {pendientes.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', color: '#C9A227', letterSpacing: '1px', marginBottom: '12px' }}>
              Transferencias Pendientes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendientes.map(t => (
                <motion.div
                  key={t.transferencia_id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    padding: '14px 18px',
                    background: 'rgba(201,162,39,0.06)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    borderRadius: '10px',
                  }}
                >
                  <div>
                    <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: '#fff', margin: '0 0 3px 0', letterSpacing: '0.5px' }}>
                      {t.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {t.equipo_visitante}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px 0' }}>
                      {t.sector_nombre} · ${Number(t.costo).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 2px 0' }}>
                      {new Date(t.evento_fecha).toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                      #{String(t.entrada_id).padStart(6, '0')} · De: {t.origen_mail}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => responderTransferencia(t.transferencia_id, 'rechazar')}
                      disabled={respondiendo === t.transferencia_id}
                      style={{
                        padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer',
                        fontFamily: 'Bebas Neue, cursive', fontSize: '13px', letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      <Ban size={12} /> Rechazar
                    </button>
                    <button
                      onClick={() => responderTransferencia(t.transferencia_id, 'aceptar')}
                      disabled={respondiendo === t.transferencia_id}
                      style={{
                        padding: '7px 14px', borderRadius: '7px', border: 'none',
                        background: '#22c55e', color: '#0A0A12', cursor: 'pointer',
                        fontFamily: 'Bebas Neue, cursive', fontSize: '13px', letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      <Check size={12} /> Aceptar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : entradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Ticket size={48} color="rgba(255,255,255,0.2)" />
            <p style={{ marginTop: '16px' }}>Todavía no tenés entradas</p>
            <Link to="/eventos" style={{ color: '#C9A227', textDecoration: 'none', marginTop: '12px', display: 'inline-block', fontSize: '14px' }}>
              Ver eventos disponibles →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {eventos.map((ev, i) => (
              <EventGroup
                key={ev.evento_id}
                evento={ev.evento}
                entradas={ev.entradas}
                index={i}
                onTransfer={(id, label) => setTransferModal({ entradaId: id, label })}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
