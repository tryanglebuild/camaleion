'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap-setup'
import { MemoryCard } from '@/components/ui/MemoryCard'
import { Terminal } from '@/components/ui/Terminal'
import { FEATURES } from '@/data/features'
import type { MemoryCardData } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   PANEL 1 — TOTAL RECALL (Emerald)
   Full-bleed mosaic: infinite card marquee + live counter
═══════════════════════════════════════════════════════════ */
const MOSAIC_CARDS: MemoryCardData[] = [
  { id: 'm1', type: 'DECISION', title: 'JWT auth strategy',     content: 'Stateless scaling across 3 regions',    project: 'api',      timestamp: '04-10' },
  { id: 'm2', type: 'BUG',      title: 'Stream memory leak',    content: 'SSE endpoints — add close handler',    project: 'api',      timestamp: '04-11' },
  { id: 'm3', type: 'NOTE',     title: 'bcrypt = 12 rounds',    content: '~250ms on target hardware',            project: 'auth',     timestamp: '04-10' },
  { id: 'm4', type: 'TASK',     title: 'Add pgvector',          content: '1536-dim embeddings for RAG',          project: 'cameleon', timestamp: '04-12' },
  { id: 'm5', type: 'IDEA',     title: 'Agent memory pool',     content: 'Reduce duplication by ~60%',           project: 'cameleon', timestamp: '04-11' },
  { id: 'm6', type: 'DECISION', title: 'Supabase RLS',          content: 'Row-level security multi-tenant',      project: 'cameleon', timestamp: '04-12' },
  { id: 'm7', type: 'LOG',      title: 'v1.4.2 deployed',       content: '0 errors in first 2 hours',            project: 'cameleon', timestamp: '04-12' },
  { id: 'm8', type: 'PERSON',   title: 'alex_r@studio',         content: 'Lead architect, functional style',     timestamp: '04-09' },
  { id: 'm9', type: 'BUG',      title: 'Race condition',        content: 'Concurrent tool calls conflict',       project: 'cameleon', timestamp: '04-12' },
  { id: 'm10',type: 'TASK',     title: 'Rate limiting',         content: '100 req/min via Redis token bucket',   project: 'api',      timestamp: '04-10' },
]

const COUNTERS = [
  { label: 'Entries stored',    target: 847,    suffix: '' },
  { label: 'Tokens saved/day',  target: 142000, suffix: '' },
  { label: 'Projects covered',  target: 23,     suffix: '' },
]

