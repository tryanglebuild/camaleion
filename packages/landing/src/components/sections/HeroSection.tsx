'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap, SplitText } from '@/lib/gsap-setup'

/* ─── Neural-network node ─────────────────────────────────────────── */
interface NetNode {
  x: number; y: number
  vx: number; vy: number
  r: number
  colorIdx: number
  phase: number
  phaseSpeed: number
  opacity: number
}

/* ─── Live memory feed entries ───────────────────────────────────────*/
const FEED = [
  { type: 'decision', text: 'API streaming via SSE — not WebSockets' },
  { type: 'note',     text: 'User prefers terminal aesthetic UI' },
  { type: 'task',     text: 'Implement semantic search layer' },
  { type: 'log',      text: 'Session #847 — 12 entries persisted' },
  { type: 'decision', text: 'Supabase selected as vector store' },
  { type: 'note',     text: 'Team: Tryangle — last active 3m ago' },
  { type: 'idea',     text: 'Add real-time collaboration mode' },
  { type: 'log',      text: 'Context restored — 2,341 tokens' },
  { type: 'task',     text: 'Build multi-agent orchestration layer' },
  { type: 'note',     text: 'Project: project-ai-system active' },
  { type: 'decision', text: 'MCP protocol for all agent tool calls' },
  { type: 'log',      text: 'Memory index rebuilt in 0.34s' },
]

const TYPE_COLOR: Record<string, string> = {
  decision: '#E879F9',
  note:     '#38BDF8',
  task:     '#34D399',
  log:      '#FB923C',
  idea:     '#F87171',
}

const ACCENTS = ['#E879F9', '#38BDF8', '#34D399', '#FB923C', '#F87171']
const GLYPHS  = '▓░▒█▀▄◆◇○●■□▪▫◉⊕⊗∆∇⟨⟩'

