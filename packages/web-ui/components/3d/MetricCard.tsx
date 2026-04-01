'use client'
import { useRef, useState, useCallback } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface MetricCardProps {
  label: string
  value: number | string
  accent?: string
  accentGlow?: string
  unit?: string
  icon?: React.ReactNode
  sparkData?: number[]
  sublabel?: string
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 80
  const h = 28
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`)
  return (
    <svg width={w} height={h} style={{ overflow: 'visible', display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Fill area */}
      <polyline
        points={`0,${h} ${pts.join(' ')} ${(data.length - 1) * step},${h}`}
        fill={`${color}18`}
        stroke="none"
      />
    </svg>
  )
}

export function MetricCard({
  label, value, accent = '#3B82F6', accentGlow, unit, icon, sparkData = [], sublabel,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const rotateX = useSpring(0, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 })

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    rotateY.set(dx * 10)
    rotateX.set(-dy * 7)
  }, [rotateX, rotateY])

  const onMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    setHovered(false)
  }, [rotateX, rotateY])

  const glow = accentGlow ?? `${accent}20`

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX, rotateY,
        transformPerspective: 800,
        borderRadius: 6,
        border: '1px solid var(--border)',
        borderTop: `2px solid ${accent}`,
        background: 'rgba(255,255,255,0.018)',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'default',
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${glow}` : 'none',
        transition: 'box-shadow 0.2s',
        willChange: 'transform',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
          letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>{label}</span>
        {icon && <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-space-grotesk)', fontSize: 42, fontWeight: 700,
          color: 'var(--text-primary)', lineHeight: 1,
        }}>{value}</span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
            color: 'var(--text-muted)', marginBottom: 4,
          }}>{unit}</span>
        )}
      </div>

      {/* Sparkline */}
      {sparkData.length > 0 && (
        <Sparkline data={sparkData} color={accent} />
      )}

      {/* Sublabel */}
      {sublabel && (
        <span style={{
          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
          color: accent, opacity: 0.8, letterSpacing: '0.1em',
        }}>{sublabel}</span>
      )}
    </motion.div>
  )
}
