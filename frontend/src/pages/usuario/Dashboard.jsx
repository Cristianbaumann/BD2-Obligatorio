import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ticket, Calendar, ArrowLeftRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

const CARDS = [
  { to: '/eventos',      icon: <Calendar size={32} />,       label: 'Ver Eventos',  desc: 'Explorá los partidos disponibles' },
  { to: '/mis-entradas', icon: <Ticket size={32} />,         label: 'Mis Entradas', desc: 'Accedé a tus tickets y QRs' },
  { to: '/transferir',   icon: <ArrowLeftRight size={32} />, label: 'Transferir',   desc: 'Enviá una entrada a otro fan' },
]

export default function UsuarioDashboard() {
  const { user } = useAuthStore()

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '13px', color: '#C9A227', letterSpacing: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>
            FIFA World Cup 2026
          </p>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '6px', lineHeight: 1 }}>
            Bienvenido, {user?.nombre || 'Fan'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '48px', fontSize: '15px' }}>
            ¿Qué querés hacer hoy?
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {CARDS.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i + 0.2, duration: 0.4 }}
            >
              <Link to={card.to} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: '32px 24px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    background: 'rgba(201,162,39,0.1)',
                    border: '1px solid rgba(201,162,39,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#C9A227', marginBottom: '20px',
                  }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#fff', letterSpacing: '1px', marginBottom: '8px' }}>
                    {card.label}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
