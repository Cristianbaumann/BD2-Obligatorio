import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

const SECTORS = [
  { id: 'NORTE',       label: 'Norte',       path: 'M 120 20 L 280 20 L 260 80 L 140 80 Z',   precio: null },
  { id: 'SUR',         label: 'Sur',         path: 'M 120 220 L 280 220 L 260 160 L 140 160 Z', precio: null },
  { id: 'ESTE',        label: 'Este',        path: 'M 300 60 L 360 60 L 360 180 L 300 180 L 280 140 L 280 100 Z', precio: null },
  { id: 'OESTE',       label: 'Oeste',       path: 'M 100 60 L 40 60 L 40 180 L 100 180 L 120 140 L 120 100 Z', precio: null },
  { id: 'PREFERENCIAL', label: 'Preferencial', path: 'M 140 85 L 260 85 L 255 155 L 145 155 Z', precio: null },
  { id: 'VIP',         label: 'VIP',         path: 'M 155 100 L 245 100 L 240 140 L 160 140 Z', precio: null },
]

function sectorColor(disponibles, total) {
  if (!disponibles || disponibles === 0) return '#374151'
  if (!total) return '#22c55e'
  const pct = disponibles / total
  if (pct > 0.5) return '#22c55e'
  if (pct > 0.2) return '#eab308'
  return '#ef4444'
}

export default function StadiumSelector({ eventoId, onSeatsSelected }) {
  const [disponibilidad, setDisponibilidad] = useState({})
  const [hoveredSector, setHoveredSector] = useState(null)
  const [activeSector, setActiveSector] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, sector: null })

  useEffect(() => {
    if (!eventoId) return
    api.get(`/eventos/${eventoId}/disponibilidad`)
      .then(r => {
        const map = {}
        ;(r.data || []).forEach(s => { map[s.sector_id || s.nombre] = s })
        setDisponibilidad(map)
      })
      .catch(() => {})
  }, [eventoId])

  function toggleSeat(seatId) {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) return prev.filter(s => s !== seatId)
      if (prev.length >= 5) return prev
      return [...prev, seatId]
    })
  }

  useEffect(() => {
    onSeatsSelected?.(selectedSeats)
  }, [selectedSeats])

  const sectorData = (s) => disponibilidad[s.id] || {}

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 360px', minWidth: '300px' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Mapa del estadio — seleccioná sector
        </p>

        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 400 240" style={{ width: '100%', background: '#0E1A2E', borderRadius: '12px', border: '1px solid rgba(201,162,39,0.15)' }}>
            <rect x="100" y="60" width="200" height="120" rx="4" fill="#1a4a1a" />
            <rect x="140" y="85" width="120" height="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1="200" y1="85" x2="200" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <circle cx="200" cy="120" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <text x="200" y="125" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Bebas Neue,cursive">CANCHA</text>

            {SECTORS.map(s => {
              const data = sectorData(s)
              const color = sectorColor(data.disponibles, data.total)
              const isSoldOut = data.disponibles === 0
              const isHovered = hoveredSector === s.id
              const isActive = activeSector === s.id

              return (
                <path
                  key={s.id}
                  d={s.path}
                  fill={color}
                  fillOpacity={isActive ? 0.9 : isHovered ? 0.8 : 0.6}
                  stroke={isActive ? '#C9A227' : isHovered ? 'rgba(201,162,39,0.7)' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive || isHovered ? 2 : 0.5}
                  style={{ cursor: isSoldOut ? 'not-allowed' : 'pointer', transition: 'all 0.15s', filter: isActive ? 'drop-shadow(0 0 8px rgba(201,162,39,0.5))' : 'none' }}
                  onMouseEnter={e => {
                    if (isSoldOut) return
                    setHoveredSector(s.id)
                    const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                    setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, sector: s })
                  }}
                  onMouseMove={e => {
                    const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                    setTooltip(t => ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }))
                  }}
                  onMouseLeave={() => { setHoveredSector(null); setTooltip(t => ({ ...t, visible: false })) }}
                  onClick={() => { if (!isSoldOut) { setActiveSector(s.id); setSelectedSeats([]) } }}
                />
              )
            })}

            {SECTORS.map(s => {
              const cx = s.id === 'NORTE' ? 200 : s.id === 'SUR' ? 200 : s.id === 'ESTE' ? 330 : s.id === 'OESTE' ? 70 : s.id === 'PREFERENCIAL' ? 200 : 200
              const cy = s.id === 'NORTE' ? 50 : s.id === 'SUR' ? 190 : s.id === 'ESTE' ? 120 : s.id === 'OESTE' ? 120 : s.id === 'PREFERENCIAL' ? 120 : 120
              return (
                <text key={s.id + '-label'} x={cx} y={cy} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="Bebas Neue,cursive" style={{ pointerEvents: 'none' }}>
                  {s.label}
                </text>
              )
            })}

            {tooltip.visible && tooltip.sector && (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tooltip.x + 8} y={tooltip.y - 32} width="110" height="36" rx="4" fill="#0A0A12" stroke="rgba(201,162,39,0.4)" strokeWidth="1" />
                <text x={tooltip.x + 63} y={tooltip.y - 16} textAnchor="middle" fill="#C9A227" fontSize="8" fontFamily="Bebas Neue,cursive">
                  {tooltip.sector.label}
                </text>
                <text x={tooltip.x + 63} y={tooltip.y - 4} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Inter,sans-serif">
                  {(sectorData(tooltip.sector).disponibles ?? '?')} disponibles
                </text>
              </g>
            )}
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          {[['#22c55e', '>50% disp.'], ['#eab308', '20-50% disp.'], ['#ef4444', '<20% disp.'], ['#374151', 'Agotado']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, display: 'inline-block' }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeSector && (
          <motion.div
            key="seat-panel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            style={{
              flex: '1 1 280px',
              background: '#0E1A2E',
              border: '1px solid rgba(201,162,39,0.2)',
              borderRadius: '12px',
              padding: '20px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontFamily: 'Bebas Neue, cursive', color: '#C9A227', fontSize: '18px' }}>
                Sector {activeSector}
              </h4>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {selectedSeats.length}/5 seleccionados
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '6px' }}>
              {Array.from({ length: Math.min(60, sectorData(SECTORS.find(s => s.id === activeSector)).total || 40) }, (_, i) => {
                const seatId = `${activeSector}-${i + 1}`
                const isSelected = selectedSeats.includes(seatId)
                const isOccupied = i < Math.floor(((sectorData(SECTORS.find(s => s.id === activeSector)).total || 40) - (sectorData(SECTORS.find(s => s.id === activeSector)).disponibles || 20)) * 1)

                return (
                  <button
                    key={seatId}
                    disabled={isOccupied}
                    onClick={() => toggleSeat(seatId)}
                    title={`Asiento ${i + 1}`}
                    style={{
                      width: '28px', height: '28px',
                      borderRadius: '4px',
                      border: 'none',
                      background: isOccupied ? '#374151' : isSelected ? '#C9A227' : '#22c55e',
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      animation: isSelected ? 'pulse-ring 1.5s ease-in-out infinite' : 'none',
                      transition: 'background 0.15s',
                    }}
                  />
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} /> Disponible
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#C9A227', display: 'inline-block' }} /> Seleccionado
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#374151', display: 'inline-block' }} /> Ocupado
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
