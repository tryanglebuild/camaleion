'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { sectionVariants } from './sectionVariants'
import type { SectionProps } from './types'
import { SECTION_INDEX } from './types'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper } from './SectionLayout'

// ── Types ────────────────────────────────────────────────────────────

interface GraphNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  connections: number
  data?: Record<string, string>
}

interface GraphEdge {
  source: string
  target: string
}

// ── Config ───────────────────────────────────────────────────────────

const NODE_CONFIG: Record<string, { color: string; radius: number }> = {
  project:  { color: '#06B6D4', radius: 10 },
  person:   { color: '#F43F5E', radius: 8 },
  company:  { color: '#22C55E', radius: 12 },
  task:     { color: '#3B82F6', radius: 5 },
  note:     { color: '#8B5CF6', radius: 5 },
  decision: { color: '#F59E0B', radius: 6 },
  idea:     { color: '#EC4899', radius: 5 },
  meet:     { color: '#10B981', radius: 5 },
  log:      { color: '#71717A', radius: 4 },
}

const FILTER_TYPES = [
  { key: 'all',      label: 'All' },
  { key: 'project',  label: 'Projects' },
  { key: 'person',   label: 'People' },
  { key: 'company',  label: 'Companies' },
  { key: 'task',     label: 'Tasks' },
  { key: 'note',     label: 'Notes' },
  { key: 'decision', label: 'Decisions' },
  { key: 'idea',     label: 'Ideas' },
]

function nodeColor(type: string): string {
  return NODE_CONFIG[type]?.color ?? '#71717A'
}

function nodeBaseRadius(type: string): number {
  return NODE_CONFIG[type]?.radius ?? 5
}

function effectiveRadius(node: GraphNode): number {
  return nodeBaseRadius(node.type) + Math.sqrt(node.connections) * 1.5
}

// ── Detail Panel ─────────────────────────────────────────────────────

interface SelectedNode {
  id: string
  label: string
  type: string
  data?: Record<string, string>
}

