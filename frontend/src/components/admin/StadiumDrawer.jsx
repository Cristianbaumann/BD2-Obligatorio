import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import DatosTab from './DatosTab'
import SectoresTab from './SectoresTab'

export default function StadiumDrawer({ estadio, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('datos')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchDetail = () => {
    setLoading(true)
    api.get(`/estadios/${encodeURIComponent(estadio.nombre)}`)
      .then(r => setDetail(r.data))
      .catch(() => toast.error('Error al cargar detalle del estadio'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDetail() }, [estadio.nombre])

  async function handleDeleteEstadio() {
    if (!window.confirm(`¿Eliminar el estadio "${estadio.nombre}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await api.delete(`/estadios/${encodeURIComponent(estadio.nombre)}`)
      toast.success('Estadio eliminado')
      onUpdated(null)
      onClose()
    } catch (err) {
      const d = err.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Error al eliminar estadio')
    } finally {
      setDeleting(false)
    }
  }

  const TABS = [
    { id: 'datos', label: 'Datos' },
    { id: 'sectores', label: 'Sectores' },
  ]

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 50,
          width: 'min(660px, 100vw)',
          background: 'rgba(10, 10, 18, 0.97)',
          borderLeft: '1px solid rgba(201,162,39,0.3)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 1,
          background: 'rgba(10, 10, 18, 0.97)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '32px', color: '#C9A227', letterSpacing: '1px', lineHeight: 1, marginBottom: '4px' }}>
              {estadio.nombre}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>
              {estadio.dir_localidad}, {estadio.dir_pais}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDeleteEstadio}
              disabled={deleting}
              title="Eliminar estadio"
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', borderRadius: '6px', padding: '6px 12px',
                cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600,
              }}
            >
              <Trash2 size={13} /> {deleting ? '...' : 'Eliminar'}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px', marginTop: '2px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '16px 28px 0', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px',
                fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                letterSpacing: '0.5px', textTransform: 'uppercase',
                color: activeTab === t.id ? '#C9A227' : 'rgba(255,255,255,0.35)',
                borderBottom: activeTab === t.id ? '2px solid #C9A227' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227', animation: 'football-spin 0.8s linear infinite' }} />
            </div>
          ) : activeTab === 'datos' ? (
            <DatosTab
              estadio={estadio}
              detail={detail}
              onSaved={(updated) => {
                setDetail(prev => ({ ...prev, ...updated }))
                onUpdated(updated)
              }}
            />
          ) : (
            <SectoresTab
              estadioNombre={estadio.nombre}
              detail={detail}
              onSectorChange={fetchDetail}
            />
          )}
        </div>
      </motion.div>
    </>
  )
}
