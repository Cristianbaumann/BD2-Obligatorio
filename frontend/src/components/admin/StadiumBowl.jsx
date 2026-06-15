import React from 'react'

const cx = 230, cy = 160, rx = 210, ry = 145
const gap = 0.04

function ringEdge(t, a0, a1, steps = 8) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps)
    pts.push([cx + rx * t * Math.cos(a), cy + ry * t * Math.sin(a)])
  }
  return pts
}

function sectorPath(tIn, tOut, a0, a1) {
  const outer = ringEdge(tOut, a0, a1)
  const inner = ringEdge(tIn, a1, a0)
  return 'M' + [...outer, ...inner].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z'
}

function midPoint(t, a) {
  return [cx + rx * t * Math.cos(a), cy + ry * t * Math.sin(a)]
}

export default function StadiumBowl({ sectores = [], selectedId, onSelect, availColors = {} }) {
  const N = sectores.length
  if (N === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', color: 'rgba(255,255,255,0.2)', fontSize: '13px', letterSpacing: '1px' }}>
      Sin sectores
    </div>
  )

  const span = (Math.PI * 2) / N

  return (
    <svg viewBox="0 0 460 320" style={{ width: '100%', maxWidth: '460px', display: 'block' }}>
      <defs>
        <radialGradient id="bowlPitch" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1FA85A" />
          <stop offset="100%" stopColor="#116B36" />
        </radialGradient>
      </defs>

      {/* Pitch */}
      <ellipse cx={cx} cy={cy} rx={rx * 0.40} ry={ry * 0.40} fill="url(#bowlPitch)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <line x1={cx} y1={cy - ry * 0.40} x2={cx} y2={cy + ry * 0.40} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.5)" />

      {/* Sectors */}
      {sectores.map((s, i) => {
        const a0 = -Math.PI / 2 + i * span + gap
        const a1 = -Math.PI / 2 + (i + 1) * span - gap
        const aMid = (a0 + a1) / 2
        const [tx, ty] = midPoint(0.72, aMid)
        const isSel = s.id === selectedId
        const dim = selectedId != null && !isSel
        const color = availColors[s.id]
        const soldOut = color === '#374151'

        const fill = isSel
          ? 'rgba(201,162,39,0.35)'
          : color ? `${color}30` : 'rgba(201,162,39,0.12)'
        const stroke = isSel ? '#C9A227' : color || 'rgba(201,162,39,0.4)'

        return (
          <g
            key={s.id}
            onClick={() => !soldOut && onSelect(isSel ? null : s.id)}
            style={{ cursor: soldOut ? 'not-allowed' : 'pointer' }}
          >
            <path
              d={sectorPath(0.50, 1, a0, a1)}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSel ? 2 : 1.2}
              opacity={dim ? 0.3 : soldOut ? 0.5 : 1}
              style={{ transition: 'all 0.2s' }}
            />
            <text
              x={tx} y={ty}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Bebas Neue, cursive"
              fontSize={N > 8 ? '9' : '11'}
              fill={dim ? 'rgba(255,255,255,0.25)' : isSel ? '#C9A227' : soldOut ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'}
              style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
            >
              {s.nombre.length > 7 ? s.nombre.slice(0, 6) + '…' : s.nombre}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
