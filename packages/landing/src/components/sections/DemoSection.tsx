'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from '@/lib/gsap-setup'
import { TextPlugin } from '@/lib/gsap-setup'
import { DEMO_SCENARIOS } from '@/data/demo-scenarios'

export function DemoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLPreElement>(null)
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0])
  const [isTyping, setIsTyping] = useState(false)

  function runScenario(scenario: typeof DEMO_SCENARIOS[0]) {
    if (isTyping) return
    setIsTyping(true)
    setActiveScenario(scenario)

    const outputEl = outputRef.current
    if (!outputEl) return

    outputEl.textContent = ''

    const tl = gsap.timeline({
      onComplete: () => setIsTyping(false),
    })

    tl.to(outputEl, {
      duration: 0.8,
      text: {
        value: `$ ${scenario.command}`,
        delimiter: '',
        speed: 0.5,
      },
      ease: 'none',
    })
    tl.to(outputEl, {
      duration: 1.2,
      text: {
        value: `$ ${scenario.command}\n\n${scenario.response}`,
        delimiter: '',
        speed: 0.8,
      },
      ease: 'none',
      delay: 0.3,
    })
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Draggable on desktop
    const loadDraggable = async () => {
      if (typeof window === 'undefined' || window.innerWidth < 1024) return
      try {
        const { Draggable } = await import('gsap/Draggable')
        gsap.registerPlugin(Draggable)
        const terminal = terminalRef.current
        if (!terminal) return
        Draggable.create(terminal, {
          type: 'x,y',
          bounds: section,
          edgeResistance: 0.8,
        })
      } catch {
        // Draggable not available in this build
      }
    }
    loadDraggable()

    // Run first scenario on enter
    const { ScrollTrigger } = require('@/lib/gsap-setup')
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      once: true,
      onEnter: () => runScenario(DEMO_SCENARIOS[0]),
    })

    return () => {
      const { ScrollTrigger: ST } = require('@/lib/gsap-setup')
      ST.getAll().forEach((t: { kill: () => void }) => t.kill())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-6"
      className="relative w-full min-h-screen bg-[#050508] py-32 px-8 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto w-full">
        <div className="mb-12 text-center">
          <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-4">§6 — The Proof</span>
          <h2 className="font-display font-black text-[clamp(32px,5vw,56px)] text-[#FAFAFA] tracking-tight leading-none">
            Try it yourself
          </h2>
        </div>

        {/* Terminal window */}
        <div
          ref={terminalRef}
          className="mx-auto max-w-3xl bg-[#0A0A12] border border-[rgba(255,255,255,0.08)]"
          style={{ cursor: 'grab', userSelect: 'none', borderRadius: 0 }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-[#52525B] font-mono text-xs tracking-widest">cameleon-terminal</span>
          </div>

          {/* Output */}
          <div className="p-6 min-h-[280px] font-mono text-sm text-[#A1A1AA]">
            <pre
              ref={outputRef}
              className="whitespace-pre-wrap text-[#FAFAFA] font-mono text-xs leading-relaxed"
            >
              {`$ ${activeScenario.command}`}
            </pre>
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-[var(--accent)] align-middle animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/* Query chips */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {DEMO_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => runScenario(scenario)}
              className={`px-4 py-2 font-mono text-xs border transition-all duration-200 ${
                activeScenario.id === scenario.id
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                  : 'border-[rgba(255,255,255,0.08)] text-[#52525B] hover:border-[rgba(255,255,255,0.16)] hover:text-[#A1A1AA]'
              }`}
              style={{ borderRadius: '2px', cursor: 'pointer' }}
            >
              {scenario.chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
