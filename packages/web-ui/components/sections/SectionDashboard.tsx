'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import { Database, FolderOpen, Users, CheckSquare } from 'lucide-react'
import { contentItemVariants, listContainerVariants, rowItemVariants } from './sectionVariants'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { itemVariants, growContainerVariants } from '@/lib/animation-variants'
import { SECTION_INDEX } from './types'

function useCountUp(target: number, active: boolean, duration = 1.0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) return
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return val
}

const TYPE_COLOR: Record<string, string> = {
  task: '#3B82F6', note: '#8B5CF6', decision: '#F59E0B',
  meet: '#10B981', idea: '#EC4899', log: '#71717A',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#EAB308', in_progress: '#3B82F6', done: '#22C55E', blocked: '#EF4444',
}

function SystemStatus() {
  const [status, setStatus] = useState<{ supabase?: boolean; mcp?: boolean; embed?: boolean } | null>(null)
  const check = async () => {
    try {
      const res = await fetch('/api/health')
      const d = await res.json()
      setStatus({ supabase: d.supabase?.ok, mcp: d.mcp?.ok, embed: d.embed?.ok })
    } catch { setStatus({ supabase: false, mcp: false, embed: false }) }
  }
  useEffect(() => { check(); const id = setInterval(check, 30_000); return () => clearInterval(id) }, [])

  const items = [
    { label: 'DB',  ok: status?.supabase },
    { label: 'MCP', ok: status?.mcp },
    { label: 'VEC', ok: status?.embed },
  ]

  return (
    <motion.div
      variants={growContainerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', gap: 12, alignItems: 'center', originX: 1 }}
    >
      {items.map(it => (
        <motion.div key={it.label} variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: status === null ? 'var(--border)' : it.ok ? 'var(--status-done)' : 'var(--status-blocked)',
            animation: status !== null && it.ok ? 'pulse-live 2.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>{it.label}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

export function SectionDashboard({ direction, onNavigateTo }: SectionProps) {
  const [stats, setStats] = useState({ entries: 0, projects: 0, people: 0, tasks: 0, done: 0, pending: 0, blocked: 0, in_progress: 0 })
  const [logs, setLogs] = useState<{ id: string; time: string; type: string; title: string; status: string }[]>([])
  const [pendingTasks, setPendingTasks] = useState<{ id: string; title: string; status: string; project?: string }[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function load() {
      const [e, p, pe, done, pend, blocked, inprog] = await Promise.all([
        supabase.from('entries').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'blocked'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      ])
      const tasks = await supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'task')
      setStats({
        entries: e.count ?? 0, projects: p.count ?? 0, people: pe.count ?? 0,
        tasks: tasks.count ?? 0, done: done.count ?? 0, pending: pend.count ?? 0,
        blocked: blocked.count ?? 0, in_progress: inprog.count ?? 0,
      })

      const { data: recentData } = await supabase
        .from('entries').select('id, title, type, status, created_at')
        .order('created_at', { ascending: false }).limit(12)
      setLogs((recentData ?? []).map(d => ({
        id: d.id, time: new Date(d.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        type: d.type, title: d.title.slice(0, 55), status: d.status ?? '',
      })))

      const { data: taskData } = await supabase
        .from('entries').select('id, title, status, project:projects(name)')
        .eq('type', 'task').neq('status', 'done')
        .order('created_at', { ascending: false }).limit(6)
      setPendingTasks((taskData ?? []).map(t => ({
        id: t.id, title: t.title, status: t.status ?? 'pending',
        project: Array.isArray(t.project) ? (t.project[0] as { name: string } | undefined)?.name : (t.project as { name: string } | null)?.name,
      })))

      setReady(true)
    }
    load()

    const channel = supabase.channel('dash-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entries' }, payload => {
        const entry = payload.new as { id: string; title: string; type: string; status: string; created_at: string }
        setLogs(prev => [{
          id: entry.id,
          time: new Date(entry.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          type: entry.type, title: entry.title.slice(0, 55), status: entry.status,
        }, ...prev].slice(0, 12))
        setStats(prev => ({ ...prev, entries: prev.entries + 1 }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const eVal  = useCountUp(stats.entries,  ready, 1.0)
  const pVal  = useCountUp(stats.projects, ready, 0.8)
  const peVal = useCountUp(stats.people,   ready, 0.8)
  const tVal  = useCountUp(stats.tasks,    ready, 0.9)

  const statItems = [
    { label: 'Entries',  value: eVal,  sub: `${stats.pending} pending`,  color: '#3B82F6', icon: <Database size={11} />,   sectionIndex: SECTION_INDEX.ENTRIES },
    { label: 'Projects', value: pVal,  sub: 'active pipelines',          color: '#06B6D4', icon: <FolderOpen size={11} />, sectionIndex: SECTION_INDEX.PROJECTS },
    { label: 'People',   value: peVal, sub: 'in network',                color: '#F43F5E', icon: <Users size={11} />,      sectionIndex: SECTION_INDEX.PEOPLE },
    { label: 'Tasks',    value: tVal,  sub: `${stats.done} done`,        color: '#EAB308', icon: <CheckSquare size={11} />,sectionIndex: SECTION_INDEX.TASKS },
  ]

  const totalStatus = (stats.done + stats.pending + stats.in_progress + stats.blocked) || 1

  const statusSegments = [
    { n: stats.done,        c: '#22C55E', l: 'done' },
    { n: stats.in_progress, c: '#3B82F6', l: 'in progress' },
    { n: stats.pending,     c: '#EAB308', l: 'pending' },
    { n: stats.blocked,     c: '#EF4444', l: 'blocked' },
  ]

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Overview" subtitle="Brain context at a glance" rightSlot={<SystemStatus />} />

      {/* ── Body: 2 columns ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT — main feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border)' }}>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {statItems.map((s, i) => (
              <motion.div
                key={s.label}
                variants={contentItemVariants}
                onClick={() => onNavigateTo?.(s.sectionIndex)}
                style={{
                  paddingTop: 0,
                  borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                  display: 'flex', flexDirection: 'column',
                  originX: 0,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.15s',
                }}
                whileHover={{ backgroundColor: 'var(--surface-2)' }}
                initial="hidden"
                animate="visible"
              >
                {/* Top accent line */}
                <div style={{ height: 3, background: s.color, flexShrink: 0 }} />
                <div style={{ padding: '14px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {s.label}
                      </span>
                    </div>
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      style={{ fontSize: 12, color: s.color, opacity: 0, transition: 'opacity 0.15s, transform 0.15s' }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}
                  >
                    {s.value}
                  </motion.div>
                  <motion.div variants={itemVariants} style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {s.sub}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status distribution bar */}
          <motion.div
            variants={contentItemVariants}
            style={{ padding: '10px 22px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status distribution</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {/* Taller bar with rounded segments and gaps */}
            <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
              {statusSegments.map(({ n, c, l }) => n > 0 && (
                <div key={l}
                  title={`${l}: ${n}`}
                  style={{ flex: n / totalStatus, background: c, borderRadius: 4, minWidth: 3 }}
                />
              ))}
            </div>
            {/* Labels with counts below */}
            <div style={{ display: 'flex', gap: 16, marginTop: 7 }}>
              {statusSegments.map(({ n, c, l }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: c, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {n}
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity feed */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* LIVE header */}
            <motion.div
              variants={contentItemVariants}
              style={{ padding: '9px 22px 7px', flexShrink: 0, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em' }}>Recent activity</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '2px 7px 2px 5px', borderRadius: 20,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse-live 2s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: '#22C55E', fontWeight: 600, letterSpacing: '0.08em' }}>LIVE</span>
              </div>
            </motion.div>

            <div data-inner-scroll style={{ flex: 1, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 24px' }}>
                  <div className="empty-state-icon">📭</div>
                  <p>No entries yet</p>
                  <p className="empty-state-hint">Entries added via MCP will appear here</p>
                </div>
              ) : (
                <motion.div variants={listContainerVariants} initial="initial" animate="animate">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      variants={rowItemVariants}
                      onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, log.id)}
                      style={{
                        display: 'grid', gridTemplateColumns: '44px 72px 80px 1fr',
                        alignItems: 'center', gap: 10,
                        padding: '7px 22px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                      whileHover={{ backgroundColor: 'var(--surface-2)' }}
                    >
                      {/* Timestamp in JetBrains Mono */}
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.7, letterSpacing: '-0.01em' }}>
                        {log.time}
                      </span>

                      {/* Type badge: 4px left border, no dot */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                        borderLeft: `3px solid ${TYPE_COLOR[log.type] ?? '#52525B'}`,
                        background: `${TYPE_COLOR[log.type] ?? '#52525B'}14`,
                        borderRadius: '0 3px 3px 0',
                      }}>
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: TYPE_COLOR[log.type] ?? 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {log.type}
                        </span>
                      </div>

                      {/* Status badge */}
                      {log.status ? (
                        <span style={{
                          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                          color: STATUS_COLOR[log.status] ?? 'var(--text-muted)',
                          background: `${STATUS_COLOR[log.status] ?? '#71717A'}14`,
                          border: `1px solid ${STATUS_COLOR[log.status] ?? '#71717A'}30`,
                          borderRadius: 3, padding: '1px 5px',
                          letterSpacing: '0.03em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {log.status.replace('_', ' ')}
                        </span>
                      ) : <span />}

                      {/* Title */}
                      <span style={{
                        fontFamily: 'var(--font-inter)', fontSize: 12,
                        color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {log.title}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — active tasks */}
        <div style={{ width: 288, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <motion.div
            variants={contentItemVariants}
            style={{ padding: '9px 18px 8px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Active tasks</span>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--surface-3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '1px 7px',
              }}>
                {stats.pending + stats.in_progress}
              </span>
            </div>
          </motion.div>

          <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {pendingTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 8px' }}>
                <div className="empty-state-icon">✅</div>
                <p>All clear</p>
                <p className="empty-state-hint">No open tasks right now</p>
              </div>
            ) : (
              <motion.div variants={listContainerVariants} initial="initial" animate="animate">
                {pendingTasks.map((t) => (
                  <motion.div
                    key={t.id}
                    variants={rowItemVariants}
                    onClick={() => onNavigateTo?.(SECTION_INDEX.TASKS)}
                    style={{
                      padding: '9px 10px 9px 13px',
                      borderRadius: 6,
                      marginBottom: 5,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${STATUS_COLOR[t.status] ?? '#71717A'}`,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    whileHover={{ backgroundColor: 'var(--surface-3)', borderColor: 'var(--border-active)' }}
                  >
                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{
                        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                        color: STATUS_COLOR[t.status] ?? 'var(--text-muted)',
                        background: `${STATUS_COLOR[t.status] ?? '#71717A'}18`,
                        borderRadius: 3, padding: '1px 5px',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    {/* Title */}
                    <p style={{
                      fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500,
                      color: 'var(--text-primary)', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4,
                    }}>
                      {t.title}
                    </p>
                    {/* Project in mono */}
                    {t.project && (
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', opacity: 0.75 }}>
                        ⌁ {t.project}
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
