import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DollarSign, Ticket, Users, Trophy } from 'lucide-react'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { ADMIN_LINKS } from '../../constants/navLinks'

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
  const [masVendidos, setMasVendidos] = useState([])
  const [compradores, setCompradores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reportes/mas-vendidos').catch(() => ({ data: [] })),
      api.get('/reportes/mayores-compradores').catch(() => ({ data: [] })),
    ]).then(([mv, c]) => {
      setMasVendidos(Array.isArray(mv.data) ? mv.data : [])
      setCompradores(Array.isArray(c.data) ? c.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const totalVendidas = masVendidos.reduce((s, e) => s + (e.total_entradas_vendidas || 0), 0)
  const totalGastado  = compradores.reduce((s, c) => s + (c.total_gastado || 0), 0)

  const kpis = [
    { icon: <Ticket size={18} />,   label: 'Entradas Vendidas',    value: totalVendidas.toLocaleString(),                          sub: 'top eventos' },
    { icon: <DollarSign size={18} />, label: 'Total Recaudado',    value: `$${totalGastado.toLocaleString('es-UY', { minimumFractionDigits: 0 })}`, sub: 'top compradores' },
    { icon: <Trophy size={18} />,   label: 'Eventos con ventas',   value: masVendidos.length.toString(),                           sub: 'en ranking' },
    { icon: <Users size={18} />,    label: 'Compradores activos',  value: compradores.length.toString(),                           sub: 'en ranking' },
  ]

  const barData = masVendidos.map(e => ({
    partido: `${e.equipo_local} vs ${e.equipo_visitante}`,
    vendidas: e.total_entradas_vendidas,
  }))

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
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {kpis.map((k, i) => <KPICard key={k.label} {...k} index={i} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

              {/* Eventos más vendidos — bar chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '20px', letterSpacing: '1px' }}>
                  Eventos Más Vendidos
                </h3>
                {barData.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="partido"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Entradas']} />
                      <Bar dataKey="vendidas" fill="#C9A227" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Mayores compradores — tabla */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '20px', letterSpacing: '1px' }}>
                  Mayores Compradores
                </h3>
                {compradores.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Sin datos</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>Email</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Entradas</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Gastado</span>
                    </div>
                    {compradores.map((c, i) => (
                      <div
                        key={c.mail}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px',
                          padding: '10px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: i === 0 ? 'rgba(201,162,39,0.04)' : 'none',
                        }}
                      >
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: i === 0 ? '#C9A227' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i === 0 && '🥇 '}{c.mail}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                          {c.total_entradas_compradas}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#C9A227', textAlign: 'right' }}>
                          ${Number(c.total_gastado).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
