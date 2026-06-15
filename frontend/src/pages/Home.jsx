import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, ChevronRight, Calendar, MapPin } from 'lucide-react'
import StadiumBackground from '../components/StadiumBackground'
import StadiumField from '../components/StadiumField'
import Spotlight from '../components/ui/Spotlight'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const WC_HISTORY = [
  { year: '1930', host: 'Uruguay', champion: 'Uruguay', runner: 'Argentina', goals: '70 goles en 18 partidos' },
  { year: '1970', host: 'México', champion: 'Brasil', runner: 'Italia', goals: 'El Brasil de Pelé, Rivelino y Tostão' },
  { year: '1986', host: 'México', champion: 'Argentina', runner: 'Alemania', goals: 'La mano de Dios y el gol del siglo' },
  { year: '1994', host: 'Estados Unidos', champion: 'Brasil', runner: 'Italia', goals: 'Primer Mundial decidido en penales' },
  { year: '2002', host: 'Corea · Japón', champion: 'Brasil', runner: 'Alemania', goals: 'Primer campeón del mundo asiático' },
  { year: '2022', host: 'Qatar', champion: 'Argentina', runner: 'Francia', goals: 'La final más épica de la historia' },
]

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(14,26,46,0.5)',
      border: '1px solid rgba(26,58,92,0.3)',
      borderRadius: '8px',
      padding: '20px 24px',
      height: '120px',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }} />
  )
}

function ResultCard({ evento, index }) {
  const fecha = new Date(evento.fecha)
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        background: 'rgba(14,26,46,0.8)',
        border: '1px solid rgba(26,58,92,0.5)',
        borderRadius: '8px',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.5px',
        }}>
          {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          background: 'rgba(255,255,255,0.05)',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          Finalizado
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '15px',
          color: '#fff',
          textAlign: 'right',
          letterSpacing: '0.5px',
        }}>
          {evento.equipo_local}
        </span>
        <span style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '12px',
          color: 'rgba(201,162,39,0.5)',
          letterSpacing: '2px',
        }}>
          VS
        </span>
        <span style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '15px',
          color: '#fff',
          letterSpacing: '0.5px',
        }}>
          {evento.equipo_visitante}
        </span>
      </div>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.22)',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <MapPin size={10} /> {evento.estadio}
      </p>
    </motion.div>
  )
}

function UpcomingCard({ evento, index, onNavigate }) {
  const fecha = new Date(evento.fecha)
  const [hovered, setHovered] = useState(false)
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate('/eventos')}
      style={{
        background: hovered ? 'rgba(26,58,92,0.5)' : 'rgba(14,26,46,0.8)',
        border: `1px solid ${hovered ? 'rgba(201,162,39,0.35)' : 'rgba(26,58,92,0.5)'}`,
        borderRadius: '8px',
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 24px rgba(201,162,39,0.1)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
          <Calendar size={11} />
          {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }).toUpperCase()} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
        </div>
        {evento.precio_minimo && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: '#C9A227',
            fontWeight: 600,
          }}>
            desde ${evento.precio_minimo.toLocaleString()}
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '17px', color: '#fff', textAlign: 'right', letterSpacing: '0.5px' }}>
          {evento.equipo_local}
        </span>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '13px', color: 'rgba(201,162,39,0.6)', letterSpacing: '2px' }}>
          VS
        </span>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '17px', color: '#fff', letterSpacing: '0.5px' }}>
          {evento.equipo_visitante}
        </span>
      </div>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.25)',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <MapPin size={10} /> {evento.estadio}
      </p>
    </motion.div>
  )
}

