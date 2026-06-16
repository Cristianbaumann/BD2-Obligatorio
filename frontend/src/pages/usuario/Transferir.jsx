import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'

const USER_LINKS = [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas'], ['Transferir', '/transferir']]

function extractDetail(err, fallback = 'Error') {
  const d = err?.response?.data?.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return fallback
}

export default function Transferir() {
  const [entradas, setEntradas] = useState([])
  const [form, setForm] = useState({ entrada_id: '', mail_destino: '' })
  const [loading, setLoading] = useState(false)
  const [loadingEntradas, setLoadingEntradas] = useState(true)

  useEffect(() => {
    api.get('/entradas/mis-entradas')
      .then(r => setEntradas((r.data || []).filter(e => e.estado === 'ACTIVA' || !e.estado)))
      .catch(() => toast.error('Error al cargar entradas'))
      .finally(() => setLoadingEntradas(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.entrada_id || !form.mail_destino) return
    setLoading(true)
    try {
      await api.post('/transferencias', {
        entrada_id: Number(form.entrada_id),
        mail_destino: form.mail_destino,
      })
      toast.success(`Entrada transferida a ${form.mail_destino}`)
      setForm({ entrada_id: '', mail_destino: '' })
      const r = await api.get('/entradas/mis-entradas')
      setEntradas((r.data || []).filter(e => e.estado === 'ACTIVA' || !e.estado))
    } catch (err) {
      toast.error(extractDetail(err, 'Error al transferir'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="gold-glow-text" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '52px', color: '#C9A227', marginBottom: '6px' }}>
            Transferir Entrada
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '40px' }}>
            Enviá una entrada a otro fan por su email
          </p>

          <div className="glass-card" style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  Entrada a transferir
                </label>
                {loadingEntradas ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Cargando...</p>
                ) : entradas.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No tenés entradas activas</p>
                ) : (
                  <select
                    value={form.entrada_id}
                    onChange={e => setForm(f => ({ ...f, entrada_id: e.target.value }))}
                    required
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Seleccioná una entrada...</option>
                    {entradas.map(ent => (
                      <option key={ent.id} value={ent.id}>
                        {ent.equipo_local} vs {ent.equipo_visitante} — Sector {ent.sector}, Asiento {ent.asiento}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  Email del destinatario
                </label>
                <input
                  type="email"
                  value={form.mail_destino}
                  onChange={e => setForm(f => ({ ...f, mail_destino: e.target.value }))}
                  required
                  placeholder="fan@email.com"
                  className="form-input"
                />
              </div>

              <div style={{ padding: '14px 16px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)', borderRadius: '8px', fontSize: '13px', color: '#E63946', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                Esta acción no se puede deshacer. La entrada será transferida permanentemente.
              </div>

              <button
                type="submit"
                disabled={loading || entradas.length === 0}
                className="btn-gold"
                style={{
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '18px',
                  opacity: entradas.length === 0 ? 0.4 : 1,
                  cursor: loading || entradas.length === 0 ? 'not-allowed' : 'pointer',
                  background: entradas.length === 0 ? '#374151' : '#C9A227',
                  color: entradas.length === 0 ? 'rgba(255,255,255,0.3)' : '#0A0A12',
                }}
              >
                <Send size={18} />
                {loading ? 'Transfiriendo...' : 'Transferir Entrada'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
