import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

function extractDetail(err) {
  const d = err.response?.data?.detail
  if (!d) return 'Error al guardar'
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(x => x.msg).join('; ')
  return 'Error al guardar'
}

export default function DatosTab({ estadio, detail, onSaved }) {
  const [form, setForm] = useState({
    nombre: '', aforo: '', dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (detail) {
      setForm({
        nombre:       detail.nombre       || '',
        aforo:        detail.aforo        || '',
        dir_pais:     detail.dir_pais     || '',
        dir_localidad:detail.dir_localidad|| '',
        dir_calle:    detail.dir_calle    || '',
        dir_numero:   detail.dir_numero   || '',
      })
    }
  }, [detail])

  const totalSectores = detail?.sectores?.reduce((s, x) => s + (x.capacidad || 0), 0) ?? 0

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nombre:        form.nombre        || undefined,
        aforo:         form.aforo         ? Number(form.aforo) : undefined,
        dir_pais:      form.dir_pais      || undefined,
        dir_localidad: form.dir_localidad || undefined,
        dir_calle:     form.dir_calle     || undefined,
        dir_numero:    form.dir_numero    || undefined,
      }
      const res = await api.put(`/estadios/${encodeURIComponent(estadio.nombre)}`, payload)
      toast.success('Estadio actualizado')
      onSaved(res.data)
    } catch (err) {
      toast.error(extractDetail(err))
    } finally {
      setSaving(false)
    }
  }

  const FIELDS = [
    { f: 'nombre',        l: 'Nombre',    t: 'text',   col: '1 / -1' },
    { f: 'dir_pais',      l: 'País',      t: 'text' },
    { f: 'dir_localidad', l: 'Ciudad',    t: 'text' },
    { f: 'dir_calle',     l: 'Calle',     t: 'text' },
    { f: 'dir_numero',    l: 'Número',    t: 'text' },
    { f: 'aforo',         l: 'Aforo',     t: 'number' },
  ]

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {FIELDS.map(({ f, l, t, col }) => (
          <div key={f} style={{ gridColumn: col }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
              {l}
            </label>
            <input
              type={t}
              value={form[f]}
              onChange={set(f)}
              className="form-input"
              style={{ width: '100%' }}
            />
            {f === 'aforo' && totalSectores > 0 && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                Suma de sectores: {totalSectores.toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-gold"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '16px', opacity: saving ? 0.6 : 1 }}
      >
        <Save size={16} />
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
