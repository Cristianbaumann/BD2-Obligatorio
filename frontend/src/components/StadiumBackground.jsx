import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 4.7) % 90}%`,
  size: 2 + (i % 3),
  duration: 8 + (i % 7),
  delay: (i * 0.4) % 6,
}))

const SPOTLIGHTS = [
  { origin: '0% 0%',   rotate: 0 },
  { origin: '100% 0%', rotate: 90 },
  { origin: '100% 100%', rotate: 180 },
  { origin: '0% 100%', rotate: 270 },
]

export default function StadiumBackground({ children }) {
  const prefersReduced = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A12',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {SPOTLIGHTS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from ${s.rotate}deg at ${s.origin}, transparent 0deg, rgba(201,162,39,0.08) 20deg, transparent 60deg)`,
            animation: prefersReduced ? 'none' : `spotlight-rotate ${20 + i * 5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
            transformOrigin: s.origin,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,162,39,0.04) 0%, transparent 70%)',
          animation: prefersReduced ? 'none' : 'pulse-ring 4s ease-in-out infinite',
        }}
      />

      {!prefersReduced && PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: '#C9A227',
            opacity: 0,
            animation: `particle-rise ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}

      {children}
    </div>
  )
}
