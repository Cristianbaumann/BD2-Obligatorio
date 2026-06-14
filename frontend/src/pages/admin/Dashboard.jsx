import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { DollarSign, Ticket, Calendar, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import Layout from '../../components/Layout'

const ADMIN_LINKS = [['Eventos', '/admin/eventos'], ['Estadios', '/admin/estadios'], ['Funcionarios', '/admin/funcionarios']]
const PIE_COLORS = ['#C9A227', '#1A3A5C', '#22c55e', '#E63946', '#8b5cf6', '#f97316']

const TOOLTIP_STYLE = {
  background: '#0E1A2E',
  border: '1px solid rgba(201,162,39,0.3)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
}

function KPICard({ icon, label, value, sub, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</span>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A227',
        }}>
          {icon}
        </div>
      </div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '28px', color: '#fff', fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{sub}</p>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [reportes, setReportes] = useState(null)
  const [ocupacion, setOcupacion] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reportes/ventas').catch(() => ({ data: null })),
      api.get('/reportes/ocupacion').catch(() => ({ data: [] })),
    ]).then(([v, o]) => {
      setReportes(v.data)
      setOcupacion(Array.isArray(o.data) ? o.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const ventas = reportes?.por_evento || []
  const kpis = [
    { icon: <DollarSign size={18} />, label: 'Total Recaudado',    value: `$${(reportes?.total_recaudado ?? 0).toLocaleString()}`,  sub: 'en ventas' },
    { icon: <Ticket size={18} />,     label: 'Entradas Vendidas',  value: (reportes?.total_vendidas ?? 0).toLocaleString(),          sub: 'tickets' },
    { icon: <Calendar size={18} />,   label: 'Eventos Activos',    value: (reportes?.eventos_activos ?? 0).toString(),               sub: 'partidos' },
    { icon: <TrendingUp size={18} />, label: 'Comisión Acumulada', value: `$${(reportes?.comision_total ?? 0).toLocaleString()}`,    sub: '10% sobre ventas' },
  ]

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '36px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227' }}>
            Dashboard
          </h1>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {kpis.map((k, i) => <KPICard key={k.label} {...k} index={i} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '20px', letterSpacing: '1px' }}>
                  Ventas por Evento
                </h3>
                {ventas.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ventas} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="evento" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="vendidas" fill="#C9A227" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '20px', letterSpacing: '1px' }}>
                  Ocupación por Sector
                </h3>
                {ocupacion.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={ocupacion} dataKey="ocupadas" nameKey="sector" cx="50%" cy="50%" outerRadius={90} label>
                        {ocupacion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
