import { useState, useEffect, useRef } from 'react'
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

const FLAG_ISO = {
  'México': 'mx', 'Sudáfrica': 'za', 'Brasil': 'br', 'Marruecos': 'ma',
  'Estados Unidos': 'us', 'Paraguay': 'py', 'Países Bajos': 'nl', 'Japón': 'jp',
  'Canadá': 'ca', 'Bosnia y Herzegovina': 'ba', 'Argentina': 'ar', 'Ecuador': 'ec',
  'Corea del Sur': 'kr', 'República Checa': 'cz', 'Alemania': 'de', 'Francia': 'fr',
  'España': 'es', 'Inglaterra': 'gb-eng', 'Portugal': 'pt', 'Croacia': 'hr',
  'Uruguay': 'uy', 'Colombia': 'co', 'Suiza': 'ch', 'Senegal': 'sn',
  'Australia': 'au', 'Bélgica': 'be', 'Italia': 'it', 'Costa Rica': 'cr',
}
function flagUrl(nombre) {
  const iso = FLAG_ISO[nombre]
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null
}

function EventCard3D({ evento, onClick }) {
  const fecha = new Date(evento.fecha)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        width: '170px',
        height: '240px',
        background: hovered ? 'rgba(22,22,35,0.97)' : 'rgba(10,10,22,0.92)',
        border: `1.5px solid ${hovered ? '#C9A227' : 'rgba(201,162,39,0.22)'}`,
        borderRadius: '12px',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: hovered
          ? '0 0 48px rgba(201,162,39,0.22), 0 24px 64px rgba(0,0,0,0.7)'
          : '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#C9A227', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Calendar size={8} />
          {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }).toUpperCase()}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
          {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
        <div style={{ textAlign: 'center' }}>
          {flagUrl(evento.equipo_local)
            ? <img src={flagUrl(evento.equipo_local)} alt={evento.equipo_local} style={{ width: '36px', height: 'auto', borderRadius: '3px', display: 'inline-block' }} />
            : <span style={{ fontSize: '22px' }}>🏳</span>
          }
          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: '#fff', margin: '4px 0 0', letterSpacing: '1px', lineHeight: 1.1 }}>
            {evento.equipo_local}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', margin: '2px 0' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.3))' }} />
          <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '12px', color: 'rgba(201,162,39,0.65)', letterSpacing: '2px' }}>VS</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, rgba(201,162,39,0.3))' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          {flagUrl(evento.equipo_visitante)
            ? <img src={flagUrl(evento.equipo_visitante)} alt={evento.equipo_visitante} style={{ width: '36px', height: 'auto', borderRadius: '3px', display: 'inline-block' }} />
            : <span style={{ fontSize: '22px' }}>🏳</span>
          }
          <p style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: '#fff', margin: '4px 0 0', letterSpacing: '1px', lineHeight: 1.1 }}>
            {evento.equipo_visitante}
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(201,162,39,0.1)', paddingTop: '10px', marginTop: '10px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: 'rgba(255,255,255,0.28)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <MapPin size={8} /> {evento.estadio}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {evento.precio_minimo != null ? (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#C9A227', fontWeight: 700 }}>
              ${evento.precio_minimo.toLocaleString()}
            </span>
          ) : <span />}
          <span style={{
            fontFamily: 'Bebas Neue, cursive', fontSize: '10px', letterSpacing: '1px',
            color: hovered ? '#0A0A12' : '#C9A227',
            background: hovered ? '#C9A227' : 'rgba(201,162,39,0.1)',
            border: '1px solid rgba(201,162,39,0.35)',
            borderRadius: '4px', padding: '3px 8px',
            transition: 'all 0.15s', pointerEvents: 'none',
          }}>
            Comprar
          </span>
        </div>
      </div>
    </div>
  )
}

export default function CircularGallery({ events, onSelect }) {
  // All rotation state lives in refs — no stale closures, single RAF loop
  const rotRef = useRef(0)
  const velRef = useRef(0)
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)
  const rafRef = useRef(null)
  const containerRef = useRef(null)
  // Only used to trigger re-render for the transform
  const [tick, setTick] = useState(0)

  const n = Math.max(events.length, 1)
  const radius = Math.max(260, n * 42)
  const anglePerItem = 360 / n

  // Single RAF loop — runs once, never restarts
  useEffect(() => {
    const loop = () => {
      if (!draggingRef.current) {
        if (Math.abs(velRef.current) > 0.4) {
          velRef.current *= 0.92
        } else {
          velRef.current = 0.15 // auto-rotate ~9°/s
        }
        rotRef.current += velRef.current
        setTick(t => t + 1) // trigger re-render
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // runs ONCE — refs handle all mutable state

  function onMouseDown(e) {
    draggingRef.current = true
    lastXRef.current = e.clientX
    velRef.current = 0
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (!draggingRef.current) return
    const dx = e.clientX - lastXRef.current
    velRef.current = dx * 0.4
    rotRef.current += dx * 0.4
    setTick(t => t + 1)
    lastXRef.current = e.clientX
  }

  function stopDrag() { draggingRef.current = false }

  function onTouchStart(e) {
    draggingRef.current = true
    lastXRef.current = e.touches[0].clientX
    velRef.current = 0
  }

  function onTouchMove(e) {
    if (!draggingRef.current) return
    const dx = e.touches[0].clientX - lastXRef.current
    velRef.current = dx * 0.4
    rotRef.current += dx * 0.4
    setTick(t => t + 1)
    lastXRef.current = e.touches[0].clientX
  }

  function bump(dir) { velRef.current = dir * 14 }

  const rot = rotRef.current

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', userSelect: 'none' }}>

      {/* Arrows */}
      <button
        onClick={() => bump(-1)}
        aria-label="Anterior"
        style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
          color: '#C9A227', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.22)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.1)' }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => bump(1)}
        aria-label="Siguiente"
        style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
          color: '#C9A227', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.22)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.1)' }}
      >
        <ChevronRight size={18} />
      </button>

      <p style={{
        position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.18)',
        letterSpacing: '1px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
      }}>
        arrastrá para rotar · {events.length} partidos
      </p>

      {/* 3D scene */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
        style={{ width: '100%', height: '100%', perspective: '1200px', cursor: 'grab' }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rot}deg)`,
        }}>
          {events.map((evento, i) => {
            const itemAngle = i * anglePerItem
            // Compute how "front-facing" this card is for opacity
            const abs = ((itemAngle + rot) % 360 + 360) % 360
            const front = abs > 180 ? 360 - abs : abs
            const opacity = Math.max(0.28, 1 - front / 180)

            return (
              <div
                key={evento.id}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-85px',
                  marginTop: '-120px',
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px) rotateY(${-itemAngle - rot}deg)`,
                  opacity,
                  transition: 'opacity 0.15s',
                }}
              >
                <EventCard3D evento={evento} onClick={() => onSelect(evento.id)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
