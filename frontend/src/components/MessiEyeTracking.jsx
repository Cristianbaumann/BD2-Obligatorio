import { useRef } from 'react'
import { motion, useReducedMotion, useSpring, useTransform, useMotionValue } from 'framer-motion'
import useMousePosition from '../hooks/useMousePosition'

const LEFT_EYE  = { cx: 178, cy: 195, r: 14 }
const RIGHT_EYE = { cx: 230, cy: 192, r: 14 }
const MAX_OFFSET = 6
const IMG_W = 420
const IMG_H = 560

function Eye({ eye, mouseX, mouseY, containerRef }) {
  const springX = useSpring(0, { stiffness: 120, damping: 20 })
  const springY = useSpring(0, { stiffness: 120, damping: 20 })

  const updateEye = (mx, my) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = rect.width  / IMG_W
    const scaleY = rect.height / IMG_H
    const eyeScreenX = rect.left + eye.cx * scaleX
    const eyeScreenY = rect.top  + eye.cy * scaleY
    const dx = mx - eyeScreenX
    const dy = my - eyeScreenY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const offsetX = (dx / dist) * Math.min(dist * 0.1, MAX_OFFSET)
    const offsetY = (dy / dist) * Math.min(dist * 0.1, MAX_OFFSET)
    springX.set(offsetX)
    springY.set(offsetY)
  }

  if (containerRef.current) {
    updateEye(mouseX, mouseY)
  }

  return (
    <motion.circle
      cx={eye.cx}
      cy={eye.cy}
      r={eye.r * 0.55}
      fill="#1a1a2e"
      style={{ x: springX, y: springY }}
      filter="url(#eye-glow)"
    />
  )
}

export default function MessiEyeTracking({ className = '' }) {
  const { x, y } = useMousePosition()
  const containerRef = useRef(null)
  const prefersReduced = useReducedMotion()

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <img
        src="/assets/messi.png"
        alt="Lionel Messi"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 0 40px rgba(201,162,39,0.2))',
        }}
      />

      {!prefersReduced && (
        <svg
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            <filter id="eye-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#C9A227" floodOpacity="0.6" />
            </filter>
          </defs>

          <Eye eye={LEFT_EYE}  mouseX={x} mouseY={y} containerRef={containerRef} />
          <Eye eye={RIGHT_EYE} mouseX={x} mouseY={y} containerRef={containerRef} />
        </svg>
      )}
    </div>
  )
}
