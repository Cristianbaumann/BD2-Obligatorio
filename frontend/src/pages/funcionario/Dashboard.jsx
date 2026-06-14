import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScanLine } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Layout from '../../components/Layout'

export default function FuncionarioDashboard() {
  const { user } = useAuthStore()

  return (
    <Layout brand="MUNDIAL 2026">
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '13px', color: '#C9A227', letterSpacing: '4px', marginBottom: '8px' }}>
            PANEL DE FUNCIONARIO
          </p>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '8px', lineHeight: 1 }}>
            Bienvenido, {user?.nombre || 'Funcionario'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '56px', fontSize: '15px' }}>
            Panel de control del estadio
          </p>

          <Link to="/funcionario/scanner" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="glass-card"
              style={{ padding: '56px 40px', display: 'inline-block', width: '100%' }}
            >
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <ScanLine size={44} color="#C9A227" />
              </div>
              <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '30px', color: '#fff', letterSpacing: '2px', marginBottom: '10px' }}>
                Escanear QR
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.5 }}>
                Validar entradas en el acceso al estadio
              </p>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </Layout>
  )
}
