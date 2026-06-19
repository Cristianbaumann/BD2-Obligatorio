import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, User, Trash2, ArrowUpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { ADMIN_LINKS } from '../../constants/navLinks'

const EMPTY_FORM = { funcionario_mail: '', evento_id: '', sector_id: '' }

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
  const [sectores, setSectores] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [eliminando, setEliminando] = useState(null)

  // Promover usuario
  const [showPromover, setShowPromover] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [promoverMail, setPromoverMail] = useState('')
  const [promoviendo, setPromoviendo] = useState(false)

  async function loadFuncionarios() {
    const r = await api.get('/usuarios/funcionarios')
    setFuncionarios(r.data)
  }

  useEffect(() => {
    Promise.all([
      api.get('/usuarios/funcionarios'),
      api.get('/eventos'),
    ]).then(([f, ev]) => {
      setFuncionarios(f.data)
      setEventos(ev.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function openPromover() {
    setShowPromover(true)
    setPromoverMail('')
    try {
      const r = await api.get('/usuarios?rol=USUARIO_FINAL')
      setUsuarios(r.data)
    } catch {
      toast.error('Error al cargar usuarios')
    }
  }

  async function handlePromover(e) {
    e.preventDefault()
    if (!promoverMail) return toast.error('Seleccioná un usuario')
    setPromoviendo(true)
    try {
      await api.patch(`/usuarios/${encodeURIComponent(promoverMail)}/promover-funcionario`)
      toast.success('Usuario promovido a Funcionario')
      setShowPromover(false)
      await loadFuncionarios()
    } catch (err) {
      toast.error(extractDetail(err, 'Error al promover'))
    } finally {
      setPromoviendo(false)
    }
  }

  async function onEventoChange(evento_id) {
    setForm(p => ({ ...p, evento_id, sector_id: '' }))
    setSectores([])
    setAsignaciones([])
    if (!evento_id) return
    try {
      const [dispRes, asigRes] = await Promise.all([
        api.get(`/reportes/disponibilidad_evento/${evento_id}`),
        api.get(`/asignaciones?evento_id=${evento_id}`),
      ])
      setSectores(dispRes.data)
      setAsignaciones(asigRes.data)
    } catch {}
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!form.sector_id) return toast.error('Seleccioná un sector')
    setSubmitting(true)
    try {
      await api.post('/asignaciones', {
        funcionario_mail: form.funcionario_mail,
        evento_id: form.evento_id,
        sector_id: Number(form.sector_id),
      })
      toast.success('Funcionario asignado')
      setForm(p => ({ ...p, funcionario_mail: '', sector_id: '' }))
      const r = await api.get(`/asignaciones?evento_id=${form.evento_id}`)
      setAsignaciones(r.data)
    } catch (err) {
      toast.error(extractDetail(err, 'Error al asignar'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminar(id) {
    setEliminando(id)
    try {
      await api.delete(`/asignaciones/${id}`)
      setAsignaciones(prev => prev.filter(a => a.id !== id))
      toast.success('Asignación eliminada')
    } catch (err) {
      toast.error(extractDetail(err, 'Error al eliminar'))
    } finally {
      setEliminando(null)
    }
  }

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <Layout brand="ADMIN" links={ADMIN_LINKS}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '48px', color: '#C9A227' }}>
            Funcionarios ({funcionarios.length})
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={openPromover} className="btn-gold" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' }}>
              <ArrowUpCircle size={16} />
              Promover usuario
            </button>
            <button onClick={() => setShowAssign(s => !s)} className="btn-gold">
              {showAssign ? <X size={16} /> : <UserCheck size={16} />}
              {showAssign ? 'Cerrar' : 'Asignar sector'}
            </button>
          </div>
        </div>

        {/* Modal promover */}
        <AnimatePresence>
          {showPromover && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
              }}
              onClick={e => { if (e.target === e.currentTarget) setShowPromover(false) }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card"
                style={{ padding: '32px', width: '480px', maxWidth: '90vw' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', color: '#C9A227' }}>
                    Promover a Funcionario
                  </h3>
                  <button onClick={() => setShowPromover(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handlePromover} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Usuario
                    </label>
                    <select
                      value={promoverMail}
                      onChange={e => setPromoverMail(e.target.value)}
                      required
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Seleccioná un usuario...</option>
                      {usuarios.map(u => (
                        <option key={u.mail} value={u.mail}>
                          {u.nombre} {u.apellido} — {u.mail}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={promoviendo}
                    className="btn-gold"
                    style={{ justifyContent: 'center', padding: '13px', fontSize: '16px', opacity: promoviendo ? 0.6 : 1 }}
                  >
                    {promoviendo ? 'Promoviendo...' : 'Confirmar Promoción'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAssign && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass-card"
              style={{ padding: '28px', marginBottom: '32px' }}
            >
              <h3 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C9A227', marginBottom: '20px' }}>
                Asignar Funcionario a Sector
              </h3>

              <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: asignaciones.length > 0 ? '24px' : 0 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Funcionario</label>
                  <select value={form.funcionario_mail} onChange={set('funcionario_mail')} required className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="">Seleccioná...</option>
                    {funcionarios.map(f => (
                      <option key={f.mail || f.email} value={f.mail || f.email}>
                        {f.nombre} {f.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Evento</label>
                  <select
                    value={form.evento_id}
                    onChange={e => onEventoChange(e.target.value)}
                    required className="form-input" style={{ cursor: 'pointer' }}
                  >
                    <option value="">Seleccioná...</option>
                    {eventos.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.equipo_local} vs {ev.equipo_visitante} — {new Date(ev.fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Sector</label>
                  <select value={form.sector_id} onChange={set('sector_id')} required className="form-input" style={{ cursor: 'pointer' }} disabled={sectores.length === 0}>
                    <option value="">{sectores.length === 0 ? 'Seleccioná un evento' : 'Seleccioná...'}</option>
                    {sectores.map(s => (
                      <option key={s.sector_id} value={s.sector_id}>{s.sector_nombre}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={submitting} className="btn-gold" style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: '13px', fontSize: '18px', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Asignando...' : 'Asignar Funcionario'}
                </button>
              </form>

              {asignaciones.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Asignaciones actuales del evento
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {asignaciones.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
                      }}>
                        <div>
                          <span style={{ color: '#fff', fontSize: '13px' }}>{a.nombre} {a.apellido}</span>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginLeft: '10px' }}>— {a.sector_nombre}</span>
                        </div>
                        <button
                          onClick={() => handleEliminar(a.id)}
                          disabled={eliminando === a.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: eliminando === a.id ? 0.4 : 1, padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
              <motion.div key={f.mail || f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
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
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{f.mail || f.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {f.numero_legajo && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      Legajo: {f.numero_legajo}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                    FUNCIONARIO
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
