import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, ChevronRight } from 'lucide-react'
import StadiumBackground from '../components/StadiumBackground'
import Spotlight from '../components/ui/Spotlight'
import Navbar from '../components/Navbar'
import CircularGallery from '../components/CircularGallery'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import useEventosStore from '../store/eventosStore'

const WC_HISTORY = [
  {
    year: '1930',
    host: 'Uruguay',
    champion: 'Uruguay',
    runner: 'Argentina',
    story: 'Primer Copa del Mundo de la historia. Uruguay venció a Argentina 4-2 en el Estadio Centenario de Montevideo ante 68.000 espectadores.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/1930_FIFA_World_Cup.jpg/640px-1930_FIFA_World_Cup.jpg',
    gradient: 'linear-gradient(135deg, #001B8A 0%, #71A7DB 100%)',
  },
  {
    year: '1970',
    host: 'México',
    champion: 'Brasil',
    runner: 'Italia',
    story: 'El Brasil de Pelé, Tostão y Rivelino se consagró campeón por tercera vez ganando el trofeo Jules Rimet de manera permanente.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pelé_con_la_copa_del_mundo.jpg/640px-Pelé_con_la_copa_del_mundo.jpg',
    gradient: 'linear-gradient(135deg, #009C3B 0%, #FFDF00 100%)',
  },
  {
    year: '1986',
    host: 'México',
    champion: 'Argentina',
    runner: 'Alemania',
    story: 'Diego Maradona llevó a Argentina a la gloria con el "Gol del Siglo" contra Inglaterra. Una de las actuaciones individuales más grandes del deporte.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Maradona_-_Argetina_vs_England_1986.jpg/640px-Maradona_-_Argetina_vs_England_1986.jpg',
    gradient: 'linear-gradient(135deg, #74ACDF 0%, #F6B40E 100%)',
  },
  {
    year: '1994',
    host: 'Estados Unidos',
    champion: 'Brasil',
    runner: 'Italia',
    story: 'Primera final decidida en penales. Brasil ganó su cuarto título. Roberto Baggio lanzó el último penal al cielo del Rose Bowl.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/1994_FIFA_World_Cup.jpg/640px-1994_FIFA_World_Cup.jpg',
    gradient: 'linear-gradient(135deg, #3C3B6E 0%, #B22234 100%)',
  },
  {
    year: '2002',
    host: 'Corea · Japón',
    champion: 'Brasil',
    runner: 'Alemania',
    story: 'Primer Mundial en Asia. Ronaldo Nazário se reivindicó marcando dos goles en la final y ganando la Bota de Oro del torneo.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/2002_FIFA_World_Cup_Official_Poster.jpg/640px-2002_FIFA_World_Cup_Official_Poster.jpg',
    gradient: 'linear-gradient(135deg, #C60C30 0%, #003580 100%)',
  },
  {
    year: '2022',
    host: 'Qatar',
    champion: 'Argentina',
    runner: 'Francia',
    story: 'Lionel Messi consiguió el único título que le faltaba en la final más épica de la historia. Argentina ganó en penales después de remontar 2-0.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/2022_FIFA_World_Cup_Argentina_celebrate.jpg/640px-2022_FIFA_World_Cup_Argentina_celebrate.jpg',
    gradient: 'linear-gradient(135deg, #8D1B3D 0%, #1A1A2E 100%)',
  },
]

function WCImage({ src, alt, gradient }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '8px',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Trophy size={32} color="rgba(255,255,255,0.3)" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        aspectRatio: '16/9',
        objectFit: 'cover',
        borderRadius: '8px',
        display: 'block',
      }}
    />
  )
}

function TimelineEntry({ entry, index }) {
  const prefersReduced = useReducedMotion()
  const isRight = index % 2 !== 0

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, x: isRight ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 48px 1fr',
        gap: '0',
        alignItems: 'center',
        marginBottom: '64px',
      }}
    >
      {/* Left slot */}
      <div style={{
        paddingRight: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isRight ? 'flex-start' : 'flex-end',
        gap: '12px',
      }}>
        {!isRight ? (
          <ImageAndText entry={entry} align="right" />
        ) : (
          <TextOnly entry={entry} align="left" />
        )}
      </div>

      {/* Center dot + line */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
        position: 'relative',
        alignSelf: 'stretch',
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#C9A227',
          boxShadow: '0 0 16px rgba(201,162,39,0.6)',
          flexShrink: 0,
          zIndex: 1,
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
        }} />
      </div>

      {/* Right slot */}
      <div style={{
        paddingLeft: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isRight ? 'flex-start' : 'flex-end',
        gap: '12px',
      }}>
        {isRight ? (
          <ImageAndText entry={entry} align="left" />
        ) : (
          <TextOnly entry={entry} align="right" />
        )}
      </div>
    </motion.div>
  )
}

