import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'
import api from '../../services/api'
import Layout from '../../components/Layout'
import MatchCard from '../../components/MatchCard'
import useAuthStore from '../../store/authStore'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas']]
const PUBLIC_LINKS = [['Eventos', '/eventos']]

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

export default function Eventos() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/eventos')
      .then(r => setEventos(r.data))
      .catch(() => toast.error('Error al cargar eventos'))
      .finally(() => setLoading(false))
  }, [])

  function handleComprar(eventoId) {
    if (!token) {
      navigate('/login', { state: { from: { pathname: `/comprar/${eventoId}` } } })
      return
    }
    navigate(`/comprar/${eventoId}`)
  }

  return (
    <Layout links={token ? USER_LINKS : PUBLIC_LINKS}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {eventos.map((e, i) => {
              const fecha = new Date(e.fecha)
              return (
                <MatchCard
                  key={e.id}
                  index={i}
                  home={{ code: e.equipo_local.slice(0, 3).toUpperCase(), name: e.equipo_local }}
                  away={{ code: e.equipo_visitante.slice(0, 3).toUpperCase(), name: e.equipo_visitante }}
                  date={fecha.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                  time={fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  venue={e.estadio}
                  price={e.precio_minimo}
                  remaining={e.entradas_disponibles}
                  total={e.capacidad}
                  onClick={() => handleComprar(e.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
