'use client'

import { useRef, useEffect } from 'react'
import { gsap } from '@/lib/gsap-setup'
import { ScrollTrigger } from '@/lib/gsap-setup'
import { SIGNAL_ENTRIES } from '@/data/signal-feed'
import Image from 'next/image'

function SignalLine({ entry }: { entry: typeof SIGNAL_ENTRIES[0] }) {
  const typeColor = entry.type === 'quote' ? 'var(--accent)' : entry.type === 'stat' ? '#06B6D4' : '#F59E0B'

  return (
    <div className="signal-line flex items-start gap-4 py-3 border-b border-[rgba(255,255,255,0.04)] group hover:bg-[rgba(255,255,255,0.02)] transition-colors px-4">
      <span className="text-[#3F3F46] font-mono text-[11px] shrink-0 w-40">{entry.timestamp}</span>

      {entry.avatarId && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[rgba(255,255,255,0.06)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.pravatar.cc/40?img=${entry.avatarId}`}
            alt=""
            width={32}
            height={32}
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(1) sepia(0.3)' }}
          />
        </div>
      )}
      {!entry.avatarId && <div className="w-8 h-8 shrink-0" />}

      <div className="flex-1 min-w-0">
        {entry.user && (
          <span className="font-mono text-[11px] text-[#52525B] mr-2">{entry.user} ───</span>
        )}
        <span
          className="font-mono text-xs"
          style={{ color: typeColor }}
        >
          {entry.message}
        </span>
      </div>
    </div>
  )
}

export function SignalSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Title reveal
    const headerEl = sectionRef.current?.querySelector('.signal-header')
    if (headerEl) {
      gsap.from(headerEl, { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
      })
    }

    // Start feed animation when section enters
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        tlRef.current = gsap.timeline({ repeat: -1 })
        tlRef.current.to(track, {
          y: '-50%',
          duration: 28,
          ease: 'none',
        })
      },
    })

    // Speed up feed on scroll, slow on hover
    const container = track.parentElement
    if (container) {
      container.addEventListener('mouseenter', () => {
        tlRef.current?.timeScale(0.25)
      })
      container.addEventListener('mouseleave', () => {
        gsap.to(tlRef.current, { timeScale: 1, duration: 0.6 })
      })
    }

    // Fade in rows stagger when they first appear
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 60%',
      once: true,
      onEnter: () => {
        const rows = track.querySelectorAll('.signal-line')
        gsap.from(rows, {
          opacity: 0,
          x: -16,
          stagger: 0.02,
          duration: 0.4,
          ease: 'power2.out',
        })
      },
    })

    return () => {
      tlRef.current?.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  const doubledEntries = [...SIGNAL_ENTRIES, ...SIGNAL_ENTRIES]

  return (
    <section
      ref={sectionRef}
      id="section-8"
      className="relative w-full min-h-screen bg-[#050508] py-24 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-8 text-center signal-header">
          <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-4">§8 — The Signal</span>
          <h2 className="font-display font-black text-[clamp(32px,5vw,56px)] text-[#FAFAFA] tracking-tight leading-none mb-2">
            Live from the community
          </h2>
          <p className="text-[#52525B] font-mono text-xs mt-2">Hover to pause — scroll to accelerate</p>
        </div>

        {/* Terminal frame */}
        <div
          className="border border-[rgba(255,255,255,0.08)] overflow-hidden"
          style={{ borderRadius: 0, maxHeight: '60vh' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0A0A12] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#28C840] animate-pulse" />
            <span className="font-mono text-xs text-[#52525B] tracking-widest">╔══ [●] LIVE FEED ── cameleon signal log ═══════════════════╗</span>
          </div>

          {/* Scrolling log */}
          <div className="overflow-hidden" style={{ height: 'calc(60vh - 100px)' }}>
            <div ref={trackRef}>
              {doubledEntries.map((entry, i) => (
                <SignalLine key={`${entry.id}-${i}`} entry={entry} />
              ))}
            </div>
          </div>

          {/* Stats footer */}
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A12] flex items-center gap-8">
            <span className="font-mono text-xs text-[var(--accent)]">★ 847</span>
            <span className="font-mono text-xs text-[#06B6D4]">↓ 12.4k/wk</span>
            <span className="font-mono text-xs text-[#A1A1AA]">◎ 234 teams</span>
            <span className="font-mono text-xs text-[#F59E0B]">⚡ 99.9% uptime</span>
            <span className="ml-auto font-mono text-[11px] text-[#3F3F46]">╚════════════════════════════════════════════╝</span>
          </div>
        </div>
      </div>
    </section>
  )
}
