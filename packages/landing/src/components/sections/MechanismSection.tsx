'use client'

import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger, SplitText, TextPlugin } from '@/lib/gsap-setup'
import { Terminal } from '@/components/ui/Terminal'

const STEPS = [
  {
    num: '01',
    title: 'CONNECT',
    description: 'Point any MCP client at your server. Handshake takes seconds.',
    lines: [
      'npx @cameleon/mcp-server start',
      '> Connecting to Supabase... ✓',
      '> MCP server ready on :8080 ✓',
      '> Claude Code detected ✓',
    ],
  },
  {
    num: '02',
    title: 'STORE',
    description: 'Knowledge is captured automatically as you work — or with a single tool call.',
    lines: [
      'add_entry({',
      '  type: "decision",',
      '  title: "Use Supabase RLS",',
      '  project: "cameleon"',
      '})',
      '> Saved ✓  id: dec_9f3a2c',
      '> Embedding: 1536-dim ✓',
    ],
  },
  {
    num: '03',
    title: 'UNDERSTAND',
    description: 'Ask questions in natural language. Get answers with sources.',
    lines: [
      'query_context({',
      '  question: "What did we decide about auth?"',
      '})',
      '> Searching 847 entries...',
      '> JWT over sessions — 2026-04-10',
      '> Sources: [dec#2847] [log#2901]',
    ],
  },
  {
    num: '04',
    title: 'ORCHESTRATE',
    description: 'Spin up multi-agent sessions with full context injected automatically.',
    lines: [
      'start_session({',
      '  goal: "Refactor auth to PKCE"',
      '})',
      '> Session sess_d4e9f1 created',
      '> Agents: [backend, tester]',
      '> Context: 12 entries injected ✓',
    ],
  },
]

export function MechanismSection() {
  const sectionRef   = useRef<HTMLElement>(null)
  const titleRef     = useRef<HTMLHeadingElement>(null)
  const stepsWrapRef = useRef<HTMLDivElement>(null)
  const terminalRef  = useRef<HTMLDivElement>(null)
  const progressRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section   = sectionRef.current
    const titleEl   = titleRef.current
    const stepsWrap = stepsWrapRef.current
    const terminal  = terminalRef.current
    const progress  = progressRef.current
    if (!section || !titleEl || !stepsWrap || !terminal || !progress) return

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = []

    // Title words slide up
    const split = new SplitText(titleEl, { type: 'lines,words', linesClass: 'clip-line' })
    gsap.set(split.words, { y: '110%', opacity: 0 })
    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top 72%',
      onEnter: () => {
        gsap.to(split.words, { y: '0%', opacity: 1, duration: 0.85, stagger: 0.06, ease: 'power3.out' })
      },
    }))

    const stepEls = stepsWrap.querySelectorAll<HTMLElement>('.mech-step')
    const termLines = terminal.querySelectorAll<HTMLElement>('.term-group')

    function activateStep(idx: number) {
      stepEls.forEach((el, i) => {
        gsap.to(el, {
          opacity: i <= idx ? 1 : 0.25,
          x: i === idx ? 0 : i < idx ? 0 : 12,
          duration: 0.4,
          ease: 'power2.out',
        })

        // Accent line on the active step
        const line = el.querySelector<HTMLElement>('.step-line')
        if (line) {
          gsap.to(line, {
            scaleX: i <= idx ? 1 : 0,
            backgroundColor: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
            duration: 0.4,
          })
        }
      })

      // Show the relevant terminal group
      termLines.forEach((g, i) => {
        gsap.to(g, {
          opacity: i === idx ? 1 : 0,
          y: i === idx ? 0 : 12,
          duration: 0.4,
          ease: 'power2.out',
        })
      })

      // Progress bar
      gsap.to(progress, {
        scaleY: (idx + 1) / STEPS.length,
        duration: 0.6,
        ease: 'power2.inOut',
      })
    }

    // Pin + scroll-driven steps
    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${STEPS.length * 280}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate(self) {
        const idx = Math.min(
          STEPS.length - 1,
          Math.floor(self.progress * STEPS.length),
        )
        activateStep(idx)
      },
    }))

    // Initial state
    gsap.set(termLines, { opacity: 0, y: 12 })
    gsap.set(stepEls, { opacity: 0.25 })
    gsap.set(progress, { scaleY: 0, transformOrigin: 'top' })

    return () => {
      triggers.forEach(t => t.kill())
      split.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-4"
      className="relative w-full min-h-screen bg-[#050508] py-28 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-6">
          §4 — The Mechanism
        </span>

        <h2
          ref={titleRef}
          className="font-display font-black text-[clamp(28px,4.5vw,52px)] text-[#FAFAFA] tracking-tight leading-tight mb-16 overflow-hidden"
        >
          How It Works
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: steps with vertical progress */}
          <div className="flex gap-5">
            {/* Vertical progress track */}
            <div className="relative flex flex-col items-center shrink-0" style={{ paddingTop: '4px' }}>
              <div className="absolute top-0 bottom-0 w-px bg-[rgba(255,255,255,0.07)]" />
              <div
                ref={progressRef}
                className="absolute top-0 w-px bg-[var(--accent)]"
                style={{
                transformOrigin: 'top',
                transform: 'scaleY(0)',
                height: '100%',
                backgroundColor: 'var(--accent)',
                width: '1px',
                position: 'absolute',
                top: 0,
              }}
              />
            </div>

            {/* Steps */}
            <div ref={stepsWrapRef} className="flex flex-col gap-8 flex-1">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="mech-step cursor-default"
                  style={{ opacity: 0.25 }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className="font-mono text-xs tracking-widest"
                      style={{ color: 'var(--accent)' }}
                    >
                      {step.num}
                    </span>
                    <div
                      className="step-line h-px flex-1"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        transformOrigin: 'left',
                        transform: 'scaleX(0)',
                      }}
                    />
                    <span className="font-display font-black text-xl text-[#FAFAFA] tracking-tight">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[#A1A1AA] text-sm leading-relaxed pl-10">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal with step-specific content */}
          <div ref={terminalRef}>
            <Terminal title="cameleon — terminal" showCursor className="h-[340px]">
              {STEPS.map((step, i) => (
                <div key={step.num} className="term-group absolute top-8 left-0 right-0 px-4">
                  <div className="space-y-1.5">
                    {step.lines.map((line, j) => (
                      <div
                        key={j}
                        className="font-mono text-xs"
                        style={{
                          color: line.startsWith('>') ? 'var(--accent)' : '#A1A1AA',
                        }}
                      >
                        {!line.startsWith('>') && (
                          <span className="text-[#3F3F46] mr-2">$</span>
                        )}
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Terminal>

            <p className="font-mono text-[11px] text-[#3F3F46] mt-4 text-center tracking-widest uppercase">
              Scroll to advance ↓
            </p>
          </div>
        </div>
      </div>

      <style>{`.clip-line { overflow: hidden; display: block; }`}</style>
    </section>
  )
}
