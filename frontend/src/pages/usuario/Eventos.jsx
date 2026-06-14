import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

function FootballLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '3px solid rgba(201,162,39,0.2)',
        borderTopColor: '#C9A227',
        animation: 'football-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function EventCard({ evento, index }) {
  const navigate = useNavigate()
  const pct = evento.entradas_disponibles != null && evento.capacidad
    ? Math.round((evento.entradas_disponibles / evento.capacidad) * 100)
    : null
  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onClick={() => navigate(`/comprar/${evento.id}`)}
      className="glass-card"
      style={{ padding: '24px', cursor: 'pointer' }}
      whileHover={{ scale: 1.015 }}
    >
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>
        {evento.estadio || 'Estadio TBD'}
      </p>
      <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '26px', color: '#fff', letterSpacing: '1px', marginBottom: '4px' }}>
        {evento.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {evento.equipo_visitante}
      </h3>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
        {new Date(evento.fecha).toLocaleDateString('es-UY', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {pct !== null && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
            <span>Disponibilidad</span><span>{pct}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.6s' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#C9A227', fontWeight: 700 }}>
          Desde ${evento.precio_minimo ?? '—'}
        </span>
        <span style={{ fontSize: '12px', padding: '4px 12px', background: 'rgba(201,162,39,0.12)', color: '#C9A227', borderRadius: '20px', border: '1px solid rgba(201,162,39,0.3)' }}>
          Comprar →
        </span>
      </div>
    </motion.div>
  )
}

export default function Eventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/eventos')
      .then(r => setEventos(r.data))
      .catch(() => toast.error('Error al cargar eventos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '36px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '4px' }}>
            Partidos Disponibles
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {eventos.length} partidos encontrados
          </p>
        </motion.div>

        {loading ? (
          <FootballLoader />
        ) : eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Building2 size={48} color="rgba(255,255,255,0.2)" />
            <p style={{ marginTop: '16px' }}>No hay eventos disponibles</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {eventos.map((e, i) => <EventCard key={e.id} evento={e} index={i} />)}
          </div>
        )}
      </div>
    </Layout>
  )
}
