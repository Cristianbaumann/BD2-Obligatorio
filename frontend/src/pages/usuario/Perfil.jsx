import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Mail, User, MapPin, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/authStore'

import { USER_LINKS } from '../../constants/navLinks'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#fff' }}>{value}</span>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div style={{ color: '#C9A227' }}>{icon}</div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function MockEmail({ mail, onVerificar, loading }) {
  return (
    <div style={{
      border: '1px solid rgba(201,162,39,0.25)',
      borderRadius: '12px',
      overflow: 'hidden',
      fontFamily: 'monospace',
    }}>
      <div style={{
        background: 'rgba(201,162,39,0.08)',
        borderBottom: '1px solid rgba(201,162,39,0.15)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>De: </span>
          verificacion@mundial2026.com
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>Para: </span>
          {mail}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>Asunto: </span>
          Verificá tu identidad — FIFA World Cup 2026
        </div>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
          Hola, gracias por registrarte en el sistema de entradas del Mundial 2026.<br />
          Para completar tu registro y poder comprar entradas, necesitamos verificar tu identidad.<br />
          Hacé clic en el botón a continuación para confirmar tu cuenta.
        </p>
        <div>
          <button
            onClick={onVerificar}
            disabled={loading}
            style={{
              padding: '10px 28px',
              borderRadius: '8px',
              background: loading ? 'rgba(201,162,39,0.3)' : 'linear-gradient(135deg, #B8901F 0%, #E8C84A 50%, #B8901F 100%)',
              border: 'none',
              color: '#0A0A12',
              fontFamily: 'Bebas Neue, cursive',
              fontSize: '14px',
              letterSpacing: '2px',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Verificando...' : 'Verificar mi identidad'}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Si no creaste esta cuenta, ignorá este mensaje.
        </p>
      </div>
    </div>
  )
}

export default function Perfil() {
  const { user, estado_verificacion, setVerificado } = useAuthStore()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    api.get('/usuarios/me')
      .then(r => setPerfil(r.data))
      .catch(() => toast.error('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  async function handleVerificar() {
    setVerificando(true)
    try {
      await api.patch(`/usuarios/${user?.mail}/verificar`)
      setVerificado()
      toast.success('Identidad verificada. Ya podés comprar entradas.')
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al verificar'
      toast.error(detail)
    } finally {
      setVerificando(false)
    }
  }

  const pendiente = estado_verificacion === 'PENDIENTE' || estado_verificacion == null

  return (
    <Layout links={USER_LINKS}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <AnimatePresence>
          {pendiente && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{
                background: 'rgba(201,162,39,0.07)',
                border: '1px solid rgba(201,162,39,0.35)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertTriangle size={18} color="#C9A227" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#C9A227', fontSize: '13px' }}>
                  Identidad no verificada
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Necesitás verificar tu identidad para poder comprar entradas. Revisá el correo simulado a continuación.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {estado_verificacion === 'VERIFICADO' && (
          <div style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: '13px', color: '#22c55e' }}>Identidad verificada — podés comprar entradas</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Cargando...</div>
        ) : perfil && (
          <>
            {perfil.saldo > 0 && (
              <div style={{
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '12px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '13px', color: '#22c55e' }}>Saldo disponible por evento(s) cancelado(s)</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', color: '#22c55e', fontWeight: 700 }}>
                  ${perfil.saldo.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <Section icon={<User size={15} />} title="Datos personales">
              <InfoRow label="Nombre" value={perfil.nombre} />
              <InfoRow label="Apellido" value={perfil.apellido} />
              <InfoRow label="Email" value={perfil.mail} />
            </Section>

            <Section icon={<FileText size={15} />} title="Documento">
              <InfoRow label="País emisor" value={perfil.doc_pais} />
              <InfoRow label="Tipo" value={perfil.doc_tipo} />
              <InfoRow label="Número" value={perfil.doc_numero} />
            </Section>

            <Section icon={<MapPin size={15} />} title="Dirección">
              <InfoRow label="País" value={perfil.dir_pais} />
              <InfoRow label="Localidad" value={perfil.dir_localidad} />
              <InfoRow label="Calle" value={`${perfil.dir_calle} ${perfil.dir_numero}`} />
              <InfoRow label="Código postal" value={perfil.dir_codigo_postal} />
            </Section>
          </>
        )}

        {pendiente && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={15} color="#C9A227" />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Correo de verificación simulado
              </span>
            </div>
            <MockEmail mail={user?.mail} onVerificar={handleVerificar} loading={verificando} />
          </div>
        )}

      </div>
    </Layout>
  )
}
