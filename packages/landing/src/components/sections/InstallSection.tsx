'use client'

import { useRef, useEffect } from 'react'
import { gsap } from '@/lib/gsap-setup'
import { ScrollTrigger } from '@/lib/gsap-setup'

const STEPS = [
  {
    num: '01',
    title: 'Install',
    command: 'npm install @cameleon/mcp-server',
    description: 'Add CAMELEON to your project in seconds.',
  },
  {
    num: '02',
    title: 'Configure',
    command: 'npx cameleon init',
    description: 'Connect to your Supabase project. One config file.',
  },
  {
    num: '03',
    title: 'Connect',
    command: 'npx cameleon start',
    description: 'Point your MCP client at the server. Done.',
  },
]

export function InstallSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter: () => {
        const steps = section.querySelectorAll<HTMLElement>('.install-step')
        gsap.from(steps, {
          y: 40,
          opacity: 0,
          stagger: 0.2,
          duration: 0.7,
          ease: 'power2.out',
        })

        // Draw checkmarks via CSS
        section.querySelectorAll<HTMLElement>('.checkmark').forEach((el, i) => {
          gsap.from(el, {
            scale: 0,
            opacity: 0,
            delay: 0.4 + i * 0.2,
            duration: 0.4,
            ease: 'back.out(2)',
          })
        })
      },
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  function copyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd).catch(() => {})
    // Brief visual feedback
    const btn = document.querySelector(`[data-cmd="${cmd}"]`) as HTMLElement
    if (!btn) return
    const orig = btn.textContent
    btn.textContent = 'Copied!'
    gsap.from(btn, { scale: 1.1, duration: 0.2, ease: 'back.out' })
    setTimeout(() => { btn.textContent = orig }, 1500)
  }

  return (
    <section
      ref={sectionRef}
      id="section-7"
      className="relative w-full min-h-screen bg-[#050508] py-32 px-8 flex flex-col items-center justify-center"
    >
      <div className="max-w-2xl mx-auto w-full text-center">
        <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-8">§7 — The Gateway</span>

        <h2 className="font-display font-black text-[clamp(32px,5vw,56px)] text-[#FAFAFA] tracking-tight leading-none mb-4">
          Three Commands.{' '}
          <br />
          <span style={{ color: 'var(--accent)' }}>Infinite Memory.</span>
        </h2>
        <p className="text-[#A1A1AA] text-lg mb-16">
          No infrastructure to manage. No complex setup.
          Just persistent AI memory that works.
        </p>

        <div ref={stepsRef} className="space-y-8 text-left">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="install-step flex items-start gap-6 p-6 bg-[#0A0A12] border border-[rgba(255,255,255,0.06)] opacity-0"
              style={{ borderRadius: 0 }}
            >
              {/* Number */}
              <span
                className="font-display font-black text-[48px] leading-none shrink-0"
                style={{ color: 'var(--accent)', lineHeight: 1 }}
              >
                {step.num}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs tracking-widest text-[#52525B] uppercase mb-2">{step.title}</div>
                <div className="flex items-center gap-3 bg-[#12121F] border border-[rgba(255,255,255,0.06)] px-4 py-2 mb-3 group">
                  <code className="font-mono text-sm text-[var(--accent)] flex-1">{step.command}</code>
                  <button
                    data-cmd={step.command}
                    onClick={() => copyCommand(step.command)}
                    className="text-[#52525B] hover:text-[var(--accent)] transition-colors font-mono text-xs"
                    style={{ cursor: 'pointer' }}
                  >
                    copy
                  </button>
                </div>
                <p className="text-[#A1A1AA] text-sm">{step.description}</p>
              </div>

              {/* Checkmark */}
              <div
                className="checkmark w-8 h-8 border-2 shrink-0 flex items-center justify-center"
                style={{
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: '2px',
                }}
              >
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path d="M1 6L6 11L15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[#52525B] font-mono text-sm">
          Works with Claude Code, GitHub Copilot, and any MCP-compatible client.
        </p>
      </div>
    </section>
  )
}
