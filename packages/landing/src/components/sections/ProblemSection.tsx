'use client'

import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap-setup'
import { MemoryCard } from '@/components/ui/MemoryCard'
import type { MemoryCardData } from '@/lib/types'

const CARDS: MemoryCardData[] = [
  { id: 'c1',  type: 'DECISION', title: 'Use JWT for authentication',      content: 'Chose JWT over session cookies for stateless scaling across regions.', project: 'auth-service', timestamp: '04-10' },
  { id: 'c2',  type: 'BUG',      title: 'Memory leak in stream handler',   content: 'ReadableStream not closed when client disconnects. All SSE endpoints.', project: 'api',          timestamp: '04-11' },
  { id: 'c3',  type: 'PERSON',   title: 'alex_r@studio',                   content: 'Lead architect. Prefers functional patterns. Dislikes OOP abstractions.', timestamp: '04-09' },
  { id: 'c4',  type: 'TASK',     title: 'Implement semantic search',       content: 'Add pgvector extension and 1536-dim embeddings for RAG pipeline.',        project: 'cameleon',     timestamp: '04-12' },
  { id: 'c5',  type: 'NOTE',     title: 'bcrypt rounds = 12',              content: 'Benchmarked on target hardware. 12 rounds ≈ 250ms — acceptable.',         project: 'auth-service', timestamp: '04-10' },
  { id: 'c6',  type: 'IDEA',     title: 'Multi-agent memory sharing',      content: 'Agents could share a session context pool. Reduces duplication ~60%.',    project: 'cameleon',     timestamp: '04-11' },
  { id: 'c7',  type: 'DECISION', title: 'Supabase RLS for multi-tenant',   content: 'Row-level security for full tenant isolation without app-layer filters.', project: 'cameleon',     timestamp: '04-12' },
  { id: 'c8',  type: 'LOG',      title: 'Deployed v1.4.2 to production',   content: 'feat/memory-search stable. 0 errors in first 2 hours.',                   project: 'cameleon',     timestamp: '04-12' },
  { id: 'c9',  type: 'BUG',      title: 'Race condition on session close',  content: 'Concurrent tool calls can race to write. Needs mutex or queue.',          project: 'cameleon',     timestamp: '04-12' },
  { id: 'c10', type: 'TASK',     title: 'Add rate limiting to MCP',        content: 'Token bucket 100 req/min per user. Redis-backed 1-hour window.',           project: 'api',          timestamp: '04-10' },
  { id: 'c11', type: 'NOTE',     title: 'Prefer Server Components',        content: 'Only use Client Components when interactivity or browser APIs needed.',    project: 'frontend',     timestamp: '04-09' },
  { id: 'c12', type: 'IDEA',     title: 'Context-aware code generation',   content: 'Generate code files with full project context — not just current file.',   project: 'cameleon',     timestamp: '04-11' },
]

export function ProblemSection() {
  const sectionRef  = useRef<HTMLElement>(null)
  const headingRef  = useRef<HTMLHeadingElement>(null)
  const gridRef     = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section  = sectionRef.current
    const heading  = headingRef.current
    const grid     = gridRef.current
    const question = questionRef.current
    if (!section || !heading || !grid || !question) return

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = []

    // Heading: words slide up from clip
    const split = new SplitText(heading, { type: 'lines,words', linesClass: 'clip-line' })
    const splitQ = new SplitText(question.querySelector('p'), { type: 'chars' })

    gsap.set(split.words, { y: '115%' })
    gsap.set(splitQ.chars, { opacity: 0, y: 28 })

    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      onEnter: () => {
        gsap.to(split.words, {
          y: '0%',
          duration: 0.9,
          stagger: 0.06,
          ease: 'power3.out',
        })
      },
    }))

    // Cards rain from the sky
    const cards = grid.querySelectorAll<HTMLElement>('.memory-card')
    gsap.set(cards, {
      y: () => gsap.utils.random(-350, -100) as number,
      x: () => gsap.utils.random(-30, 30) as number,
      rotation: () => gsap.utils.random(-18, 18) as number,
      opacity: 0,
    })

    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      onEnter: () => {
        gsap.to(cards, {
          y: 0,
          x: 0,
          rotation: () => gsap.utils.random(-4, 4),
          opacity: 1,
          stagger: { each: 0.055, from: 'random' },
          ease: 'back.out(1.1)',
          duration: 0.85,
        })
      },
    }))

    // Scrub: dissolve + blur as user scrolls past
    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'center center',
      end: 'bottom top',
      scrub: 1,
      onUpdate(self) {
        const p = self.progress
        gsap.set(cards, {
          opacity: 1 - p * 1.4,
          y: -40 * p,
          filter: `blur(${p * 7}px)`,
          scale: 1 - p * 0.08,
        })
      },
    }))

    // "What if" — chars drop in
    triggers.push(ScrollTrigger.create({
      trigger: question,
      start: 'top 82%',
      onEnter: () => {
        gsap.to(splitQ.chars, {
          opacity: 1,
          y: 0,
          stagger: 0.022,
          duration: 0.5,
          ease: 'power2.out',
        })
      },
    }))

    return () => {
      triggers.forEach(t => t.kill())
      split.revert()
      splitQ.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-2"
      className="relative w-full min-h-screen bg-[#050508] py-32 px-8 overflow-hidden"
    >
      {/* Grid pattern bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-[1440px] mx-auto">
        <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-6">
          §2 — The Forgetting
        </span>

        <h2
          ref={headingRef}
          className="font-display font-black text-[clamp(28px,4.5vw,52px)] text-[#FAFAFA] tracking-tight leading-tight mb-16 overflow-hidden"
        >
          Your AI forgets everything.<br />
          <span className="text-[#52525B]">Every. Single. Session.</span>
        </h2>

        {/* Cards raining grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{ perspective: '1200px' }}
        >
          {CARDS.map((card, i) => (
            <div
              key={card.id}
              style={{ transform: `translateY(${((i % 3) - 1) * 12}px)` }}
            >
              <MemoryCard
                card={card}
                className="memory-card w-full"
              />
            </div>
          ))}
        </div>

        {/* "What if" reveal */}
        <div ref={questionRef} className="mt-28 text-center">
          <p className="font-display font-black text-[clamp(22px,3.5vw,44px)] text-[#A1A1AA] tracking-tight">
            What if it didn&apos;t have to?
          </p>
        </div>
      </div>

      <style>{`.clip-line { overflow: hidden; display: block; }`}</style>
    </section>
  )
}
