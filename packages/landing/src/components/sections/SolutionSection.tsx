'use client'

import { useRef, useEffect, useCallback } from 'react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap-setup'
import { DashboardMock } from '@/components/ui/DashboardMock'

const STATS = [
  { value: 0, target: 847, suffix: '+', label: 'Memory Entries' },
  { value: 0, target: 60,  suffix: '%', label: 'Less Context Duplication' },
  { value: 0, target: 12,  suffix: 'x', label: 'Faster Context Loading' },
]

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef   = useRef<HTMLDivElement>(null)
  const dashRef    = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const titleEl = titleRef.current
    const dashEl  = dashRef.current
    const statsEl = statsRef.current
    if (!section || !titleEl || !dashEl || !statsEl) return

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = []

    // Heading SplitText reveal
    const split = new SplitText(titleEl.querySelector('h2'), { type: 'lines,words', linesClass: 'clip-line' })
    gsap.set(split.words, { y: '115%', opacity: 0 })

    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      onEnter: () => {
        // Reveal heading words
        gsap.to(split.words, {
          y: '0%',
          opacity: 1,
          duration: 0.85,
          stagger: 0.055,
          ease: 'power3.out',
        })

        // Bullet list items stagger in
        const items = titleEl.querySelectorAll('.bullet-item')
        gsap.from(items, {
          opacity: 0,
          x: -28,
          stagger: 0.1,
          delay: 0.4,
          duration: 0.6,
          ease: 'power2.out',
        })

        // Dashboard slides in with clip-path curtain
        gsap.fromTo(
          dashEl,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 1.1, delay: 0.2, ease: 'power3.inOut' },
        )
      },
    }))

    // Stats count-up
    triggers.push(ScrollTrigger.create({
      trigger: statsEl,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        statsEl.querySelectorAll<HTMLElement>('.stat-num').forEach((el) => {
          const target = Number(el.dataset.target)
          const suffix = el.dataset.suffix ?? ''
          gsap.to({ val: 0 }, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate() {
              el.textContent = Math.round((this as gsap.TweenVars & {targets: () => [{val:number}]}).targets()[0].val) + suffix
            },
          })
        })

        // Stats fade in
        gsap.from(statsEl.querySelectorAll('.stat-item'), {
          y: 30,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power2.out',
        })
      },
    }))

    return () => {
      triggers.forEach(t => t.kill())
      split.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-3"
      className="relative w-full min-h-screen bg-[#050508] py-32 px-8 flex flex-col justify-center overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto w-full">
        <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-6">
          §3 — The Remembering
        </span>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Left text */}
          <div ref={titleRef}>
            <h2 className="font-display font-black text-[clamp(32px,5vw,56px)] text-[#FAFAFA] tracking-tight leading-none mb-8 overflow-hidden">
              CAMELEON{' '}
              <span
                className="inline-block"
                style={{
                  background: 'linear-gradient(135deg, #00FF88, #8B5CF6, #F59E0B, #06B6D4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Remembers.
              </span>
            </h2>
            <p className="text-[#A1A1AA] text-lg leading-relaxed mb-8 max-w-lg">
              Every decision. Every bug. Every lesson. Every context.
              Persisted in a structured, semantically-searchable knowledge base
              that grows smarter with every session.
            </p>

            <div className="space-y-4">
              {[
                { icon: '◈', text: 'Captures knowledge as it happens — automatically' },
                { icon: '⌕', text: 'Searches semantically — not just keywords' },
                { icon: '◎', text: 'Works across Claude Code, GitHub Copilot, any MCP client' },
              ].map(({ icon, text }) => (
                <div key={text} className="bullet-item flex items-start gap-3" style={{ opacity: 0 }}>
                  <span className="text-[var(--accent)] font-mono text-lg mt-0.5 shrink-0">{icon}</span>
                  <span className="text-[#A1A1AA] text-base">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right dashboard — clip-path reveal */}
          <div
            ref={dashRef}
            style={{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }}
          >
            <DashboardMock className="h-[480px] w-full" />
          </div>
        </div>

        {/* Stats row */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 gap-8 border-t border-[rgba(255,255,255,0.06)] pt-12"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-item text-center">
              <div
                className="stat-num font-display font-black text-[clamp(40px,5vw,64px)] leading-none"
                style={{ color: 'var(--accent)' }}
                data-target={stat.target}
                data-suffix={stat.suffix}
              >
                0{stat.suffix}
              </div>
              <div className="text-[#52525B] font-mono text-xs tracking-widest uppercase mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`.clip-line { overflow: hidden; display: block; }`}</style>
    </section>
  )
}