function DetailPanel({ node, onClose, onNavigateTo }: { node: SelectedNode; onClose: () => void; onNavigateTo?: SectionProps['onNavigateTo'] }) {
  const color = nodeColor(node.type)
  const badgeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1)

  function handleNavigate() {
    if (!onNavigateTo) return
    if (node.type === 'project') onNavigateTo(SECTION_INDEX.PROJECTS)
    else if (node.type === 'person') onNavigateTo(SECTION_INDEX.PEOPLE)
    else if (node.type === 'company') onNavigateTo(SECTION_INDEX.COMPANIES)
    else onNavigateTo(SECTION_INDEX.ENTRIES, node.id)
    onClose()
  }

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 280,
        background: 'var(--surface-1)',
        borderLeft: `1px solid ${color}40`,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `-4px 0 24px rgba(0,0,0,0.10)`,
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: color, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 3,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            color,
          }}>
            {badgeLabel}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          wordBreak: 'break-word',
          lineHeight: 1.35,
        }}>
          {node.label}
        </h3>
      </div>

      {/* Info */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {node.data && Object.entries(node.data).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
              {k}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, wordBreak: 'break-word' }}>
              {v}
            </div>
          </div>
        ))}
        {(!node.data || Object.values(node.data).every(v => !v)) && (
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No additional details.
          </div>
        )}
        {onNavigateTo && (
          <button
            onClick={handleNavigate}
            style={{
              marginTop: 16, width: '100%', padding: '8px 0', borderRadius: 5,
              background: `${color}15`, border: `1px solid ${color}40`, color,
              fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${color}28`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${color}15`)}
          >
            Open in section →
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function SectionGraph({ direction, onNavigateTo }: SectionProps) {
  // React state (UI only)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [nodeCount, setNodeCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Simulation state — all in refs, never triggers re-renders
  const allNodesRef = useRef<GraphNode[]>([])
  const allEdgesRef = useRef<GraphEdge[]>([])
  const visibleNodesRef = useRef<GraphNode[]>([])
  const visibleEdgesRef = useRef<GraphEdge[]>([])
  const nodeMapRef = useRef<Map<string, GraphNode>>(new Map())

  const rafRef = useRef<number | null>(null)
  const ticksRef = useRef(0)
  const simRunningRef = useRef(false)

  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })

  const hoveredIdRef = useRef<string | null>(null)
  const draggingNodeRef = useRef<GraphNode | null>(null)
  const dragLastRef = useRef({ x: 0, y: 0 })
  const dragVelRef = useRef({ x: 0, y: 0 })

  const isPanningRef = useRef(false)
  const panStartRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  const canvasSizeRef = useRef({ w: 800, h: 600 })
  const activeFilterRef = useRef<string>('all')

  // Keep filter ref in sync
  useEffect(() => { activeFilterRef.current = activeFilter }, [activeFilter])

  // ── Screen → Graph coordinates ──────────────────────────────────────
  const toGraph = useCallback((sx: number, sy: number) => {
    const { x: ox, y: oy } = panRef.current
    const s = scaleRef.current
    return { x: (sx - ox) / s, y: (sy - oy) / s }
  }, [])

  // ── Derive visible nodes/edges from filter ─────────────────────────
  const deriveVisible = useCallback((filter: string) => {
    if (filter === 'all') {
      visibleNodesRef.current = allNodesRef.current
      visibleEdgesRef.current = allEdgesRef.current
    } else {
      const visIds = new Set(
        allNodesRef.current.filter(n => n.type === filter || n.type === 'company').map(n => n.id)
      )
      // Also include neighbors of matched nodes
      const neighborIds = new Set<string>()
      for (const e of allEdgesRef.current) {
        if (visIds.has(e.source) || visIds.has(e.target)) {
          neighborIds.add(e.source)
          neighborIds.add(e.target)
        }
      }
      const allVisible = new Set([...visIds, ...neighborIds])
      visibleNodesRef.current = allNodesRef.current.filter(n => allVisible.has(n.id))
      visibleEdgesRef.current = allEdgesRef.current.filter(e => allVisible.has(e.source) && allVisible.has(e.target))
    }
  }, [])

  // ── Build graph from raw data ───────────────────────────────────────
  const buildGraph = useCallback((
    projects: Array<{ id: string; name: string; company: string | null; status: string; description?: string }>,
    people: Array<{ id: string; name: string; role: string | null; company: string | null }>,
    entries: Array<{ id: string; title: string; type: string; project_id: string | null }>
  ) => {
    const { w, h } = canvasSizeRef.current
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    const rand = (max: number) => Math.random() * max

    // Collect companies
    const companyNames = new Set<string>()
    for (const p of projects) if (p.company) companyNames.add(p.company)
    for (const p of people) if (p.company) companyNames.add(p.company)

    // Company nodes
    for (const company of companyNames) {
      nodes.push({
        id: `company:${company}`,
        label: company,
        type: 'company',
        x: rand(w), y: rand(h),
        vx: 0, vy: 0,
        radius: nodeBaseRadius('company'),
        connections: 0,
        data: { name: company },
      })
    }

    // Project nodes
    for (const p of projects) {
      nodes.push({
        id: `project:${p.id}`,
        label: p.name,
        type: 'project',
        x: rand(w), y: rand(h),
        vx: 0, vy: 0,
        radius: nodeBaseRadius('project'),
        connections: 0,
        data: { status: p.status, company: p.company ?? '', description: p.description ?? '' },
      })
      // company → project edge
      if (p.company) {
        edges.push({ source: `company:${p.company}`, target: `project:${p.id}` })
      }
    }

    // Person nodes
    for (const p of people) {
      nodes.push({
        id: `person:${p.id}`,
        label: p.name,
        type: 'person',
        x: rand(w), y: rand(h),
        vx: 0, vy: 0,
        radius: nodeBaseRadius('person'),
        connections: 0,
        data: { role: p.role ?? '', company: p.company ?? '' },
      })
      // person → company edge
      if (p.company) {
        edges.push({ source: `person:${p.id}`, target: `company:${p.company}` })
      }
    }

    // Entry nodes
    const VALID_TYPES = new Set(['task', 'note', 'decision', 'idea', 'meet', 'log'])
    for (const e of entries) {
      if (!VALID_TYPES.has(e.type)) continue
      nodes.push({
        id: `entry:${e.id}`,
        label: e.title,
        type: e.type,
        x: rand(w), y: rand(h),
        vx: 0, vy: 0,
        radius: nodeBaseRadius(e.type),
        connections: 0,
        data: { type: e.type },
      })
      // project → entry edge
      if (e.project_id) {
        edges.push({ source: `project:${e.project_id}`, target: `entry:${e.id}` })
      }
    }

    // Build node map
    const nodeMap = new Map<string, GraphNode>()
    for (const n of nodes) nodeMap.set(n.id, n)

    // Count connections & update radius
    for (const e of edges) {
      const s = nodeMap.get(e.source)
      const t = nodeMap.get(e.target)
      if (s) s.connections++
      if (t) t.connections++
    }
    for (const n of nodes) {
      n.radius = effectiveRadius(n)
    }

    allNodesRef.current = nodes
    allEdgesRef.current = edges
    nodeMapRef.current = nodeMap

    deriveVisible(activeFilterRef.current)
  }, [deriveVisible])

  // ── Load data ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [{ data: projects }, { data: people }, { data: entries }] = await Promise.all([
        supabase.from('projects').select('id,name,company,status,description'),
        supabase.from('people').select('id,name,role,company'),
        supabase.from('entries').select('id,title,type,project_id')
          .in('type', ['task', 'note', 'decision', 'idea', 'meet', 'log'])
          .limit(200),
      ])

      if (cancelled) return

      buildGraph(
        (projects ?? []) as Array<{ id: string; name: string; company: string | null; status: string; description?: string }>,
        (people ?? []) as Array<{ id: string; name: string; role: string | null; company: string | null }>,
        (entries ?? []) as Array<{ id: string; title: string; type: string; project_id: string | null }>
      )

      setNodeCount(visibleNodesRef.current.length)
      setEdgeCount(visibleEdgesRef.current.length)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [buildGraph])

  // ── Restart simulation ──────────────────────────────────────────────
  const restartSim = useCallback(() => {
    ticksRef.current = 0
    simRunningRef.current = true
    // Give each visible node a tiny nudge to re-energize
    for (const n of visibleNodesRef.current) {
      n.vx += (Math.random() - 0.5) * 0.5
      n.vy += (Math.random() - 0.5) * 0.5
    }
  }, [])

  // ── Render loop ─────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w, h } = canvasSizeRef.current
    const dpr = window.devicePixelRatio || 1
    const nodes = visibleNodesRef.current
    const edges = visibleEdgesRef.current
    const nodeMap = nodeMapRef.current
    const scale = scaleRef.current
    const { x: panX, y: panY } = panRef.current
    const hoveredId = hoveredIdRef.current

    // ── Physics tick ──
    if (simRunningRef.current && ticksRef.current < 300) {
      const cx = w / 2
      const cy = h / 2

      for (const n of nodes) {
        if (draggingNodeRef.current?.id === n.id) continue

        let fx = 0
        let fy = 0

        // Repulsion
        for (const other of nodes) {
          if (other.id === n.id) continue
          const dx = n.x - other.x
          const dy = n.y - other.y
          const distSq = dx * dx + dy * dy
          if (distSq < 1) continue
          const dist = Math.sqrt(distSq)
          const force = 1200 / distSq
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        }

        // Spring along edges
        for (const e of edges) {
          let other: GraphNode | undefined
          if (e.source === n.id) other = nodeMap.get(e.target)
          else if (e.target === n.id) other = nodeMap.get(e.source)
          if (!other) continue
          const dx = other.x - n.x
          const dy = other.y - n.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 0.04 * (dist - 80)
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        }

        // Gravity toward center
        fx += 0.003 * (cx - n.x)
        fy += 0.003 * (cy - n.y)

        // Integrate
        n.vx = (n.vx + fx) * 0.85
        n.vy = (n.vy + fy) * 0.85
        n.x += n.vx
        n.y += n.vy
      }

      ticksRef.current++
      if (ticksRef.current >= 300) simRunningRef.current = false
    }

    // ── Draw ──
    ctx.save()
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, panX * dpr, panY * dpr)

    // Background
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim() || '#FAFAF8'
    ctx.fillStyle = bgColor
    ctx.fillRect(-panX / scale - w, -panY / scale - h, (w + Math.abs(panX / scale)) * 3, (h + Math.abs(panY / scale)) * 3)

    // Build hovered neighbor set
    const hoveredNeighbors = new Set<string>()
    if (hoveredId) {
      for (const e of edges) {
        if (e.source === hoveredId) hoveredNeighbors.add(e.target)
        else if (e.target === hoveredId) hoveredNeighbors.add(e.source)
      }
    }

    // Edges
    for (const e of edges) {
      const src = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (!src || !tgt) continue

      const isHighlighted = hoveredId && (e.source === hoveredId || e.target === hoveredId)

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.lineWidth = isHighlighted ? 1.5 / scale : 1 / scale

      if (isHighlighted) {
        const color = nodeColor(hoveredId ? (nodeMap.get(hoveredId)?.type ?? 'log') : 'log')
        ctx.strokeStyle = color.replace(')', ', 0.6)').replace('rgb(', 'rgba(').replace('#', '')
        // Fallback for hex
        ctx.strokeStyle = `${color}99`
      } else {
        ctx.strokeStyle = hoveredId ? 'rgba(100,100,100,0.05)' : 'rgba(100,100,100,0.15)'
      }

      ctx.stroke()
    }

    // Nodes
    for (const n of nodes) {
      const color = nodeColor(n.type)
      const isHovered = n.id === hoveredId
      const isNeighbor = hoveredNeighbors.has(n.id)
      const isDistant = hoveredId && !isHovered && !isNeighbor

      const drawRadius = isHovered ? n.radius * 1.4 : n.radius
      const opacity = isDistant ? 0.3 : 1.0

      ctx.globalAlpha = opacity

      // Glow
      ctx.shadowBlur = isHovered ? 16 : 8
      ctx.shadowColor = color

      ctx.beginPath()
      ctx.arc(n.x, n.y, drawRadius, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? color : (isNeighbor ? color + 'DD' : color + 'BB')
      ctx.fill()

      ctx.shadowBlur = 0

      // Label
      const showLabel = n.type === 'project' || n.type === 'company' || isHovered || isNeighbor
      if (showLabel && !isDistant) {
        const fontSize = 11
        ctx.font = `${fontSize / scale}px Inter, system-ui, sans-serif`
        ctx.fillStyle = isHovered ? (getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1C1917') : 'rgba(120,120,120,0.9)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.globalAlpha = isDistant ? 0 : (isHovered || n.type === 'project' || n.type === 'company' ? 0.9 : 0.6)

        // Truncate label
        const maxChars = 22
        const label = n.label.length > maxChars ? n.label.slice(0, maxChars) + '…' : n.label
        ctx.fillText(label, n.x, n.y + drawRadius + 3 / scale)
      }

      ctx.globalAlpha = 1
    }

    ctx.restore()
    rafRef.current = requestAnimationFrame(render)
  }, [])

  // ── Start/stop render loop ──────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      restartSim()
      rafRef.current = requestAnimationFrame(render)
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [loading, render, restartSim])

  // ── Re-derive visible when filter changes ──────────────────────────
  useEffect(() => {
    if (loading) return
    deriveVisible(activeFilter)
    setNodeCount(visibleNodesRef.current.length)
    setEdgeCount(visibleEdgesRef.current.length)
    // Reposition new nodes randomly if they don't have coords yet
    restartSim()
  }, [activeFilter, loading, deriveVisible, restartSim])

  // ── ResizeObserver ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvasSizeRef.current = { w: width, h: height }
        // Center pan on first resize
        panRef.current = { x: 0, y: 0 }
      }
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // ── Mouse event helpers ─────────────────────────────────────────────
  const findNearestNode = useCallback((gx: number, gy: number, maxDist: number): GraphNode | null => {
    let best: GraphNode | null = null
    let bestDist = maxDist
    for (const n of visibleNodesRef.current) {
      const dx = n.x - gx
      const dy = n.y - gy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < bestDist) { bestDist = d; best = n }
    }
    return best
  }, [])

  const getCanvasXY = useCallback((e: MouseEvent | WheelEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  // ── Wheel (zoom) ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { x: sx, y: sy } = getCanvasXY(e)
      const oldScale = scaleRef.current
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.min(3, Math.max(0.3, oldScale * factor))

      // Zoom toward cursor
      panRef.current.x = sx - (sx - panRef.current.x) * (newScale / oldScale)
      panRef.current.y = sy - (sy - panRef.current.y) * (newScale / oldScale)
      scaleRef.current = newScale
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [getCanvasXY])

  // ── Mouse move (hover + drag) ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const { x: sx, y: sy } = getCanvasXY(e)
      const gPos = toGraph(sx, sy)

      if (draggingNodeRef.current) {
        const node = draggingNodeRef.current
        const dx = gPos.x - node.x
        const dy = gPos.y - node.y
        dragVelRef.current = { x: dx, y: dy }
        node.x = gPos.x
        node.y = gPos.y
        node.vx = 0
        node.vy = 0
        dragLastRef.current = gPos
        simRunningRef.current = true
        ticksRef.current = 0
        return
      }

      if (isPanningRef.current) {
        const { mx, my, ox, oy } = panStartRef.current
        panRef.current.x = ox + (e.clientX - mx)
        panRef.current.y = oy + (e.clientY - my)
        return
      }

      // Hover detection in graph coords with radius tolerance
      const hitRadius = 20 / scaleRef.current
      const nearest = findNearestNode(gPos.x, gPos.y, hitRadius + 12)
      hoveredIdRef.current = nearest?.id ?? null
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [getCanvasXY, toGraph, findNearestNode])

  // ── Mouse down (drag node or pan) ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      const { x: sx, y: sy } = getCanvasXY(e)
      const gPos = toGraph(sx, sy)
      const hitRadius = 20 / scaleRef.current
      const nearest = findNearestNode(gPos.x, gPos.y, hitRadius + 12)

      if (nearest) {
        draggingNodeRef.current = nearest
        dragLastRef.current = gPos
        dragVelRef.current = { x: 0, y: 0 }
      } else {
        isPanningRef.current = true
        panStartRef.current = { mx: e.clientX, my: e.clientY, ox: panRef.current.x, oy: panRef.current.y }
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    return () => canvas.removeEventListener('mousedown', handleMouseDown)
  }, [getCanvasXY, toGraph, findNearestNode])

  // ── Mouse up ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseUp = () => {
      if (draggingNodeRef.current) {
        draggingNodeRef.current.vx = dragVelRef.current.x * 0.5
        draggingNodeRef.current.vy = dragVelRef.current.y * 0.5
        draggingNodeRef.current = null
      }
      isPanningRef.current = false
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // ── Click (select node) ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleClick = (e: MouseEvent) => {
      const { x: sx, y: sy } = getCanvasXY(e)
      const gPos = toGraph(sx, sy)
      const hitRadius = 20 / scaleRef.current
      const nearest = findNearestNode(gPos.x, gPos.y, hitRadius + 12)

      if (nearest) {
        setSelectedNode({
          id: nearest.id,
          label: nearest.label,
          type: nearest.type,
          data: nearest.data,
        })
      } else {
        setSelectedNode(null)
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [getCanvasXY, toGraph, findNearestNode])

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <SectionWrapper direction={direction}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
        />

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)', zIndex: 10,
          }}>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)' }}>
              Loading graph…
            </div>
          </div>
        )}

        {/* Filter chips — top right */}
        {!loading && (
          <motion.div variants={listVariants} initial="hidden" animate="visible"
            style={{
              position: 'absolute', top: 16, right: selectedNode ? 296 : 16,
              display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 420,
              zIndex: 20, justifyContent: 'flex-end',
              transition: 'right 0.22s ease',
            }}>
            {FILTER_TYPES.map(f => {
              const isActive = activeFilter === f.key
              const color = f.key === 'all' ? '#06B6D4' : nodeColor(f.key)
              return (
                <motion.button
                  key={f.key}
                  variants={rowVariants}
                  onClick={() => setActiveFilter(f.key)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: `1px solid ${isActive ? color + '80' : 'var(--border)'}`,
                    background: isActive ? `${color}18` : 'var(--surface-1)',
                    color: isActive ? color : 'var(--text-muted)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {/* Title — top left */}
        {!loading && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 20,
            pointerEvents: 'none',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 12px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Knowledge Graph
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              scroll · drag · click
            </div>
          </div>
        )}

        {/* Node/edge count — bottom left */}
        {!loading && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            zIndex: 20,
            pointerEvents: 'none',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(6px)',
            padding: '5px 10px',
            borderRadius: 5,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{nodeCount}</span>
            <span style={{ color: 'var(--border-active)' }}>nodes</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ color: 'var(--text-secondary)' }}>{edgeCount}</span>
            <span style={{ color: 'var(--border-active)' }}>edges</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && nodeCount === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🕸️</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
              No nodes to display
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)', marginTop: 6, opacity: 0.7 }}>
              Add projects, people, or entries to see connections here
            </div>
          </div>
        )}
      </SectionWrapper>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 299, cursor: 'default' }}
            />
            <DetailPanel
              key="panel"
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNavigateTo={onNavigateTo}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
