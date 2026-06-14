import { useReducedMotion } from 'framer-motion'
import useMousePosition from '../../hooks/useMousePosition'

export default function Spotlight({ color = 'rgba(201,162,39,0.06)', size = 600 }) {
  const { x, y } = useMousePosition()
  const prefersReduced = useReducedMotion()

  if (prefersReduced) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        background: `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`,
        transition: 'background 0.05s',
      }}
    />
  )
}
