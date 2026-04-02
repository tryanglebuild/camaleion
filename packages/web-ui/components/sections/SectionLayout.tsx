'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useTypewriter } from '@/lib/use-typewriter'
import { useIsMobile } from '@/lib/use-window-width'
import type { SectionProps } from './types'
import { sectionRevealVariants, panelRevealVariants, contentItemVariants } from './sectionVariants'

// ── SectionWrapper ────────────────────────────────────────────────
interface SectionWrapperProps {
  direction: SectionProps['direction']
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}
export function SectionWrapper({ direction, children, style }: SectionWrapperProps) {
  return (
    <motion.div
      custom={direction}
      variants={sectionRevealVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        marginLeft: 'var(--nav-width, 220px)',
        transition: 'margin-left 0.25s cubic-bezier(0.22,1,0.36,1)',
        background: 'var(--bg-base)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  titleDelay?: number   // seconds
  titleSpeed?: number   // ms/char
  accent?: string       // optional top accent bar color
}
export function SectionHeader({ title, subtitle, rightSlot, titleDelay = 0.55, titleSpeed = 42, accent }: SectionHeaderProps) {
  const isMobile = useIsMobile()
  const titleDuration = (title.length * titleSpeed) / 1000
  const { displayed: titleText, done: titleDone } = useTypewriter(title, { delay: titleDelay, speed: titleSpeed })
  const { displayed: subText } = useTypewriter(subtitle ?? '', {
    delay: titleDelay + titleDuration + 0.08,
    speed: 18,
  })

  return (
    <motion.div
      variants={panelRevealVariants}
      style={{
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-1)',
      }}
    >
      {accent && <div style={{ height: 3, background: accent, flexShrink: 0 }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '56px 16px 14px' : '14px 28px' }}>
      <div>
        <h1 className="section-title-lg">
          {titleText}
          {!titleDone && <span className="tw-cursor" />}
        </h1>
        {subtitle && (
          <p className="section-subtitle">
            {subText}
            {titleDone && subText.length < (subtitle?.length ?? 0) && <span className="tw-cursor" />}
          </p>
        )}
      </div>
      {rightSlot && (
        <motion.div variants={contentItemVariants}>
          {rightSlot}
        </motion.div>
      )}
      </div>
    </motion.div>
  )
}

// ── SectionBody ───────────────────────────────────────────────────
// Flex row container for the body columns
export function SectionBody({ children }: { children: ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

// ── SectionPanel ──────────────────────────────────────────────────
// Individual panel that reveals with clipPath, staggered
interface SectionPanelProps {
  children: ReactNode
  style?: React.CSSProperties
  scrollable?: boolean
}
export function SectionPanel({ children, style, scrollable }: SectionPanelProps) {
  return (
    <motion.div
      variants={panelRevealVariants}
      style={{
        display: 'flex', flexDirection: 'column',
        ...(scrollable ? { overflowY: 'auto' as const } : {}),
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}
