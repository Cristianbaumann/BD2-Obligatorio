import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, UserCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'

const ADMIN_LINKS = [['Eventos', '/admin/eventos'], ['Estadios', '/admin/estadios'], ['Funcionarios', '/admin/funcionarios'], ['Configuración', '/admin/configuracion']]
const EMPTY_FORM = { funcionario_id: '', evento_id: '', sector: '' }

function extractDetail(err, fallback = 'Error') {
  const d = err?.response?.data?.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return fallback
}

export default function AdminFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = () => api.get('/usuarios/funcionarios').then(r => setFuncionarios(r.data)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => {
    load()
    api.get('/eventos').then(r => setEventos(r.data)).catch(() => {})
  }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleAssign(e) {
    e.preventDefault()
    try {
      await api.post('/asignaciones', {
        funcionario_id: Number(form.funcionario_id),
        evento_id: Number(form.evento_id),
        sector: form.sector,
      })
      toast.success('Funcionario asignado')
      setShowAssign(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error(extractDetail(err, 'Error al asignar'))
    }
  }

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Funcionarios ({funcionarios.length})
          </h1>
          <button onClick={() => setShowAssign(s => !s)} className="btn-gold">
            {showAssign ? <X size={16} /> : <UserCheck size={16} />}
            {showAssign ? 'Cerrar' : 'Asignar'}
          </button>
        </div>

        {showAssign && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '28px', marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C9A227', marginBottom: '20px' }}>
              Asignar Funcionario a Evento
            </h3>
            <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Funcionario</label>
                {funcionarios.length === 0 ? (
                  <input type="number" value={form.funcionario_id} onChange={set('funcionario_id')} required placeholder="ID" className="form-input" />
                ) : (
                  <select value={form.funcionario_id} onChange={set('funcionario_id')} required className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="">Seleccioná...</option>
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre} {f.apellido}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Evento</label>
                {eventos.length === 0 ? (
                  <input type="number" value={form.evento_id} onChange={set('evento_id')} required placeholder="ID" className="form-input" />
                ) : (
                  <select value={form.evento_id} onChange={set('evento_id')} required className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="">Seleccioná...</option>
                    {eventos.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.equipo_local} vs {ev.equipo_visitante} — {new Date(ev.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Sector</label>
                <input type="text" value={form.sector} onChange={set('sector')} required placeholder="Norte, Sur, Palco..." className="form-input" />
              </div>

              <button type="submit" className="btn-gold" style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: '13px', fontSize: '18px' }}>
                Asignar Funcionario
              </button>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : funcionarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <User size={48} color="rgba(255,255,255,0.2)" />
            <p style={{ marginTop: '16px' }}>No hay funcionarios registrados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {funcionarios.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="row-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UserCheck size={18} color="#C9A227" />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: 500 }}>{f.nombre} {f.apellido}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{f.email}</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                  FUNCIONARIO
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
