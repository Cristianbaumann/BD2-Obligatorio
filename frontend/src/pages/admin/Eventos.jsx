import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, MapPin, CalendarDays, Pencil, ChevronUp, Trash2, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { ADMIN_LINKS } from '../../constants/navLinks'
const EMPTY_FORM = { equipo_local_id: '', equipo_visitante_id: '', fecha: '', estadio_nombre: '' }

function extractDetail(err, fallback = 'Error') {
  const d = err?.response?.data?.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return fallback
}

function toDateTimeLocal(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toISOString().slice(0, 16)
}

export default function AdminEventos() {
  const [eventos, setEventos] = useState([])
  const [estadios, setEstadios] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const [sectores, setSectores] = useState([])
  const [sectorPrecios, setSectorPrecios] = useState({})
  const [loadingSectores, setLoadingSectores] = useState(false)

  const loadEventos = () =>
    api.get('/eventos').then(r => setEventos(r.data)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => {
    loadEventos()
    api.get('/estadios').then(r => setEstadios(r.data)).catch(() => {})
    api.get('/equipos').then(r => setEquipos(r.data)).catch(() => {})
  }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function loadSectores(estadioNombre, existingPrices = {}) {
    if (!estadioNombre) { setSectores([]); setSectorPrecios({}); return }
    setLoadingSectores(true)
    try {
      const r = await api.get(`/estadios/${encodeURIComponent(estadioNombre)}`)
      const secs = r.data.sectores || []
      setSectores(secs)
      setSectorPrecios(
        Object.fromEntries(secs.map(s => [
          s.id,
          existingPrices[s.id] ?? { enabled: false, costo: '' },
        ]))
      )
    } catch {
      toast.error('Error al cargar sectores del estadio')
      setSectores([])
    } finally {
      setLoadingSectores(false)
    }
  }

  function handleEstadioChange(e) {
    const nombre = e.target.value
    setForm(p => ({ ...p, estadio_nombre: nombre }))
    loadSectores(nombre)
  }

  function toggleSector(id) {
    setSectorPrecios(p => ({ ...p, [id]: { ...p[id], enabled: !p[id].enabled } }))
  }

  function setCosto(id, val) {
    setSectorPrecios(p => ({ ...p, [id]: { ...p[id], costo: val } }))
  }

  function buildSectoresPayload() {
    return sectores
      .filter(s => sectorPrecios[s.id]?.enabled)
      .map(s => ({ sector_id: s.id, costo: parseFloat(sectorPrecios[s.id].costo) }))
      .filter(s => !isNaN(s.costo) && s.costo >= 0)
  }

  function resetFormState() {
    setForm(EMPTY_FORM)
    setSectores([])
    setSectorPrecios({})
  }

  async function handleCreate(e) {
    e.preventDefault()
    const est = estadios.find(s => s.nombre === form.estadio_nombre)
    if (!est) { toast.error('Seleccioná un estadio válido'); return }
    try {
      await api.post('/eventos', {
        equipo_local_id: form.equipo_local_id,
        equipo_visitante_id: form.equipo_visitante_id,
        fecha: form.fecha,
        estadio_pais: est.dir_pais,
        estadio_localidad: est.dir_localidad,
        estadio_calle: est.dir_calle,
        estadio_numero: est.dir_numero,
        sectores: buildSectoresPayload(),
      })
      toast.success('Evento creado')
      setShowCreate(false)
      resetFormState()
      loadEventos()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al crear evento'))
    }
  }

  async function handleDelete(ev, id) {
    ev.stopPropagation()
    if (!window.confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/eventos/${id}`)
      toast.success('Evento eliminado')
      if (editingId === id) { setEditingId(null); resetFormState() }
      loadEventos()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al eliminar evento'))
    }
  }

  async function handleCancelar(ev, id) {
    ev.stopPropagation()
    if (!window.confirm('¿Cancelar este evento? Se reembolsará el saldo a todos los compradores. Esta acción no se puede deshacer.')) return
    try {
      const r = await api.patch(`/eventos/${id}/cancelar`)
      toast.success(`Evento cancelado. ${r.data.usuarios_reembolsados} usuario(s) reembolsado(s) por $${r.data.total_reembolsado}`)
      loadEventos()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al cancelar evento'))
    }
  }

  async function handleEdit(e) {
    e.preventDefault()
    const est = estadios.find(s => s.nombre === form.estadio_nombre)
    if (!est) { toast.error('Seleccioná un estadio válido'); return }
    try {
      await api.put(`/eventos/${editingId}`, {
        equipo_local_id: form.equipo_local_id,
        equipo_visitante_id: form.equipo_visitante_id,
        fecha: form.fecha,
        estadio_pais: est.dir_pais,
        estadio_localidad: est.dir_localidad,
        estadio_calle: est.dir_calle,
        estadio_numero: est.dir_numero,
        sectores: buildSectoresPayload(),
      })
      toast.success('Evento actualizado')
      setEditingId(null)
      resetFormState()
      loadEventos()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al actualizar evento'))
    }
  }

  async function handleRowClick(ev) {
    if (editingId === ev.id) {
      setEditingId(null)
      resetFormState()
      return
    }
    // close create form and any other open edit
    setShowCreate(false)
    setEditingId(null)
    resetFormState()

    const eqLocal = equipos.find(eq => eq.nombre === ev.equipo_local)
    const eqVisit = equipos.find(eq => eq.nombre === ev.equipo_visitante)
    setForm({
      equipo_local_id: eqLocal?.id ?? '',
      equipo_visitante_id: eqVisit?.id ?? '',
      fecha: toDateTimeLocal(ev.fecha),
      estadio_nombre: ev.estadio ?? '',
    })

    let existingPrices = {}
    try {
      const r = await api.get(`/eventos/${ev.id}/disponibilidad`)
      existingPrices = Object.fromEntries(
        r.data.map(s => [s.sector_id, { enabled: true, costo: String(s.costo) }])
      )
    } catch { /* no sectors yet */ }

    await loadSectores(ev.estadio, existingPrices)
    setEditingId(ev.id)
  }

  function openCreate() {
    setEditingId(null)
    resetFormState()
    setShowCreate(s => !s)
  }

  // Shared form body (fields + sectors + submit)
  function renderFormBody(onSubmit, submitLabel) {
    return (
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Equipo Local</label>
            <select value={form.equipo_local_id} onChange={set('equipo_local_id')} required className="form-input" style={{ cursor: 'pointer' }}>
              <option value="">Seleccioná...</option>
              {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Equipo Visitante</label>
            <select value={form.equipo_visitante_id} onChange={set('equipo_visitante_id')} required className="form-input" style={{ cursor: 'pointer' }}>
              <option value="">Seleccioná...</option>
              {equipos.filter(eq => eq.id !== form.equipo_local_id).map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Fecha y Hora</label>
            <input type="datetime-local" value={form.fecha} onChange={set('fecha')} required className="form-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>Estadio</label>
            <select value={form.estadio_nombre} onChange={handleEstadioChange} required className="form-input" style={{ cursor: 'pointer' }}>
              <option value="">Seleccioná...</option>
              {estadios.map(est => (
                <option key={est.nombre} value={est.nombre}>{est.nombre} — {est.dir_localidad}, {est.dir_pais}</option>
              ))}
            </select>
          </div>
        </div>

        {form.estadio_nombre && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(201,162,39,0.15)', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.6px', marginBottom: '10px', textTransform: 'uppercase' }}>
              Sectores y Precios
            </p>
            {loadingSectores ? (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Cargando sectores...</p>
            ) : sectores.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Este estadio no tiene sectores registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {sectores.map(s => {
                  const sp = sectorPrecios[s.id] || { enabled: false, costo: '' }
                  return (
                    <div key={s.id} style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '12px', alignItems: 'center',
                      padding: '9px 12px',
                      background: sp.enabled ? 'rgba(201,162,39,0.06)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid ' + (sp.enabled ? 'rgba(201,162,39,0.25)' : 'rgba(255,255,255,0.06)'),
                      borderRadius: '8px', transition: 'all 0.15s ease',
                    }}>
                      <input type="checkbox" checked={sp.enabled} onChange={() => toggleSector(s.id)}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#C9A227' }} />
                      <div>
                        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '14px', color: sp.enabled ? '#fff' : 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' }}>
                          {s.nombre}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginLeft: '8px' }}>
                          {s.capacidad.toLocaleString()} lugares
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>$</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={sp.costo} onChange={e => setCosto(s.id, e.target.value)}
                        disabled={!sp.enabled} required={sp.enabled}
                        className="form-input"
                        style={{ width: '100px', padding: '5px 8px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-gold" style={{ marginTop: '18px', width: '100%', justifyContent: 'center', padding: '12px', fontSize: '17px' }}>
          {submitLabel}
        </button>
      </form>
    )
  }

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Eventos ({eventos.length})
          </h1>
          <button onClick={openCreate} className="btn-gold">
            {showCreate ? <X size={16} /> : <Plus size={16} />}
            {showCreate ? 'Cerrar' : 'Nuevo Evento'}
          </button>
        </div>

        {/* Create form — stays at top */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="glass-card"
              style={{ padding: '24px', marginBottom: '28px' }}
            >
              <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', marginBottom: '18px' }}>
                Nuevo Evento
              </h3>
              {renderFormBody(handleCreate, 'Crear Evento')}
            </motion.div>
          )}
        </AnimatePresence>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {eventos.map((e, i) => {
              const isOpen = editingId === e.id
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ marginBottom: isOpen ? '0' : '10px' }}
                >
                  {/* Row */}
                  <div
                    className="row-item"
                    onClick={() => handleRowClick(e)}
                    style={{
                      cursor: 'pointer',
                      borderBottomLeftRadius: isOpen ? '0' : undefined,
                      borderBottomRightRadius: isOpen ? '0' : undefined,
                      borderBottom: isOpen ? '1px solid rgba(201,162,39,0.2)' : undefined,
                      background: isOpen ? 'rgba(201,162,39,0.04)' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: e.cancelado ? 'rgba(255,255,255,0.4)' : '#fff', letterSpacing: '0.5px' }}>
                          {e.equipo_local} <span style={{ color: '#C9A227' }}>vs</span> {e.equipo_visitante}
                        </p>
                        {e.cancelado && (
                          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            CANCELADO
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={11} /> {e.estadio || 'Sin estadio'} · {new Date(e.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#C9A227', fontSize: '15px', fontWeight: 700 }}>
                        {e.precio_minimo != null ? `$${e.precio_minimo}` : '—'}
                      </span>
                      {!e.cancelado && (
                        <button
                          onClick={(ev) => handleCancelar(ev, e.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', opacity: 0.4 }}
                          onMouseEnter={el => el.currentTarget.style.opacity = '1'}
                          onMouseLeave={el => el.currentTarget.style.opacity = '0.4'}
                          title="Cancelar evento"
                        >
                          <Ban size={18} color="#f97316" />
                        </button>
                      )}
                      <button
                        onClick={(ev) => handleDelete(ev, e.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', opacity: 0.4 }}
                        onMouseEnter={el => el.currentTarget.style.opacity = '1'}
                        onMouseLeave={el => el.currentTarget.style.opacity = '0.4'}
                        title="Eliminar evento"
                      >
                        <Trash2 size={18} color="#e05252" />
                      </button>
                      {isOpen
                        ? <ChevronUp size={18} color="rgba(201,162,39,0.7)" />
                        : <Pencil size={18} color="rgba(255,255,255,0.25)" />
                      }
                    </div>
                  </div>

                  {/* Inline edit form — accordion below row */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key={`edit-${e.id}`}
                        initial={{ opacity: 0, scaleY: 0.95 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.95 }}
                        style={{ transformOrigin: 'top' }}
                      >
                        <div
                          className="glass-card"
                          style={{
                            padding: '20px 24px',
                            borderTopLeftRadius: '0',
                            borderTopRightRadius: '0',
                            marginBottom: '10px',
                            borderTop: 'none',
                          }}
                        >
                          {renderFormBody(handleEdit, 'Guardar Cambios')}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
