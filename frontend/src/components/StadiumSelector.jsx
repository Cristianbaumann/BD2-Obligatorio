import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

function sectorColor(disponibles, total) {
  if (disponibles === 0) return '#374151'
  if (!total) return '#22c55e'
  const pct = disponibles / total
  if (pct > 0.5) return '#22c55e'
  if (pct > 0.2) return '#eab308'
  return '#ef4444'
}

export default function StadiumSelector({ eventoId, onSeatsSelected }) {
  const [sectores, setSectores] = useState([])
  const [activeSector, setActiveSector] = useState(null)   // objeto completo de DB
  const [selectedSeats, setSelectedSeats] = useState([])

  useEffect(() => {
    if (!eventoId) return
    api.get(`/eventos/${eventoId}/disponibilidad`)
      .then(r => setSectores(r.data || []))
      .catch(() => {})
  }, [eventoId])

  function toggleSeat(seatIndex) {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.sectorId === activeSector.sector_id && s.seatIndex === seatIndex)
      if (exists) return prev.filter(s => !(s.sectorId === activeSector.sector_id && s.seatIndex === seatIndex))
      if (prev.length >= 5) return prev
      return [...prev, { sectorId: activeSector.sector_id, sectorNombre: activeSector.nombre, costo: activeSector.costo, seatIndex }]
    })
  }

  function selectSector(sector) {
    setActiveSector(sector)
    setSelectedSeats([])
  }

  useEffect(() => {
    onSeatsSelected?.(selectedSeats)
  }, [selectedSeats])

  const seatsInSector = (sector) =>
    selectedSeats.filter(s => s.sectorId === sector.sector_id).length

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 360px', minWidth: '300px' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Seleccioná un sector
        </p>

        {/* SVG decorativo */}
        <svg viewBox="0 0 400 240" style={{ width: '100%', background: '#0E1A2E', borderRadius: '12px', border: '1px solid rgba(201,162,39,0.15)', marginBottom: '16px' }}>
          <rect x="100" y="60" width="200" height="120" rx="4" fill="#1a4a1a" />
          <rect x="140" y="85" width="120" height="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <line x1="200" y1="85" x2="200" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <circle cx="200" cy="120" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <text x="200" y="125" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Bebas Neue,cursive">CANCHA</text>
          {/* Zonas decorativas */}
          <path d="M 120 20 L 280 20 L 260 80 L 140 80 Z"   fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <path d="M 120 220 L 280 220 L 260 160 L 140 160 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <path d="M 300 60 L 360 60 L 360 180 L 300 180 L 280 140 L 280 100 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <path d="M 100 60 L 40 60 L 40 180 L 100 180 L 120 140 L 120 100 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <text x="200" y="52"  textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="Bebas Neue,cursive">ESTADIO</text>
        </svg>

        {/* Botones de sectores reales desde DB */}
        {sectores.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Cargando sectores...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sectores.map(s => {
              const color = sectorColor(s.disponibles, s.total)
              const isActive = activeSector?.sector_id === s.sector_id
              const selCount = seatsInSector(s)
              return (
                <button
                  key={s.sector_id}
                  disabled={s.disponibles === 0}
                  onClick={() => selectSector(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #C9A227' : '1px solid rgba(255,255,255,0.1)',
                    background: isActive ? 'rgba(201,162,39,0.1)' : 'rgba(255,255,255,0.03)',
                    cursor: s.disponibles === 0 ? 'not-allowed' : 'pointer',
                    opacity: s.disponibles === 0 ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: isActive ? '#C9A227' : '#fff', letterSpacing: '1px' }}>
                      {s.nombre}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {selCount > 0 && (
                      <span style={{ background: '#C9A227', color: '#0A0A12', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                        {selCount} sel.
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      {s.disponibles}/{s.total} disp.
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#C9A227' }}>
                      ${s.costo.toLocaleString()}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
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
              maxHeight: '420px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontFamily: 'Bebas Neue, cursive', color: '#C9A227', fontSize: '18px' }}>
                {activeSector.nombre}
              </h4>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {selectedSeats.filter(s => s.sectorId === activeSector.sector_id).length}/5 seleccionados
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '6px' }}>
              {Array.from({ length: Math.min(60, activeSector.total) }, (_, i) => {
                const isSelected = selectedSeats.some(s => s.sectorId === activeSector.sector_id && s.seatIndex === i)
                const occupied = activeSector.total - activeSector.disponibles
                const isOccupied = i < occupied

                return (
                  <button
                    key={i}
                    disabled={isOccupied}
                    onClick={() => toggleSeat(i)}
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
              {[['#22c55e', 'Disponible'], ['#C9A227', 'Seleccionado'], ['#374151', 'Ocupado']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
