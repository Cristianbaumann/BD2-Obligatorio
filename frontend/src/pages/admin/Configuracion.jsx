import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'

const ADMIN_LINKS = [
  ['Eventos', '/admin/eventos'],
  ['Estadios', '/admin/estadios'],
  ['Funcionarios', '/admin/funcionarios'],
  ['Configuración', '/admin/configuracion'],
]

function extractDetail(err, fallback = 'Error') {
  const d = err?.response?.data?.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return fallback
}

export default function AdminConfiguracion() {
  const [tasa, setTasa] = useState(null)
  const [historial, setHistorial] = useState([])
  const [nuevaTasa, setNuevaTasa] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [comision, hist] = await Promise.all([
        api.get('/ventas/comision'),
        api.get('/ventas/comision/historial'),
      ])
      setTasa(comision.data.tasa)
      setHistorial(hist.data)
      setNuevaTasa((comision.data.tasa * 100).toFixed(2))
    } catch {
      toast.error('Error al cargar configuración')
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(e) {
    e.preventDefault()
    const val = parseFloat(nuevaTasa)
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Ingresá un porcentaje entre 0 y 100')
      return
    }
    const tasaDecimal = val / 100
    if (tasaDecimal === tasa) {
      toast('La tasa no cambió')
      return
    }
    setSaving(true)
    try {
      await api.put('/ventas/comision', { tasa: tasaDecimal })
      toast.success(`Comisión actualizada a ${val.toFixed(2)}%`)
      load()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al actualizar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <Settings size={32} color="#C9A227" />
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Configuración
          </h1>
        </div>

        {/* Comisión actual + form */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '28px', marginBottom: '28px' }}
        >
          <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', marginBottom: '6px' }}>
            Tasa de Comisión
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>
            Se aplica sobre el subtotal de cada venta. Cambia a futuro; las ventas existentes conservan la tasa con la que fueron procesadas.
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>
                Vigente ahora
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '36px', color: '#C9A227', fontWeight: 700, lineHeight: 1 }}>
                {tasa != null ? `${(tasa * 100).toFixed(2)}%` : '—'}
              </p>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flex: 1, minWidth: '220px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nueva tasa (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={nuevaTasa}
                    onChange={e => setNuevaTasa(e.target.value)}
                    required
                    className="form-input"
                    style={{ width: '100%', paddingRight: '32px', fontFamily: 'JetBrains Mono, monospace', fontSize: '16px' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                    %
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-gold"
                style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
              >
                <Check size={15} />
                {saving ? 'Guardando...' : 'Aplicar'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Historial */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ padding: '28px' }}
        >
          <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', marginBottom: '20px' }}>
            Historial de comisiones
          </h3>

          {historial.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Sin historial</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '12px', padding: '0 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Tasa', 'Desde', 'Hasta', 'Estado'].map(h => (
                  <span key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {historial.map((h, i) => {
                const vigente = h.fecha_hasta === null
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '12px',
                      padding: '12px',
                      borderBottom: i < historial.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: vigente ? 'rgba(201,162,39,0.04)' : 'transparent',
                    }}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', color: vigente ? '#C9A227' : '#fff', fontWeight: vigente ? 700 : 400 }}>
                      {(h.tasa * 100).toFixed(2)}%
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                      {h.fecha_desde}
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                      {h.fecha_hasta ?? '—'}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                      color: vigente ? '#22c55e' : 'rgba(255,255,255,0.3)',
                    }}>
                      {vigente ? 'VIGENTE' : 'CERRADA'}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
