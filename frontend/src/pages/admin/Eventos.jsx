import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, MapPin, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'

const ADMIN_LINKS = [['Eventos', '/admin/eventos'], ['Estadios', '/admin/estadios'], ['Funcionarios', '/admin/funcionarios']]
const EMPTY_FORM = { equipo_local: '', equipo_visitante: '', fecha: '', estadio_id: '', precio_minimo: '' }

export default function AdminEventos() {
  const [eventos, setEventos] = useState([])
  const [estadios, setEstadios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const loadEventos = () => api.get('/eventos').then(r => setEventos(r.data)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => {
    loadEventos()
    api.get('/estadios').then(r => setEstadios(r.data)).catch(() => {})
  }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/eventos', {
        ...form,
        estadio_id: Number(form.estadio_id),
        precio_minimo: Number(form.precio_minimo),
      })
      toast.success('Evento creado')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadEventos()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear evento')
    }
  }

  const TEXT_FIELDS = [
    { f: 'equipo_local',     l: 'Equipo Local',     t: 'text' },
    { f: 'equipo_visitante', l: 'Equipo Visitante',  t: 'text' },
    { f: 'fecha',            l: 'Fecha y Hora',      t: 'datetime-local' },
    { f: 'precio_minimo',    l: 'Precio Mínimo',     t: 'number' },
  ]

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Eventos ({eventos.length})
          </h1>
          <button
            onClick={() => setShowForm(s => !s)}
            className="btn-gold"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cerrar' : 'Nuevo Evento'}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '28px', marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C9A227', marginBottom: '20px' }}>
              Nuevo Evento
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {TEXT_FIELDS.map(({ f, l, t }) => (
                <div key={f}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>{l}</label>
                  <input type={t} value={form[f]} onChange={set(f)} required className="form-input" />
                </div>
              ))}

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  Estadio
                </label>
                {estadios.length === 0 ? (
                  <input
                    type="number"
                    value={form.estadio_id}
                    onChange={set('estadio_id')}
                    required
                    placeholder="ID del estadio"
                    className="form-input"
                  />
                ) : (
                  <select value={form.estadio_id} onChange={set('estadio_id')} required className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="">Seleccioná un estadio...</option>
                    {estadios.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.nombre} — {est.ciudad}, {est.pais} ({(est.capacidad || 0).toLocaleString()} asientos)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button type="submit" className="btn-gold" style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: '13px', fontSize: '18px' }}>
                Crear Evento
              </button>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
          </div>
        ) : eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <CalendarDays size={48} color="rgba(255,255,255,0.2)" />
            <p style={{ marginTop: '16px' }}>No hay eventos creados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {eventos.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="row-item"
              >
                <div>
                  <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#fff', letterSpacing: '0.5px' }}>
                    {e.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {e.equipo_visitante}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={11} /> {e.estadio || 'Sin estadio'} · {new Date(e.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#C9A227', fontSize: '15px', fontWeight: 700 }}>
                  ${e.precio_minimo ?? '—'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
