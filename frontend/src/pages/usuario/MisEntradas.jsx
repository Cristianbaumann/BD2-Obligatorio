import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCountdown from '../../components/QRCountdown'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

function EntradaRow({ entrada }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <div
        onClick={() => !entrada.consumido && setOpen(o => !o)}
        style={{
          padding: '11px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          cursor: entrada.consumido ? 'default' : 'pointer',
        }}
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          #{String(entrada.id).padStart(6, '0')}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.25)', flex: 1 }}>
          ${entrada.costo.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '20px',
            background: !entrada.consumido ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: !entrada.consumido ? '#22c55e' : '#ef4444',
            border: `1px solid ${!entrada.consumido ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {entrada.consumido ? 'CONSUMIDA' : 'ACTIVA'}
          </span>
          {!entrada.consumido && (open
            ? <ChevronUp size={13} color="rgba(255,255,255,0.25)" />
            : <ChevronDown size={13} color="rgba(255,255,255,0.25)" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && !entrada.consumido && (
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

function SectorGroup({ sectorNombre, entradas }) {
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
        {entradas.map(e => <EntradaRow key={e.id} entrada={e} />)}
      </div>
    </div>
  )
}

function EventGroup({ evento, entradas, index }) {
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
                <SectorGroup key={sectorNombre} sectorNombre={sectorNombre} entradas={sEntradas} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MisEntradas() {
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/entradas/mis-entradas')
      .then(r => setEntradas(r.data))
      .catch(() => toast.error('Error al cargar tus entradas'))
      .finally(() => setLoading(false))
  }, [])

  const eventos = Object.values(
    entradas.reduce((acc, e) => {
      if (!acc[e.evento_id]) acc[e.evento_id] = { evento_id: e.evento_id, evento: e.evento, entradas: [] }
      acc[e.evento_id].entradas.push(e)
      return acc
    }, {})
  ).sort((a, b) => new Date(b.evento.fecha) - new Date(a.evento.fecha))

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '36px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '4px' }}>
            Mis Entradas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''} · {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

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
              <EventGroup key={ev.evento_id} evento={ev.evento} entradas={ev.entradas} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
