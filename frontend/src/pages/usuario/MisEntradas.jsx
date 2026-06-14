import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCountdown from '../../components/QRCountdown'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

function EntradaCard({ entrada, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card"
      style={{ overflow: 'hidden' }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '8px',
            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A227', flexShrink: 0,
          }}>
            <Ticket size={22} />
          </div>
          <div>
            <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#fff', letterSpacing: '1px' }}>
              {entrada.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {entrada.equipo_visitante}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {entrada.estadio} · Sector {entrada.sector} · Asiento {entrada.asiento}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
              {new Date(entrada.fecha).toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{
            fontSize: '11px', padding: '3px 10px',
            background: entrada.estado === 'ACTIVA' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: entrada.estado === 'ACTIVA' ? '#22c55e' : '#ef4444',
            borderRadius: '20px',
            border: `1px solid ${entrada.estado === 'ACTIVA' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {entrada.estado || 'ACTIVA'}
          </span>
          {open ? <ChevronUp size={18} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.4)" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ borderTop: '1px solid rgba(201,162,39,0.1)', overflow: 'hidden' }}
          >
            <div style={{ padding: '32px 24px', display: 'flex', justifyContent: 'center' }}>
              {entrada.estado === 'ACTIVA' ? (
                <QRCountdown entradaId={entrada.id} />
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Esta entrada ya no está activa
                </p>
              )}
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

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '36px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '4px' }}>
            Mis Entradas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entradas.map((e, i) => <EntradaCard key={e.id} entrada={e} index={i} />)}
          </div>
        )}
      </div>
    </Layout>
  )
}
