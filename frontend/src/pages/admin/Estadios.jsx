import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, MapPin, Users, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'

const ADMIN_LINKS = [['Eventos', '/admin/eventos'], ['Estadios', '/admin/estadios'], ['Funcionarios', '/admin/funcionarios']]
const EMPTY_FORM = { nombre: '', ciudad: '', pais: '', capacidad: '' }

export default function AdminEstadios() {
  const [estadios, setEstadios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = () => api.get('/estadios').then(r => setEstadios(r.data)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/estadios', { ...form, capacidad: Number(form.capacidad) })
      toast.success('Estadio creado')
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear estadio')
    }
  }

  const FIELDS = [
    { f: 'nombre',    l: 'Nombre',    t: 'text',   ph: 'Estadio Lusail' },
    { f: 'ciudad',    l: 'Ciudad',    t: 'text',   ph: 'Lusail' },
    { f: 'pais',      l: 'País',      t: 'text',   ph: 'Qatar' },
    { f: 'capacidad', l: 'Capacidad', t: 'number', ph: '80000' },
  ]

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Estadios ({estadios.length})
          </h1>
          <button onClick={() => setShowForm(s => !s)} className="btn-gold">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cerrar' : 'Nuevo Estadio'}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '28px', marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C9A227', marginBottom: '20px' }}>Nuevo Estadio</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {FIELDS.map(({ f, l, t, ph }) => (
                <div key={f}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>{l}</label>
                  <input type={t} value={form[f]} onChange={set(f)} required placeholder={ph} className="form-input" />
                </div>
              ))}
              <button type="submit" className="btn-gold" style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: '13px', fontSize: '18px' }}>
                Crear Estadio
              </button>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : estadios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <Building2 size={48} color="rgba(255,255,255,0.2)" />
            <p style={{ marginTop: '16px' }}>No hay estadios registrados</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {estadios.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card"
                style={{ padding: '22px' }}
              >
                <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  {e.nombre}
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                  <MapPin size={12} /> {e.ciudad}, {e.pais}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} color="#C9A227" />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#C9A227', fontWeight: 700 }}>
                    {(e.capacidad || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>asientos</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
