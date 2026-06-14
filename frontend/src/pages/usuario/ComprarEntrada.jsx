import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import StadiumSelector from '../../components/StadiumSelector'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

export default function ComprarEntrada() {
  const { eventoId } = useParams()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingEvento, setLoadingEvento] = useState(true)

  useEffect(() => {
    api.get(`/eventos/${eventoId}`)
      .then(r => setEvento(r.data))
      .catch(() => toast.error('Error al cargar el evento'))
      .finally(() => setLoadingEvento(false))
  }, [eventoId])

  async function handleCompra() {
    if (selectedSeats.length === 0) return
    setLoading(true)
    try {
      await api.post('/ventas', {
        evento_id: Number(eventoId),
        asientos: selectedSeats,
        cantidad: selectedSeats.length,
      })
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#C9A227', '#ffffff', '#22c55e'] })
      toast.success(`¡${selectedSeats.length} entrada${selectedSeats.length > 1 ? 's' : ''} comprada${selectedSeats.length > 1 ? 's' : ''}!`)
      setTimeout(() => navigate('/mis-entradas'), 2000)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al procesar la compra')
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = evento?.precio_minimo ? selectedSeats.length * evento.precio_minimo : null

  return (
    <Layout links={USER_LINKS} backTo="/eventos" backLabel="Eventos">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        {loadingEvento ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
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

            <StadiumSelector eventoId={eventoId} onSeatsSelected={setSelectedSeats} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
              style={{
                marginTop: '32px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '4px' }}>
                  {selectedSeats.length === 0
                    ? 'Seleccioná al menos 1 asiento'
                    : `${selectedSeats.length} asiento${selectedSeats.length > 1 ? 's' : ''} seleccionado${selectedSeats.length > 1 ? 's' : ''}`}
                </p>
                {totalPrice && (
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '28px', color: '#C9A227', fontWeight: 700 }}>
                    Total: ${totalPrice.toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={handleCompra}
                disabled={selectedSeats.length === 0 || loading}
                className="btn-gold"
                style={{
                  padding: '14px 40px',
                  fontSize: '20px',
                  letterSpacing: '2px',
                  opacity: selectedSeats.length === 0 ? 0.4 : 1,
                  background: selectedSeats.length === 0 ? '#374151' : '#C9A227',
                  color: selectedSeats.length === 0 ? 'rgba(255,255,255,0.3)' : '#0A0A12',
                  cursor: selectedSeats.length === 0 || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Procesando...' : `Comprar${selectedSeats.length > 0 ? ` (${selectedSeats.length})` : ''}`}
              </button>
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  )
}