function HistoryCard({ entry, index }) {
  const [hovered, setHovered] = useState(false)
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(14,26,46,0.75)',
        border: `1px solid ${hovered ? 'rgba(201,162,39,0.45)' : 'rgba(26,58,92,0.45)'}`,
        borderRadius: '8px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'default',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 8px 32px rgba(201,162,39,0.12)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute',
        right: '-10px',
        top: '-8px',
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '100px',
        lineHeight: 1,
        color: hovered ? 'rgba(201,162,39,0.07)' : 'rgba(201,162,39,0.04)',
        transition: 'color 0.3s',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {entry.year}
      </span>

      <span style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '42px',
        lineHeight: 1,
        color: hovered ? '#C9A227' : 'rgba(201,162,39,0.5)',
        transition: 'color 0.2s',
        letterSpacing: '-0.5px',
      }}>
        {entry.year}
      </span>

      <div>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          margin: '0 0 6px 0',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          {entry.host}
        </p>
        <p style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '22px',
          color: '#fff',
          margin: '0 0 2px 0',
          letterSpacing: '1px',
        }}>
          {entry.champion}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          margin: '0 0 10px 0',
        }}>
          Final vs {entry.runner}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: 'rgba(201,162,39,0.5)',
          margin: 0,
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {entry.goals}
        </p>
      </div>
    </motion.div>
  )
}