function ImageAndText({ entry, align }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
    }}>
      <WCImage src={entry.img} alt={`Mundial ${entry.year} - ${entry.host}`} gradient={entry.gradient} />
      <div style={{ marginTop: '14px' }}>
        <p style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '64px',
          lineHeight: 0.85,
          color: '#C9A227',
          margin: '0 0 6px 0',
          letterSpacing: '-1px',
          textAlign: align,
        }}>
          {entry.year}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          letterSpacing: '2px',
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          margin: '0 0 6px 0',
          textAlign: align,
        }}>
          {entry.host}
        </p>
        <p style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '24px',
          color: '#fff',
          margin: '0 0 4px 0',
          letterSpacing: '1px',
          textAlign: align,
        }}>
          {entry.champion}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.28)',
          margin: '0 0 10px 0',
          textAlign: align,
        }}>
          Final vs {entry.runner}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.55,
          margin: 0,
          textAlign: align,
        }}>
          {entry.story}
        </p>
      </div>
    </div>
  )
}

function TextOnly({ entry, align }) {
  return (
    <div style={{
      maxWidth: '320px',
      alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
    }}>
      <p style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '72px',
        lineHeight: 0.85,
        color: 'rgba(201,162,39,0.15)',
        margin: '0 0 6px 0',
        letterSpacing: '-2px',
        textAlign: align,
      }}>
        {entry.year}
      </p>
      <p style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '20px',
        color: 'rgba(255,255,255,0.6)',
        margin: '0 0 4px 0',
        letterSpacing: '0.5px',
        textAlign: align,
      }}>
        {entry.champion}
      </p>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.25)',
        textAlign: align,
      }}>
        {entry.host}
      </p>
    </div>
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
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
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
  const setEventosGlobal = useEventosStore(s => s.setEventos)

  useEffect(() => {
    api.get('/eventos')
      .then(r => { setEventos(r.data); setEventosGlobal(r.data) })
      .catch(err => console.error('eventos load failed:', err))
      .finally(() => setLoadingEventos(false))
  }, [])

  const upcomingEventos = [...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  function handleBuy(eventoId) {
    if (!token) navigate('/login', { state: { from: { pathname: `/comprar/${eventoId}` } } })
    else navigate(`/comprar/${eventoId}`)
  }

  const heroFade = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7 } }

  return (
    <div style={{ background: '#0A0A12', minHeight: '100vh' }}>
      <Navbar links={token ? [['Eventos', '/eventos'], ['Mis Entradas', '/mis-entradas']] : [['Eventos', '/eventos']]} />

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
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
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

        <motion.div
          animate={prefersReduced ? {} : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
          }}
        >
          <div style={{
            width: '1px',
            height: '48px',
            background: 'linear-gradient(to bottom, rgba(201,162,39,0.6), transparent)',
          }} />
        </motion.div>
      </section>

      {/* 3D EVENTS GALLERY */}
      <section style={{ padding: '80px 0 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <SectionHeader
                label="Agenda"
                title="Próximos Partidos"
                subtitle={!loadingEventos ? `${upcomingEventos.length} partido${upcomingEventos.length !== 1 ? 's' : ''} disponible${upcomingEventos.length !== 1 ? 's' : ''}` : undefined}
              />
            </div>
            <button
              onClick={() => navigate('/eventos')}
              style={{
                fontFamily: 'Bebas Neue, cursive', fontSize: '13px', letterSpacing: '1.5px',
                color: '#C9A227', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', padding: '0', marginBottom: '42px',
              }}
            >
              Ver todos <ChevronRight size={12} />
            </button>
          </div>

          {loadingEventos ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                border: '3px solid rgba(201,162,39,0.2)', borderTopColor: '#C9A227',
                animation: 'football-spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <CircularGallery events={upcomingEventos} onSelect={handleBuy} />
          )}
        </section>

      {/* WC HISTORY TIMELINE */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <SectionHeader
            label="Historia"
            title="Mundiales Inolvidables"
            subtitle="Las ediciones que escribieron la historia del fútbol"
          />
        </div>

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '24px 40px 0' }}>
          {/* Center connecting line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,162,39,0.35) 5%, rgba(201,162,39,0.35) 95%, transparent 100%)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />

          {WC_HISTORY.map((entry, i) => (
            <TimelineEntry key={entry.year} entry={entry} index={i} />
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

    </div>
  )
}