function PanelMemory({ isActive }: { isActive: boolean }) {
  const row1Ref   = useRef<HTMLDivElement>(null)
  const row2Ref   = useRef<HTMLDivElement>(null)
  const statsRef  = useRef<HTMLDivElement>(null)
  const animated  = useRef(false)

  useEffect(() => {
    const r1 = row1Ref.current
    const r2 = row2Ref.current
    if (!r1 || !r2) return
    const tl1 = gsap.to(r1, { x: '-50%', duration: 20, repeat: -1, ease: 'none' })
    const tl2 = gsap.to(r2, { x: '0%',   duration: 26, repeat: -1, ease: 'none', immediateRender: false })
    gsap.set(r2, { x: '-50%' })
    return () => { tl1.kill(); tl2.kill() }
  }, [])

  useEffect(() => {
    if (!isActive || animated.current) return
    animated.current = true
    const stats = statsRef.current
    if (!stats) return
    stats.querySelectorAll<HTMLElement>('.counter-val').forEach((el) => {
      const target = Number(el.dataset.target)
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(obj.val).toLocaleString() },
      })
    })
    gsap.from(stats.querySelectorAll('.counter-item'), {
      y: 24, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out',
    })
  }, [isActive])

  const doubled = [...MOSAIC_CARDS, ...MOSAIC_CARDS]

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Row 1 — left to right */}
      <div className="flex-1 flex items-center overflow-hidden">
        <div ref={row1Ref} className="flex gap-3 shrink-0" style={{ width: 'max-content' }}>
          {doubled.map((c, i) => <MemoryCard key={`r1-${i}`} card={c} className="w-52 shrink-0" />)}
        </div>
      </div>
      {/* Row 2 — right to left */}
      <div className="flex-1 flex items-center overflow-hidden">
        <div ref={row2Ref} className="flex gap-3 shrink-0" style={{ width: 'max-content' }}>
          {[...doubled].reverse().map((c, i) => <MemoryCard key={`r2-${i}`} card={c} className="w-52 shrink-0" />)}
        </div>
      </div>

      {/* Punched center */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 52% 40% at center, #050508 38%, transparent 100%)' }}
      >
        <h3
          className="font-display font-black text-[clamp(36px,5.5vw,76px)] leading-none tracking-[-0.03em] text-center mb-3"
          style={{ color: 'var(--accent)', textShadow: '0 0 60px var(--accent-glow)' }}
        >
          Total Recall
        </h3>
        <p className="text-[#A1A1AA] text-sm max-w-xs text-center mb-6">
          Every decision. Every bug. Every context. Never lost.
        </p>

        {/* Live counters */}
        <div ref={statsRef} className="flex gap-6 pointer-events-none">
          {COUNTERS.map((c) => (
            <div key={c.label} className="counter-item text-center">
              <div
                className="counter-val font-display font-black text-2xl leading-none"
                style={{ color: 'var(--accent)' }}
                data-target={c.target}
              >0</div>
              <div className="text-[#52525B] font-mono text-[9px] tracking-widest uppercase mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(to right, #050508, transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(to left, #050508, transparent)' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PANEL 2 — SEMANTIC SEARCH (Violet)
   Animated vector space + search demo
═══════════════════════════════════════════════════════════ */
const SEARCH_RESULTS = [
  { score: 0.97, text: 'JWT over sessions — 2026-04-10 · auth-service', type: 'DECISION' },
  { score: 0.92, text: 'bcrypt rounds=12, ~250ms — stateless auth config', type: 'NOTE' },
  { score: 0.88, text: 'Rate limiting: 100 req/min per user via Redis', type: 'TASK' },
  { score: 0.71, text: 'Deployed v1.4.2 — auth refactor included', type: 'LOG' },
]

const TYPE_C: Record<string, string> = {
  DECISION: '#8B5CF6', NOTE: '#A1A1AA', TASK: '#F59E0B', LOG: '#52525B',
}

function PanelSearch({ isActive }: { isActive: boolean }) {
  const queryRef    = useRef<HTMLSpanElement>(null)
  const resultsRef  = useRef<HTMLDivElement>(null)
  const dotsRef     = useRef<SVGSVGElement>(null)
  const animated    = useRef(false)

  // Generate deterministic node positions
  const NODES = Array.from({ length: 80 }, (_, i) => ({
    cx: 10 + Math.sin(i * 2.4) * 36 + 50,
    cy: 10 + Math.cos(i * 1.7) * 36 + 50,
    r:  1 + (i % 3) * 0.8,
    op: 0.2 + (i % 4) * 0.15,
    pulse: i % 7 === 0,
  }))

  useEffect(() => {
    if (!isActive || animated.current) return
    animated.current = true
    const svg  = dotsRef.current
    const qel  = queryRef.current
    const rDiv = resultsRef.current
    if (!svg || !qel || !rDiv) return

    // Dots scatter in
    const circles = svg.querySelectorAll('circle')
    gsap.from(circles, {
      scale: 0, opacity: 0, stagger: { each: 0.012, from: 'random' },
      duration: 0.6, ease: 'back.out(2)', delay: 0.1,
      transformOrigin: 'center',
    })

    // Type the query
    const query = 'What did we decide about auth?'
    let i = 0
    const typeId = setInterval(() => {
      if (i > query.length) { clearInterval(typeId); runSearch(rDiv); return }
      qel.textContent = query.slice(0, i++)
    }, 38)

    function runSearch(div: HTMLDivElement) {
      gsap.to(div, { opacity: 1, duration: 0.3 })
      const rows = div.querySelectorAll('.result-row')
      gsap.from(rows, { y: 12, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out', delay: 0.2 })
      // Highlight related dots
      gsap.to(circles, { opacity: (i) => i < 12 ? 0.9 : 0.08, stagger: 0.01, duration: 0.4 })
    }
  }, [isActive])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 px-8 lg:px-12">
      {/* Vector space — 45% */}
      <div className="relative w-full lg:w-[42%] aspect-square max-h-[min(42vw,380px)] shrink-0">
        <svg ref={dotsRef} viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Cluster edges */}
          {NODES.slice(0, 16).map((n, i) => (
            <line key={i}
              x1={`${n.cx}%`} y1={`${n.cy}%`}
              x2={`${NODES[(i + 4) % 16].cx}%`} y2={`${NODES[(i + 4) % 16].cy}%`}
              stroke="var(--accent)" strokeWidth="0.18" opacity="0.15" />
          ))}
          {NODES.map((n, i) => (
            <circle key={i} cx={`${n.cx}%`} cy={`${n.cy}%`} r={n.r}
              fill={i < 12 ? 'var(--accent)' : '#8B5CF6'}
              opacity={n.op} />
          ))}
          {/* Origin */}
          <circle cx="50%" cy="50%" r="3.5" fill="var(--accent)" opacity="0.95" />
          <circle cx="50%" cy="50%" r="8"   fill="none" stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.5" />
          {/* Labels */}
          <text x="52%" y="46%" fill="#FAFAFA" fontSize="2.2" opacity="0.7" fontFamily="monospace">auth.decision</text>
        </svg>
      </div>

      {/* Search panel — 55% */}
      <div className="w-full lg:flex-1">
        <h3 className="font-display font-black text-[clamp(28px,3.5vw,52px)] leading-none tracking-tight text-[#FAFAFA] mb-6">
          Semantic<br />
          <span style={{ color: 'var(--accent)' }}>Search</span>
        </h3>

        {/* Search input mock */}
        <div
          className="flex items-center gap-2 border border-[rgba(255,255,255,0.1)] bg-[#0A0A12] px-4 py-3 mb-5 font-mono text-sm"
          style={{ borderRadius: '2px' }}
        >
          <span style={{ color: 'var(--accent)' }}>⌕</span>
          <span ref={queryRef} className="text-[#FAFAFA] flex-1 min-h-[1em]" />
          <span className="w-1.5 h-4 bg-[var(--accent)] opacity-80 animate-pulse" />
        </div>

        {/* Results */}
        <div ref={resultsRef} className="space-y-2" style={{ opacity: 0 }}>
          {SEARCH_RESULTS.map((r, i) => (
            <div
              key={i}
              className="result-row flex items-center gap-3 px-3 py-2.5 border border-[rgba(255,255,255,0.05)] bg-[#0A0A12]"
              style={{ borderRadius: '2px' }}
            >
              <div
                className="font-mono text-[10px] px-1.5 py-0.5 shrink-0"
                style={{ color: TYPE_C[r.type] || '#A1A1AA', backgroundColor: `${TYPE_C[r.type] || '#A1A1AA'}15`, borderRadius: '2px' }}
              >
                {r.type}
              </div>
              <span className="text-[#A1A1AA] text-xs flex-1 font-mono truncate">{r.text}</span>
              <span className="text-[#3F3F46] font-mono text-[10px] shrink-0">
                {(r.score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <p className="text-[#3F3F46] font-mono text-[10px] text-right pt-1">
            4 of 847 results · 23ms
          </p>
        </div>

        <p className="text-[#52525B] text-sm mt-5">
          Not keywords — meaning. Ask anything about your codebase.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PANEL 3 — ORCHESTRATION (Amber)
   Animated agent messages + task flow
═══════════════════════════════════════════════════════════ */
const AGENT_MESSAGES = [
  { from: 'orchestrator', to: 'backend',      text: 'Implement JWT rotation endpoint',    delay: 0    },
  { from: 'backend',      to: 'orchestrator', text: 'Working… injecting 8 entries ✓',     delay: 0.9  },
  { from: 'orchestrator', to: 'tester',       text: 'Verify auth flow on /refresh',        delay: 1.7  },
  { from: 'tester',       to: 'orchestrator', text: 'PASS — 7/7 scenarios covered ✓',     delay: 2.6  },
  { from: 'orchestrator', to: 'all',          text: 'Session complete. Closing.',          delay: 3.4  },
]

const AGENT_COLORS: Record<string, string> = {
  orchestrator: '#F59E0B', backend: '#00FF88', tester: '#06B6D4', all: '#8B5CF6',
}

function PanelAgents({ isActive }: { isActive: boolean }) {
  const msgsRef  = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    if (!isActive || animated.current) return
    animated.current = true
    const container = msgsRef.current
    if (!container) return

    AGENT_MESSAGES.forEach((msg) => {
      setTimeout(() => {
        const el = document.createElement('div')
        el.className = 'msg-line flex items-start gap-3 font-mono text-xs py-2 border-b border-[rgba(255,255,255,0.04)]'
        el.innerHTML = `
          <span style="color:${AGENT_COLORS[msg.from] ?? '#A1A1AA'};min-width:96px" class="shrink-0 font-bold">${msg.from}</span>
          <span style="color:#52525B" class="shrink-0">→ ${msg.to}</span>
          <span style="color:#FAFAFA" class="flex-1">${msg.text}</span>
        `
        gsap.set(el, { opacity: 0, x: -16 })
        container.appendChild(el)
        gsap.to(el, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' })
      }, msg.delay * 1000)
    })
  }, [isActive])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden">
      {/* Left: agents roster */}
      <div
        className="w-full lg:w-[38%] flex flex-col justify-center px-8 lg:px-10 border-r border-[rgba(255,255,255,0.05)] shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.04), transparent)' }}
      >
        <div className="font-mono text-[10px] tracking-widest text-[#52525B] uppercase mb-5">Active Agents</div>
        {Object.entries(AGENT_COLORS).filter(([k]) => k !== 'all').map(([name, color]) => (
          <div
            key={name}
            className="flex items-center gap-3 border px-4 py-3 mb-3 font-mono text-sm"
            style={{ borderColor: `${color}30`, color, borderRadius: '2px', backgroundColor: `${color}06` }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="uppercase tracking-widest text-xs">{name}</span>
            {name === 'orchestrator' && <span className="ml-auto text-[10px] opacity-50">coordinator</span>}
          </div>
        ))}

        <div className="mt-6 font-mono text-[10px] text-[#3F3F46]">
          shared memory ↯ 12 entries injected
        </div>
      </div>

      {/* Right: message log */}
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.05)] bg-[#0A0A12] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-[#52525B] tracking-widest">session.log</span>
        </div>
        <div
          ref={msgsRef}
          className="flex-1 p-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100% - 40px)' }}
        />
        <div className="px-5 py-3 bg-[#0A0A12] border-t border-[rgba(255,255,255,0.05)] text-center">
          <h3
            className="font-display font-black text-[clamp(22px,3vw,40px)] leading-none tracking-tight text-[#FAFAFA] mb-1"
          >
            Orchestrated
            <span style={{ color: 'var(--accent)' }}> Intelligence</span>
          </h3>
          <p className="text-[#52525B] text-xs font-mono">Agents that share memory and context</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PANEL 4 — RULES (Cyan)
   Fullscreen terminal with rule enforcement animation
═══════════════════════════════════════════════════════════ */
const ALL_RULES = [
  { id: 'P1',  trigger: 'person mentioned',          action: 'verify via get_people()', priority: 10, active: true  },
  { id: 'PR1', trigger: 'project mentioned',          action: 'verify via get_projects()', priority: 10, active: true  },
  { id: 'T2',  trigger: '"task" or "todo" intent',   action: 'add_entry(type=task)',     priority: 8,  active: true  },
  { id: 'D1',  trigger: 'decision identified',        action: 'add_entry(type=decision)', priority: 9,  active: true  },
  { id: 'L1',  trigger: 'lesson or learning',        action: 'add_entry(tags=[lesson])', priority: 7,  active: true  },
  { id: 'O1',  trigger: 'preference expressed',      action: 'add_entry(type=note)',     priority: 6,  active: false },
  { id: 'R1',  trigger: '"remind me of X"',          action: 'add_entry(priority=high)', priority: 9,  active: true  },
]

function PanelRules({ isActive }: { isActive: boolean }) {
  const tableRef = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    if (!isActive || animated.current) return
    animated.current = true
    const rows = tableRef.current?.querySelectorAll('.rule-row')
    if (rows) {
      gsap.from(rows, { opacity: 0, x: -18, stagger: 0.07, duration: 0.45, ease: 'power2.out', delay: 0.1 })
    }
    // Flash "P1" rule as if being triggered
    setTimeout(() => {
      const first = tableRef.current?.querySelector('.rule-row')
      if (first) {
        gsap.to(first, { backgroundColor: 'rgba(6,182,212,0.12)', duration: 0.15, yoyo: true, repeat: 3 })
      }
    }, 1200)
  }, [isActive])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 lg:px-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h3 className="font-display font-black text-[clamp(28px,4vw,56px)] leading-none tracking-tight text-[#FAFAFA] mb-2">
            Your AI,
            <span style={{ color: 'var(--accent)' }}> Your Rules</span>
          </h3>
          <p className="text-[#A1A1AA] text-sm max-w-md">
            Hard rules. Soft preferences. Persistently enforced. Define once, respected forever.
          </p>
        </div>

        {/* Rules table */}
        <div
          ref={tableRef}
          className="border border-[rgba(255,255,255,0.06)] overflow-hidden font-mono text-xs"
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[#0A0A12] text-[#3F3F46] uppercase tracking-widest text-[10px]">
            <span className="w-10 shrink-0">ID</span>
            <span className="flex-1">Trigger</span>
            <span className="w-48 shrink-0 hidden md:block">Action</span>
            <span className="w-8 shrink-0 text-right">P</span>
            <span className="w-10 shrink-0 text-right">On</span>
          </div>
          {ALL_RULES.map((rule) => (
            <div
              key={rule.id}
              className="rule-row flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            >
              <span
                className="w-10 shrink-0 px-1.5 py-0.5 text-center"
                style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-glow)', borderRadius: '2px' }}
              >
                {rule.id}
              </span>
              <span className="text-[#A1A1AA] flex-1 truncate">{rule.trigger}</span>
              <span className="text-[#52525B] w-48 shrink-0 hidden md:block truncate">{rule.action}</span>
              <span className="text-[#3F3F46] w-8 shrink-0 text-right">{rule.priority}</span>
              <div
                className="w-3 h-3 rounded-full shrink-0 ml-auto"
                style={{ backgroundColor: rule.active ? 'var(--accent)' : '#3F3F46', boxShadow: rule.active ? '0 0 6px var(--accent-glow)' : 'none' }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 mt-4 font-mono text-[10px] text-[#3F3F46]">
          <span><span style={{ color: 'var(--accent)' }}>●</span> 6 rules active</span>
          <span>● 1 inactive</span>
          <span className="ml-auto">Last evaluated: 1s ago</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PANEL 5 — CONTENT CREATION (Rose)
   Multi-platform post generation pipeline
═══════════════════════════════════════════════════════════ */
const PLATFORM_POSTS = [
  {
    platform: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    user: 'Sarah M.',
    role: 'Frontend Engineer',
    avatar: 47,
    text: '🚀 Just shipped a massive auth refactor thanks to CAMELEON. Every trade-off from 3 weeks of work was right there when I needed to justify decisions to the team. This is how AI-assisted development should work.',
    likes: 847,
    reposts: 234,
  },
  {
    platform: 'Twitter',
    icon: '𝕏',
    color: '#FAFAFA',
    user: 'devmarcus',
    role: 'Full-stack · @devmarcus',
    avatar: 12,
    text: 'Holy moly CAMELEON just recalled a decision I made 3 weeks ago that I had completely forgotten about. No more "why did we do this again" conversations. The AI just KNOWS.',
    likes: 2340,
    reposts: 891,
  },
]

function PanelContent({ isActive }: { isActive: boolean }) {
  const pipeRef  = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    if (!isActive || animated.current) return
    animated.current = true
    const steps = pipeRef.current?.querySelectorAll('.pipe-step')
    if (steps) {
      gsap.from(steps, { x: 20, opacity: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out', delay: 0.2 })
    }
    const cards = document.querySelectorAll('.platform-card')
    gsap.from(cards, { y: 24, opacity: 0, stagger: 0.12, duration: 0.55, ease: 'power2.out' })
  }, [isActive])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden">
      {/* Left: pipeline */}
      <div
        className="w-full lg:w-[32%] flex flex-col justify-center px-8 border-r border-[rgba(255,255,255,0.05)] shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.04), transparent)' }}
      >
        <h3 className="font-display font-black text-[clamp(24px,3vw,44px)] leading-none tracking-tight text-[#FAFAFA] mb-6">
          Create From<br />
          <span style={{ color: 'var(--accent)' }}>Context</span>
        </h3>

        <div ref={pipeRef} className="space-y-4">
          {[
            { icon: '◈', label: 'Your work this week',    done: true  },
            { icon: '⌕', label: 'RAG context pulled',     done: true  },
            { icon: '◎', label: 'generate_posts()',        done: true  },
            { icon: '▷', label: 'LinkedIn draft ✓',        done: true  },
            { icon: '▷', label: 'Twitter/X draft ✓',       done: true  },
            { icon: '▷', label: 'Newsletter section ✓',    done: false },
          ].map((s, i) => (
            <div key={i} className="pipe-step flex items-center gap-3">
              <span className="font-mono text-sm shrink-0" style={{ color: s.done ? 'var(--accent)' : '#52525B' }}>
                {s.icon}
              </span>
              <span className="font-mono text-xs" style={{ color: s.done ? '#FAFAFA' : '#52525B' }}>
                {s.label}
              </span>
              {s.done && i < 3 && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 font-mono text-[10px] text-[#3F3F46]">
          context: 23 entries · 3 projects
        </div>
      </div>

      {/* Right: platform cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="font-mono text-[10px] text-[#52525B] tracking-widest uppercase mb-4">
          Generated Posts
        </div>
        {PLATFORM_POSTS.map((post) => (
          <div
            key={post.platform}
            className="platform-card border border-[rgba(255,255,255,0.08)] bg-[#0A0A12] p-5"
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-5 h-5 rounded-sm flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: post.color, color: post.color === '#FAFAFA' ? '#000' : '#fff' }}
              >
                {post.icon}
              </div>
              <span className="font-mono text-[10px] text-[#52525B] tracking-widest uppercase">{post.platform}</span>
              <div className="flex items-center gap-2 ml-4">
                <img
                  src={`https://i.pravatar.cc/24?img=${post.avatar}`}
                  alt=""
                  width={24} height={24}
                  className="rounded-full"
                  style={{ filter: 'grayscale(0.6)' }}
                />
                <div>
                  <div className="text-[#FAFAFA] font-medium text-xs">{post.user}</div>
                  <div className="text-[#3F3F46] text-[10px]">{post.role}</div>
                </div>
              </div>
            </div>
            <p className="text-[#A1A1AA] text-xs leading-relaxed mb-3">{post.text}</p>
            <div className="flex items-center gap-5 border-t border-[rgba(255,255,255,0.04)] pt-2.5 font-mono text-[10px] text-[#3F3F46]">
              <span>♥ {post.likes.toLocaleString()}</span>
              <span>↺ {post.reposts.toLocaleString()}</span>
              <span
                className="ml-auto px-2 py-0.5 border cursor-pointer hover:opacity-80"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)', borderRadius: '2px' }}
              >
                Copy
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN FeaturesSection
═══════════════════════════════════════════════════════════ */
type PanelProps = { isActive: boolean }
const PANEL_COMPS: Array<React.ComponentType<PanelProps>> = [
  PanelMemory, PanelSearch, PanelAgents, PanelRules, PanelContent,
]

export function FeaturesSection() {
  const wrapperRef  = useRef<HTMLElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const dotsRef     = useRef<HTMLDivElement>(null)
  const labelRef    = useRef<HTMLSpanElement>(null)
  const activeRef   = useRef(-1)

  // Track which panel is active (to pass isActive prop)
  const activePanelStates = useRef<Record<number, boolean>>({})
  const panelRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const wrapper = wrapperRef.current
    const track   = trackRef.current
    const dots    = dotsRef.current
    const label   = labelRef.current
    if (!wrapper || !track || !dots) return

    const N = FEATURES.length
    let currentActive = -1

    ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      end: () => `+=${(N - 1) * window.innerWidth}`,
      scrub: 1.2,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const x = -(self.progress * (N - 1) * window.innerWidth)
        gsap.set(track, { x })

        const idx = Math.round(self.progress * (N - 1))

        // Update dots + label
        dots.querySelectorAll<HTMLElement>('.feat-dot').forEach((d, i) => {
          const isNow = i === idx
          d.style.transform = isNow ? 'scaleX(2.4)' : 'scaleX(1)'
          d.style.backgroundColor = isNow ? 'var(--accent)' : 'rgba(255,255,255,0.18)'
        })

        if (label) {
          const f = FEATURES[idx]
          if (f && label.textContent !== f.name) {
            gsap.to(label, { opacity: 0, duration: 0.15, onComplete: () => {
              label.textContent = f.name
              gsap.to(label, { opacity: 1, duration: 0.2 })
            }})
          }
        }

        // Fire panel activation once per panel
        if (idx !== currentActive) {
          currentActive = idx

          // Update accent
          const f = FEATURES[idx]
          if (f) {
            gsap.to(document.documentElement, {
              '--accent': f.accent,
              duration: 0,
              onUpdate() {
                document.documentElement.style.setProperty('--accent', f.accent)
                document.documentElement.style.setProperty('--accent-glow', f.glow)
              },
            })
          }

          // Mark panel as active via data attribute for React state
          const panel = panelRefs.current[idx]
          if (panel) {
            panel.dispatchEvent(new CustomEvent('panel-activate'))
          }
        }
      },
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  // Each panel wrapper uses a custom event + local state for isActive
  function PanelWrapper({ index, children }: { index: number; children: React.ReactNode }) {
    const divRef = useRef<HTMLDivElement>(null)
    const [isActive, setIsActive] = useState(index === 0)

    useEffect(() => {
      const el = divRef.current
      if (!el) return
      panelRefs.current[index] = el
      const onActivate = () => setIsActive(true)
      el.addEventListener('panel-activate', onActivate)
      return () => el.removeEventListener('panel-activate', onActivate)
    }, [index])

    const Comp = PANEL_COMPS[index]
    return (
      <div
        ref={divRef}
        className="feat-panel shrink-0 relative overflow-hidden"
        style={{
          width: '100vw',
          height: 'calc(100vh - 52px)',
          backgroundColor: '#050508',
          borderRight: `1px solid ${FEATURES[index].accent}10`,
        }}
      >
        <Comp isActive={isActive} />
        <div
          className="absolute top-6 right-8 font-mono text-[10px] tracking-widest"
          style={{ color: FEATURES[index].accent, opacity: 0.4 }}
        >
          0{index + 1} / 0{FEATURES.length}
        </div>
      </div>
    )
  }

  return (
    <section ref={wrapperRef} id="section-5" style={{ height: `${FEATURES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#050508]">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-3.5 bg-[rgba(5,5,8,0.9)] border-b border-[rgba(255,255,255,0.05)] backdrop-blur-sm" style={{ height: '52px' }}>
          <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase">
            §5 — The Spectrum
          </span>
          <span
            ref={labelRef}
            className="font-display font-bold text-sm"
            style={{ color: 'var(--accent)' }}
          >
            {FEATURES[0].name}
          </span>
          <div ref={dotsRef} className="flex items-center gap-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.id}
                className="feat-dot h-1 rounded-full transition-transform duration-300"
                style={{
                  width: '20px',
                  backgroundColor: i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                  transform: i === 0 ? 'scaleX(2.4)' : 'scaleX(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex"
          style={{
            width: `${FEATURES.length * 100}vw`,
            height: '100%',
            paddingTop: '52px',
            willChange: 'transform',
          }}
        >
          {FEATURES.map((_, i) => (
            <PanelWrapper key={i} index={i}>{null}</PanelWrapper>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 font-mono text-[10px] text-[#3F3F46] tracking-widest uppercase flex items-center gap-3">
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          scroll to advance
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>
    </section>
  )
}
