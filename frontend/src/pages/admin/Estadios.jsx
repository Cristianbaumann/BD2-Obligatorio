import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, MapPin, Users, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import StadiumDrawer from '../../components/admin/StadiumDrawer'

const ADMIN_LINKS = [['Eventos', '/admin/eventos'], ['Estadios', '/admin/estadios'], ['Funcionarios', '/admin/funcionarios'], ['Configuración', '/admin/configuracion']]
const EMPTY_FORM = { nombre: '', dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '', aforo: '' }

function extractDetail(err) {
  const detail = err.response?.data?.detail
  if (!detail) return 'Error al crear estadio'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg).join('; ')
  return 'Error al crear estadio'
}

export default function AdminEstadios() {
  const [estadios, setEstadios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedEstadio, setSelectedEstadio] = useState(null)

  const load = () => api.get('/estadios').then(r => setEstadios(r.data)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/estadios', { ...form, aforo: Number(form.aforo) })
      toast.success('Estadio creado')
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      toast.error(extractDetail(err))
    }
  }

  const FIELDS = [
    { f: 'nombre',       l: 'Nombre',     t: 'text',   ph: 'Estadio Lusail' },
    { f: 'dir_pais',     l: 'País',       t: 'text',   ph: 'Qatar' },
    { f: 'dir_localidad',l: 'Ciudad',     t: 'text',   ph: 'Lusail' },
    { f: 'dir_calle',    l: 'Calle',      t: 'text',   ph: 'Lusail Blvd' },
    { f: 'dir_numero',   l: 'Número',     t: 'text',   ph: '1' },
    { f: 'aforo',        l: 'Aforo',      t: 'number', ph: '80000' },
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
                key={e.nombre}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card"
                onClick={() => setSelectedEstadio(e)}
                style={{ padding: '22px', cursor: 'pointer' }}
                whileHover={{ scale: 1.015, y: -2 }}
              >
                <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#fff', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  {e.nombre}
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                  <MapPin size={12} /> {e.dir_localidad}, {e.dir_pais}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} color="#C9A227" />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#C9A227', fontWeight: 700 }}>
                    {(e.aforo || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>asientos</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedEstadio && (
          <StadiumDrawer
            estadio={selectedEstadio}
            onClose={() => setSelectedEstadio(null)}
            onUpdated={(updated) => {
              setEstadios(prev => prev.map(e =>
                e.nombre === selectedEstadio.nombre ? { ...e, ...updated } : e
              ))
              if (updated.nombre && updated.nombre !== selectedEstadio.nombre) {
                setSelectedEstadio(null)
              } else {
                setSelectedEstadio(prev => ({ ...prev, ...updated }))
              }
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
