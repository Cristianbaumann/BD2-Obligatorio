import { useState, useMemo } from 'react'
import { Plus, Trash2, Users, Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import StadiumBowl from './StadiumBowl'

function extractDetail(err) {
  const d = err.response?.data?.detail
  if (!d) return 'Error'
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return 'Error'
}

export default function SectoresTab({ estadioNombre, detail, onSectorChange }) {
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ nombre: '', capacidad: '' })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingCap, setEditingCap] = useState(false)
  const [editCapVal, setEditCapVal] = useState('')
  const [savingCap, setSavingCap] = useState(false)

  const sectores = detail?.sectores ?? []
  const selected = useMemo(() => sectores.find(s => s.id === selectedId) ?? null, [sectores, selectedId])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.nombre || !form.capacidad) return
    setCreating(true)
    try {
      await api.post(`/estadios/${encodeURIComponent(estadioNombre)}/sectores`, {
        nombre: form.nombre,
        capacidad: Number(form.capacidad),
      })
      toast.success('Sector creado')
      setForm({ nombre: '', capacidad: '' })
      onSectorChange()
    } catch (err) {
      toast.error(extractDetail(err))
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await api.delete(`/estadios/${encodeURIComponent(estadioNombre)}/sectores/${selected.id}`)
      toast.success(`Sector "${selected.nombre}" eliminado`)
      setSelectedId(null)
      onSectorChange()
    } catch (err) {
      toast.error(extractDetail(err))
    } finally {
      setDeleting(false)
    }
  }

  function startEditCap() {
    setEditCapVal(String(selected.capacidad))
    setEditingCap(true)
  }

  async function handleSaveCap() {
    const cap = Number(editCapVal)
    if (!cap || cap <= 0) { toast.error('Capacidad inválida'); return }
    setSavingCap(true)
    try {
      await api.put(`/estadios/${encodeURIComponent(estadioNombre)}/sectores/${selected.id}`, { capacidad: cap })
      toast.success('Capacidad actualizada')
      setEditingCap(false)
      onSectorChange()
    } catch (err) {
      toast.error(extractDetail(err))
    } finally {
      setSavingCap(false)
    }
  }

  return (
    <div>
      {/* Bowl + side panel */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
          <StadiumBowl
            sectores={sectores}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div style={{ flex: '0 0 180px', minWidth: '160px' }}>
          {selected ? (
            <div className="glass-card" style={{ padding: '18px' }}>
              <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C9A227', letterSpacing: '1px', marginBottom: '10px' }}>
                {selected.nombre}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Users size={13} color="#C9A227" />
                {editingCap ? (
                  <input
                    type="number" min="1" value={editCapVal}
                    onChange={e => setEditCapVal(e.target.value)}
                    autoFocus
                    style={{
                      width: '70px', padding: '3px 6px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,162,39,0.4)',
                      borderRadius: '4px', color: '#C9A227', fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '13px', outline: 'none',
                    }}
                  />
                ) : (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#C9A227', fontWeight: 700 }}>
                    {(selected.capacidad || 0).toLocaleString()}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>asientos</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {editingCap ? (
                  <button
                    onClick={handleSaveCap} disabled={savingCap}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22c55e', borderRadius: '6px', padding: '7px',
                      fontSize: '12px', fontWeight: 600, cursor: savingCap ? 'not-allowed' : 'pointer', opacity: savingCap ? 0.6 : 1,
                    }}
                  >
                    <Check size={12} /> {savingCap ? '...' : 'Guardar'}
                  </button>
                ) : (
                  <button
                    onClick={startEditCap}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)',
                      color: '#C9A227', borderRadius: '6px', padding: '7px',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Pencil size={12} /> Editar
                  </button>
                )}
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', borderRadius: '6px', padding: '8px 14px',
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
                  cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
                  width: '100%', justifyContent: 'center',
                }}
              >
                <Trash2 size={13} />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', letterSpacing: '0.5px' }}>
              {sectores.length === 0 ? 'Sin sectores' : 'Tocá un sector del bowl para ver sus datos'}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '24px' }} />

      {/* Create form */}
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Nuevo sector
      </p>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', letterSpacing: '0.5px' }}>Nombre</label>
          <input
            type="text" value={form.nombre} onChange={set('nombre')}
            placeholder="VIP" className="form-input" style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', letterSpacing: '0.5px' }}>Capacidad</label>
          <input
            type="number" value={form.capacidad} onChange={set('capacidad')}
            placeholder="5000" className="form-input" style={{ width: '100%' }}
          />
        </div>
        <button
          type="submit"
          disabled={creating || !form.nombre || !form.capacidad}
          className="btn-gold"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', fontSize: '14px',
            opacity: creating || !form.nombre || !form.capacidad ? 0.5 : 1,
            cursor: creating ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={15} />
          {creating ? 'Creando...' : 'Crear'}
        </button>
      </form>
    </div>
  )
}
