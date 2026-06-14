import { useEffect, useRef } from 'react'

const LINES = [
  { d: 'M 50 10 L 50 90', id: 'center-line' },
  { d: 'M 10 10 L 90 10 L 90 90 L 10 90 Z', id: 'outer' },
  { d: 'M 25 25 L 75 25 L 75 75 L 25 75 Z', id: 'inner', isDash: true },
  { d: 'M 30 10 L 30 35 L 70 35 L 70 10', id: 'box-top' },
  { d: 'M 30 90 L 30 65 L 70 65 L 70 90', id: 'box-bottom' },
  { d: 'M 38 10 L 38 22 L 62 22 L 62 10', id: 'goal-top' },
  { d: 'M 38 90 L 38 78 L 62 78 L 62 90', id: 'goal-bottom' },
]

function Line({ d, id, animate }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !animate) return
    const length = ref.current.getTotalLength()
    ref.current.style.strokeDasharray = length
    ref.current.style.strokeDashoffset = length
    ref.current.style.animation = `draw-line 1.5s ease forwards`
    ref.current.style.setProperty('--dash-length', length)
  }, [animate])

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="0.8"
    />
  )
}

export default function StadiumField({ animate = true, opacity = 1, style = {} }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        opacity,
        ...style,
      }}
    >
      <rect x="10" y="10" width="80" height="80" fill="#1a4a1a" rx="2" />
      <rect x="10" y="10" width="80" height="80" fill="none" stroke="rgba(255,255,255,0.05)" />

      {LINES.map((line) => (
        <Line key={line.id} d={line.d} id={line.id} animate={animate} />
      ))}

      <circle
        cx="50"
        cy="50"
        r="12"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="0.8"
        ref={(el) => {
          if (!el || !animate) return
          const len = 2 * Math.PI * 12
          el.style.strokeDasharray = len
          el.style.strokeDashoffset = len
          el.style.animation = 'draw-line 1.5s ease 0.5s forwards'
          el.style.setProperty('--dash-length', len)
        }}
      />

      <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="10" r="1.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="90" r="1.5" fill="rgba(255,255,255,0.5)" />

      <path
        d="M 50 40 Q 50 35 50 30"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.5"
      />
    </svg>
  )
}
