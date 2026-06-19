import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { ADMIN_LINKS } from '../../constants/navLinks'

export default function AdminDispositivos() {
  const [dispositivos, setDispositivos] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedMail, setSelectedMail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [eliminando, setEliminando] = useState(null)

  const loadDispositivos = () =>
    api.get('/dispositivos/').then(r => setDispositivos(r.data)).catch(() => {})

  useEffect(() => {
    Promise.all([
      api.get('/dispositivos/'),
      api.get('/usuarios/funcionarios'),
    ]).then(([d, f]) => {
      setDispositivos(d.data)
      setFuncionarios(f.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleCrear(e) {
    e.preventDefault()
    if (!selectedMail) return toast.error('Seleccioná un funcionario')
    setSubmitting(true)
    try {
      await api.post('/dispositivos/', { funcionario_mail: selectedMail })
      toast.success('Dispositivo creado')
      setShowForm(false)
      setSelectedMail('')
      await loadDispositivos()
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al crear dispositivo'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminar(id) {
    setEliminando(id)
    try {
      await api.delete(`/dispositivos/${id}`)
      setDispositivos(prev => prev.filter(d => d.id !== id))
      toast.success('Dispositivo eliminado')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al eliminar')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Dispositivos ({dispositivos.length})
          </h1>
          <button onClick={() => setShowForm(s => !s)} className="btn-gold">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cerrar' : 'Nuevo dispositivo'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass-card"
              style={{ padding: '24px', marginBottom: '28px' }}
            >
              <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', marginBottom: '16px' }}>
                Registrar Dispositivo
              </h3>
              <form onSubmit={handleCrear} style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={selectedMail}
                  onChange={e => setSelectedMail(e.target.value)}
                  required className="form-input" style={{ flex: 1, cursor: 'pointer' }}
                >
                  <option value="">Seleccioná un funcionario...</option>
                  {funcionarios.map(f => (
                    <option key={f.mail || f.email} value={f.mail || f.email}>
                      {f.nombre} {f.apellido} — {f.mail || f.email}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={submitting || !selectedMail} className="btn-gold" style={{ padding: '0 24px' }}>
                  {submitting ? 'Creando...' : 'Crear'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : dispositivos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <Smartphone size={48} color="rgba(255,255,255,0.1)" />
            <p style={{ marginTop: '16px' }}>No hay dispositivos registrados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dispositivos.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="row-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: d.activo ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${d.activo ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Smartphone size={18} color={d.activo ? '#22c55e' : 'rgba(255,255,255,0.3)'} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {d.id.slice(0, 8).toUpperCase()}…{d.id.slice(-4).toUpperCase()}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '2px 0 0' }}>{d.funcionario_mail}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: d.activo ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: d.activo ? '#22c55e' : '#ef4444',
                    border: `1px solid ${d.activo ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    {d.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                  <button
                    onClick={() => handleEliminar(d.id)}
                    disabled={eliminando === d.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: eliminando === d.id ? 0.4 : 0.7, padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
