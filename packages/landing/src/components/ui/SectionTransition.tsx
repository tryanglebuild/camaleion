'use client'

import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap-setup'

interface SectionTransitionProps {
  from: string   // e.g. "§2"
  to:   string   // e.g. "§3"
  label: string  // e.g. "The Forgetting → The Remembering"
}

export function SectionTransition({ from, to, label }: SectionTransitionProps) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const lineRef  = useRef<HTMLDivElement>(null)
  const textRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const line = lineRef.current
    const text = textRef.current
    if (!wrap || !line || !text) return

    gsap.set(line, { scaleX: 0, transformOrigin: 'left' })
    gsap.set(text, { opacity: 0, y: 8 })

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(line, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' })
        gsap.to(text, { opacity: 1, y: 0, duration: 0.5, delay: 0.4 })
      },
      onLeaveBack: () => {
        gsap.to(line, { scaleX: 0, duration: 0.4 })
        gsap.to(text, { opacity: 0, y: 8, duration: 0.3 })
      },
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative w-full flex items-center gap-4 px-8 py-8 overflow-hidden"
      style={{ backgroundColor: '#050508' }}
    >
      {/* Section number labels */}
      <span className="font-mono text-[10px] tracking-widest text-[#3F3F46] uppercase shrink-0">
        {from}
      </span>

      {/* Animated line */}
      <div className="flex-1 relative h-px bg-[rgba(255,255,255,0.04)]">
        <div
          ref={lineRef}
          className="absolute inset-y-0 left-0 right-0"
          style={{ backgroundColor: 'var(--accent)', transformOrigin: 'left' }}
        />
      </div>

      {/* Label */}
      <div ref={textRef} className="font-mono text-[10px] tracking-[0.2em] text-[#52525B] uppercase shrink-0">
        {label}
      </div>

      {/* Dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }}
      />

      <span className="font-mono text-[10px] tracking-widest text-[#3F3F46] uppercase shrink-0">
        {to}
      </span>
    </div>
  )
}