function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color: '#C9A227',
        margin: '0 0 8px 0',
        fontWeight: 600,
      }}>
        {label}
      </p>
      <h2 style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: 'clamp(32px, 5vw, 52px)',
        color: '#fff',
        lineHeight: 0.95,
        margin: '0 0 10px 0',
        letterSpacing: '1px',
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const prefersReduced = useReducedMotion()
  const [eventos, setEventos] = useState([])
  const [loadingEventos, setLoadingEventos] = useState(true)

  useEffect(() => {
    api.get('/eventos')
      .then(r => setEventos(r.data))
      .catch(() => {})
      .finally(() => setLoadingEventos(false))
  }, [])

  const now = new Date()
  const pastEventos = eventos
    .filter(e => new Date(e.fecha) < now)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 6)

  const upcomingEventos = eventos
    .filter(e => new Date(e.fecha) >= now)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 3)

  const heroFade = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7 } }

  return (
    <div style={{ background: '#0A0A12', minHeight: '100vh' }}>

      {/* HERO */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <StadiumBackground />
        <Spotlight />

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 70vw)',
          height: 'min(600px, 70vw)',
          opacity: 0.06,
          pointerEvents: 'none',
          zIndex: 1,
        }} aria-hidden="true">
          <StadiumField animate />
        </div>

        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0',
        }}>
          <motion.div {...heroFade}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#C9A227',
              margin: '0 0 16px 0',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Trophy size={12} />
              FIFA World Cup 2026 — Official Ticketing
            </p>

            <h1 style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: 'clamp(72px, 12vw, 160px)',
              color: '#fff',
              lineHeight: 0.88,
              margin: '0 0 8px 0',
              letterSpacing: '2px',
            }}>
              Viví el
            </h1>
            <h1 style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: 'clamp(72px, 12vw, 160px)',
              color: '#C9A227',
              lineHeight: 0.88,
              margin: '0 0 32px 0',
              letterSpacing: '2px',
            }}>
              Mundial
            </h1>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              maxWidth: '480px',
              margin: '0 0 40px 0',
            }}>
              Conseguí tus entradas y viví la experiencia única del Mundial en los estadios más icónicos del mundo.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/eventos')}
                style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '17px',
                  letterSpacing: '2px',
                  padding: '14px 36px',
                  background: '#C9A227',
                  color: '#0A0A12',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'transform 0.14s, box-shadow 0.14s, background 0.14s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E4BC3A'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(201,162,39,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#C9A227'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Ver Eventos <ChevronRight size={16} />
              </button>

              {!token && (
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    fontFamily: 'Bebas Neue, cursive',
                    fontSize: '17px',
                    letterSpacing: '2px',
                    padding: '14px 36px',
                    background: 'transparent',
                    color: '#C9A227',
                    border: '1px solid rgba(201,162,39,0.5)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.14s, border-color 0.14s, transform 0.14s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(201,162,39,0.1)'
                    e.currentTarget.style.borderColor = '#C9A227'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.5)'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={prefersReduced ? {} : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div style={{
            width: '1px',
            height: '48px',
            background: 'linear-gradient(to bottom, rgba(201,162,39,0.6), transparent)',
          }} />
        </motion.div>
      </section>

      {/* PAST RESULTS */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 40px',
      }}>
        <SectionHeader
          label="Resultados"
          title="Partidos Jugados"
          subtitle={pastEventos.length > 0 ? `${pastEventos.length} encuentros finalizados` : undefined}
        />

        {loadingEventos ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : pastEventos.length === 0 ? (
          <div style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          }}>
            No hay partidos anteriores todavía.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
          }}>
            {pastEventos.map((e, i) => (
              <ResultCard key={e.id} evento={e} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* UPCOMING MATCHES */}
      {!loadingEventos && upcomingEventos.length > 0 && (
        <section style={{
          background: 'rgba(10,10,18,0.8)',
          borderTop: '1px solid rgba(26,58,92,0.4)',
          borderBottom: '1px solid rgba(26,58,92,0.4)',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '80px 40px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <SectionHeader
                label="Próximos"
                title="Próximos Partidos"
              />
              <button
                onClick={() => navigate('/eventos')}
                style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '14px',
                  letterSpacing: '1.5px',
                  color: '#C9A227',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0',
                  marginBottom: '42px',
                }}
              >
                Ver todos <ChevronRight size={14} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '14px',
            }}>
              {upcomingEventos.map((e, i) => (
                <UpcomingCard key={e.id} evento={e} index={i} onNavigate={navigate} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WORLD CUP HISTORY */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 40px',
      }}>
        <SectionHeader
          label="Historia"
          title="Mundiales Inolvidables"
          subtitle="Ediciones que marcaron la historia del fútbol"
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {WC_HISTORY.map((entry, i) => (
            <HistoryCard key={entry.year} entry={entry} index={i} />
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{
        background: 'linear-gradient(180deg, rgba(14,26,46,0.3) 0%, rgba(10,10,18,0.95) 100%)',
        borderTop: '1px solid rgba(26,58,92,0.3)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
        }}>
          <p style={{
            fontFamily: 'Bebas Neue, cursive',
            fontSize: 'clamp(36px, 5vw, 60px)',
            color: '#fff',
            margin: 0,
            lineHeight: 1,
          }}>
            ¿Listo para el <span style={{ color: '#C9A227' }}>Mundial?</span>
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            color: 'rgba(255,255,255,0.4)',
            margin: 0,
            maxWidth: '400px',
          }}>
            Todos los partidos. Todos los estadios. Una sola plataforma.
          </p>
          <button
            onClick={() => navigate('/eventos')}
            style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: '17px',
              letterSpacing: '2px',
              padding: '16px 48px',
              background: '#C9A227',
              color: '#0A0A12',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'transform 0.14s, box-shadow 0.14s, background 0.14s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E4BC3A'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,162,39,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#C9A227'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Ver todos los eventos <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* NAV BAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        background: 'rgba(10,10,18,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,162,39,0.1)',
      }}>
        <span style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '20px',
          color: '#C9A227',
          letterSpacing: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Trophy size={17} /> Mundial 2026
        </span>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/eventos')}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'color 0.14s, background 0.14s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'none' }}
          >
            Eventos
          </button>

          {token ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '14px',
                letterSpacing: '1.5px',
                padding: '8px 20px',
                background: 'rgba(201,162,39,0.12)',
                color: '#C9A227',
                border: '1px solid rgba(201,162,39,0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.12)' }}
            >
              Mi Cuenta
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '14px',
                letterSpacing: '1.5px',
                padding: '8px 20px',
                background: '#C9A227',
                color: '#0A0A12',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E4BC3A' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A227' }}
            >
              Ingresar
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}