/* ─── Scramble one element to its final text ─────────────────────────*/
function scrambleTo(el: HTMLElement, final: string, dur: number) {
  let frame = 0
  const fps   = 28
  const total = Math.ceil(dur * fps)
  const id = setInterval(() => {
    frame++
    if (frame >= total) { el.textContent = final; clearInterval(id); return }
    const p = frame / total
    let s = ''
    for (let i = 0; i < final.length; i++) {
      if (final[i] === ' ') { s += ' '; continue }
      s += p > i / final.length
        ? final[i]
        : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    }
    el.textContent = s
  }, 1000 / fps)
  return () => clearInterval(id)
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const titleRef   = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const ctaRef     = useRef<HTMLDivElement>(null)
  const feedRef    = useRef<HTMLDivElement>(null)
  const ctaBtnRef  = useRef<HTMLButtonElement>(null)
  const mouseRef   = useRef({ x: -9999, y: -9999 })
  const rafRef     = useRef<number>(0)
  const nodesRef   = useRef<NetNode[]>([])
  const [feedTop, setFeedTop] = useState(0)

  /* ── Canvas neural network ──────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = typeof window !== 'undefined' && window.innerWidth < 768 ? 45 : 90
    nodesRef.current = Array.from({ length: COUNT }, () => ({
      x:          Math.random() * canvas.width,
      y:          Math.random() * canvas.height,
      vx:         (Math.random() - 0.5) * 0.35,
      vy:         (Math.random() - 0.5) * 0.35,
      r:          Math.random() * 1.8 + 0.8,
      colorIdx:   Math.floor(Math.random() * ACCENTS.length),
      phase:      Math.random() * Math.PI * 2,
      phaseSpeed: 0.015 + Math.random() * 0.025,
      opacity:    0,
    }))

    const MAX_DIST = 155
    let lastTime   = 0

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.67, 3)
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mx    = mouseRef.current.x
      const my    = mouseRef.current.y
      const nodes = nodesRef.current

      for (const n of nodes) {
        n.opacity = Math.min(1, n.opacity + 0.01)
        n.phase  += n.phaseSpeed * dt

        const dx = mx - n.x
        const dy = my - n.y
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < 230 && d > 1) {
          n.vx += (dx / d) * 0.016 * dt
          n.vy += (dy / d) * 0.016 * dt
        }

        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        if (spd > 1.3) { n.vx /= spd; n.vy /= spd }
        n.vx *= 0.996; n.vy *= 0.996

        n.x += n.vx * dt; n.y += n.vy * dt
        if (n.x < 0 || n.x > canvas.width)  { n.vx *= -1; n.x = Math.max(0, Math.min(canvas.width,  n.x)) }
        if (n.y < 0 || n.y > canvas.height) { n.vy *= -1; n.y = Math.max(0, Math.min(canvas.height, n.y)) }
      }

      /* edges */
      ctx.lineWidth = 0.5
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX_DIST) {
            const a = (1 - d / MAX_DIST) * 0.11 * nodes[i].opacity
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${a})`
            ctx.stroke()
          }
        }
      }

      /* nodes */
      for (const n of nodes) {
        const col  = ACCENTS[n.colorIdx]
        const glow = (0.35 + Math.sin(n.phase) * 0.25) * n.opacity
        const rad  = n.r + Math.sin(n.phase) * 0.5

        const hex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad * 7)
        g.addColorStop(0, col + hex(glow * 70))
        g.addColorStop(1, col + '00')
        ctx.beginPath()
        ctx.arc(n.x, n.y, rad * 7, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        ctx.beginPath()
        ctx.arc(n.x, n.y, rad, 0, Math.PI * 2)
        ctx.fillStyle = col + hex(glow * 255)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  /* ── Mouse tracking ─────────────────────────────────────────────── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  /* ── Click: spawn glowing node + ripple ─────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const onClick = (e: MouseEvent) => {
      const dot = document.createElement('div')
      dot.style.cssText = [
        'position:fixed',
        `left:${e.clientX}px`,
        `top:${e.clientY}px`,
        'width:6px',
        'height:6px',
        'border-radius:50%',
        'transform:translate(-50%,-50%)',
        'background:var(--accent)',
        'box-shadow:0 0 14px var(--accent)',
        'pointer-events:none',
        'z-index:9999',
      ].join(';')
      document.body.appendChild(dot)

      const ring = document.createElement('div')
      ring.style.cssText = [
        'position:fixed',
        `left:${e.clientX}px`,
        `top:${e.clientY}px`,
        'width:4px',
        'height:4px',
        'border-radius:50%',
        'border:1.5px solid var(--accent)',
        'transform:translate(-50%,-50%)',
        'pointer-events:none',
        'z-index:9999',
      ].join(';')
      document.body.appendChild(ring)

      gsap.timeline({ onComplete: () => { dot.remove(); ring.remove() } })
        .to(dot,  { scale: 5, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0)
        .to(ring, { width: 220, height: 220, opacity: 0, duration: 0.9, ease: 'power2.out' }, 0)
    }

    section.addEventListener('click', onClick)
    return () => section.removeEventListener('click', onClick)
  }, [])

  /* ── Title entrance + per-letter hover ──────────────────────────── */
  useEffect(() => {
    const title   = titleRef.current
    const tagline = taglineRef.current
    const stats   = statsRef.current
    const cta     = ctaRef.current
    const feed    = feedRef.current
    if (!title || !tagline || !stats || !cta || !feed) return

    const split = new SplitText(title, { type: 'chars' })

    gsap.set(split.chars, {
      opacity:    0,
      y:          -100,
      rotation:   () => gsap.utils.random(-30, 30) as number,
      filter:     'blur(6px)',
      display:    'inline-block',
    })
    gsap.set([tagline, stats, cta, feed], { opacity: 0, y: 22 })

    const tl = gsap.timeline({ delay: 0.25 })

    tl.to(split.chars, {
      opacity:  1,
      y:        0,
      rotation: 0,
      filter:   'blur(0px)',
      duration: 0.65,
      ease:     'back.out(1.5)',
      stagger:  { each: 0.055, from: 'start' },
      onStart() {
        split.chars.forEach((c, i) => {
          const el    = c as HTMLElement
          const final = el.textContent || ''
          const delay = i * 55
          setTimeout(() => scrambleTo(el, final, 0.4), delay)
        })
      },
    })
    .to(tagline, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.35')
    .to(stats,   { opacity: 1, y: 0, duration: 0.5,  ease: 'power2.out' }, '-=0.4')
    .to(cta,     { opacity: 1, y: 0, duration: 0.5,  ease: 'power2.out' }, '-=0.4')
    .to(feed,    { opacity: 1, y: 0, duration: 0.5,  ease: 'power2.out' }, '-=0.45')

    /* Per-letter hover */
    split.chars.forEach((char, i) => {
      const el    = char as HTMLElement
      el.style.cursor = 'default'

      el.addEventListener('mouseenter', () => {
        gsap.to(el, {
          y:          -18,
          scale:       1.2,
          color:       ACCENTS[i % ACCENTS.length],
          textShadow: `0 0 40px ${ACCENTS[i % ACCENTS.length]}, 0 0 80px ${ACCENTS[i % ACCENTS.length]}60`,
          duration:    0.18,
          ease:        'back.out(2)',
        })
        const prev = split.chars[i - 1] as HTMLElement | undefined
        const next = split.chars[i + 1] as HTMLElement | undefined
        if (prev) gsap.to(prev, { y: 5, scale: 0.95, duration: 0.18 })
        if (next) gsap.to(next, { y: 5, scale: 0.95, duration: 0.18 })
      })

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          y:          0,
          scale:       1,
          color:       '#ffffff',
          textShadow: 'none',
          duration:    0.55,
          ease:        'elastic.out(1, 0.4)',
        })
        const prev = split.chars[i - 1] as HTMLElement | undefined
        const next = split.chars[i + 1] as HTMLElement | undefined
        if (prev) gsap.to(prev, { y: 0, scale: 1, duration: 0.45, ease: 'elastic.out(1,0.4)' })
        if (next) gsap.to(next, { y: 0, scale: 1, duration: 0.45, ease: 'elastic.out(1,0.4)' })
      })
    })

    return () => split.revert()
  }, [])

  /* ── Live feed ticker ───────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setFeedTop(t => t + 1), 2200)
    return () => clearInterval(id)
  }, [])

  /* ── Magnetic CTA ───────────────────────────────────────────────── */
  useEffect(() => {
    const btn = ctaBtnRef.current
    if (!btn) return
    const onMove  = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect()
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.42, y: (e.clientY - r.top - r.height / 2) * 0.42, duration: 0.25 })
    }
    const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1,0.4)' })
    btn.addEventListener('mousemove',  onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave) }
  }, [])

  const visibleFeed = Array.from({ length: 5 }, (_, i) => FEED[(feedTop + i) % FEED.length])

  return (
    <section
      ref={sectionRef}
      id="section-1"
      className="relative w-full h-screen overflow-hidden bg-[#050508]"
    >
      {/* Neural-network canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Radial vignette – pulls focus to centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 65% at 50% 50%, transparent 10%, rgba(5,5,8,0.55) 65%, #050508 100%)',
        }}
      />

      {/* ── TOP META BAR ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5 pointer-events-none">
        <span className="font-mono text-[10px] tracking-[0.35em] text-[#3F3F46] uppercase">
          CAMELEON / v1.0.0
        </span>
        <span className="font-mono text-[10px] tracking-[0.25em] text-[#3F3F46] flex items-center gap-1.5">
          <span style={{ color: 'var(--accent)' }}>●</span>
          SYSTEM ONLINE
        </span>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-5 px-6">

        {/* Eyebrow */}
        <p className="font-mono text-[11px] tracking-[0.42em] text-[#52525B] uppercase">
          The Adaptive Context Engine
        </p>

        {/* ── TITLE ──────────────────────────────────────────────── */}
        <h1
          ref={titleRef}
          className="text-white uppercase leading-none select-none"
          style={{
            fontFamily:    'var(--font-space-grotesk)',
            fontWeight:    700,
            fontSize:      'clamp(4rem, 13.5vw, 12.5rem)',
            letterSpacing: '-0.03em',
          }}
        >
          CAMELEON
        </h1>

        {/* Tagline */}
        <p ref={taglineRef} className="font-mono text-sm text-[#71717A] text-center max-w-[480px] leading-relaxed">
          Persistent memory for AI agents — context that adapts,<br />
          intelligence that remembers every session.
        </p>

        {/* Stats */}
        <div ref={statsRef} className="flex items-center gap-10 mt-1">
          {[
            { n: '2,341', label: 'tokens saved' },
            { n: '847',   label: 'sessions' },
            { n: '12',    label: 'agents live' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-xl font-bold text-white tabular-nums">{s.n}</div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[#52525B] uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="flex items-center gap-5 mt-1">
          <button
            ref={ctaBtnRef}
            className="group relative px-9 py-3.5 font-mono text-xs tracking-[0.2em] font-semibold text-black uppercase overflow-hidden"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="relative z-10">Get Started →</span>
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
            />
          </button>
          <a
            href="#section-7"
            className="font-mono text-[11px] tracking-[0.3em] text-[#52525B] hover:text-white transition-colors duration-200 uppercase"
          >
            Read docs
          </a>
        </div>
      </div>

      {/* ── LIVE MEMORY FEED (right column) ──────────────────────── */}
      <div
        ref={feedRef}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-[200px] z-20 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', animation: 'pulse 2s ease-in-out infinite' }}
          />
          <span className="font-mono text-[9px] tracking-[0.35em] text-[#3F3F46] uppercase">live memory</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {visibleFeed.map((entry, i) => (
            <div
              key={`${feedTop}-${i}`}
              className="border border-[rgba(255,255,255,0.05)] p-2.5 bg-[rgba(0,0,0,0.5)]"
              style={{
                opacity:    1 - i * 0.16,
                transition: 'opacity 0.6s ease',
              }}
            >
              <div
                className="font-mono text-[8px] tracking-widest mb-1 uppercase"
                style={{ color: TYPE_COLOR[entry.type] ?? '#71717A' }}
              >
                [{entry.type}]
              </div>
              <div className="font-mono text-[10px] text-[#A1A1AA] leading-snug">
                {entry.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM-LEFT section marker ────────────────────────────── */}
      <div className="absolute bottom-10 left-8 z-20 pointer-events-none">
        <span className="font-mono text-[9px] tracking-[0.4em] text-[#27272A] uppercase">§1 / origin</span>
      </div>

      {/* ── SCROLL INDICATOR ─────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-mono text-[9px] tracking-[0.45em] text-[#3F3F46] uppercase">scroll</span>
        <div
          className="w-px h-10"
          style={{
            background:   'linear-gradient(to bottom, var(--accent), transparent)',
            animation:    'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Corner bracket decoration ─────────────────────────────── */}
      <div className="absolute top-[72px] left-5 w-5 h-5 border-t border-l border-[rgba(255,255,255,0.05)] pointer-events-none z-20" />
      <div className="absolute top-[72px] right-5 w-5 h-5 border-t border-r border-[rgba(255,255,255,0.05)] pointer-events-none z-20" />
      <div className="absolute bottom-5 left-5 w-5 h-5 border-b border-l border-[rgba(255,255,255,0.05)] pointer-events-none z-20" />
      <div className="absolute bottom-5 right-5 w-5 h-5 border-b border-r border-[rgba(255,255,255,0.05)] pointer-events-none z-20" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.018) 2px, rgba(0,0,0,0.018) 4px)',
        }}
      />
    </section>
  )
}
