'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ExternalLink, BookOpen } from 'lucide-react'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import type { Entry, EntryType, Project } from '@context-engine/shared'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { SECTION_INDEX } from './types'

const TYPE_META: Record<string, { color: string; label: string }> = {
  task:     { color: '#3B82F6', label: 'task' },
  note:     { color: '#8B5CF6', label: 'note' },
  decision: { color: '#F59E0B', label: 'decision' },
  meet:     { color: '#10B981', label: 'meet' },
  idea:     { color: '#EC4899', label: 'idea' },
  log:      { color: '#71717A', label: 'log' },
  analysis: { color: '#06B6D4', label: 'analysis' },
  plan:     { color: '#6366F1', label: 'plan' },
  post:     { color: '#F97316', label: 'post' },
}

const ALL_TYPES = Object.keys(TYPE_META) as EntryType[]

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  if (day.getTime() === today.getTime()) return 'Today'
  if (day.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

interface EntryWithProject extends Entry {
  project?: { id: string; name: string } | null
}

interface DayGroup { label: string; entries: EntryWithProject[] }

function groupByDay(entries: EntryWithProject[]): DayGroup[] {
  const map = new Map<string, EntryWithProject[]>()
  for (const e of entries) {
    const key = new Date(e.created_at).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    label: dayLabel(items[0].created_at),
    entries: items,
  }))
}

export function SectionTimeline({ direction, onNavigateTo }: SectionProps) {
  const [entries, setEntries] = useState<EntryWithProject[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<EntryType | ''>('')
  const [filterProject, setFilterProject] = useState('')
  const [limit, setLimit] = useState(80)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (lim = 80) => {
    setLoading(true)
    let q = supabase
      .from('entries')
      .select('*, project:projects(id,name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(lim)

    const { data, count } = await q
    setEntries((data ?? []) as EntryWithProject[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(limit) }, [load, limit])

  useEffect(() => {
    supabase.from('projects').select('id,name').order('name')
      .then(({ data }) => setProjects((data ?? []) as Project[]))
  }, [])

  const filtered = entries.filter(e => {
    if (filterType && e.type !== filterType) return false
    if (filterProject && (e.project as { id: string } | null)?.id !== filterProject) return false
    return true
  })

  const grouped = groupByDay(filtered)

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Timeline"
        subtitle={`${filtered.length} entries · chronological memory`}
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Project filter */}
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 8px',
                fontFamily: 'var(--font-inter)', fontSize: 11,
                color: filterProject ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        }
      />

      {/* Type filter pills */}
      <div style={{
        padding: '8px 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        flexWrap: 'wrap', background: 'var(--surface-1)',
      }}>
        {(['', ...ALL_TYPES] as (EntryType | '')[]).map(t => {
          const tm = t ? TYPE_META[t] : null
          const active = filterType === t
          return (
            <button key={t || 'all'} onClick={() => setFilterType(t)} style={{
              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
              padding: '2px 9px', borderRadius: 20,
              border: active ? `1px solid ${tm?.color ?? 'var(--accent)'}` : '1px solid var(--border)',
              background: active ? `${tm?.color ?? 'var(--accent)'}18` : 'transparent',
              color: active ? (tm?.color ?? 'var(--accent)') : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.12s', letterSpacing: '0.06em',
            }}>
              {t === '' ? 'ALL' : t.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Timeline body */}
      <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 6, marginLeft: 24 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div className="empty-state-icon">📅</div>
            <p>No entries in timeline</p>
            <p className="empty-state-hint">Entries will appear here as you create them</p>
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            {grouped.map((group, gi) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.04, duration: 0.2 }}
                style={{ marginBottom: 32 }}
              >
                {/* Day label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-active)', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 600,
                    color: 'var(--text-primary)', letterSpacing: '-0.01em',
                  }}>
                    {group.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Entries in this day */}
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute', left: 3, top: 8, bottom: 8,
                    width: 1, background: 'var(--border)',
                  }} />

                  <AnimatePresence>
                    {group.entries.map((e, ei) => {
                      const tm = TYPE_META[e.type] ?? { color: '#71717A', label: e.type }
                      const projName = (e.project as { name?: string } | null)?.name
                      return (
                        <motion.div
                          key={e.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ei * 0.02, duration: 0.18 }}
                          style={{ position: 'relative', marginBottom: 8 }}
                          className="group"
                        >
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute', left: -21, top: 14,
                            width: 6, height: 6, borderRadius: '50%',
                            background: tm.color,
                            border: '2px solid var(--bg-base)',
                            zIndex: 1,
                          }} />

                          {/* Entry row */}
                          <div
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '9px 12px',
                              background: 'var(--surface-1)',
                              border: '1px solid var(--border)',
                              borderLeft: `3px solid ${tm.color}`,
                              borderRadius: '0 6px 6px 0',
                              cursor: 'pointer',
                              transition: 'background 0.12s, border-color 0.12s',
                            }}
                            onMouseEnter={e2 => {
                              const el = e2.currentTarget as HTMLDivElement
                              el.style.background = 'var(--surface-2)'
                              el.style.borderColor = `${tm.color}80`
                              el.style.borderLeftColor = tm.color
                            }}
                            onMouseLeave={e2 => {
                              const el = e2.currentTarget as HTMLDivElement
                              el.style.background = 'var(--surface-1)'
                              el.style.borderColor = 'var(--border)'
                              el.style.borderLeftColor = tm.color
                            }}
                            onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, e.id)}
                          >
                            {/* Type pill */}
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fontWeight: 700,
                              color: tm.color, background: `${tm.color}18`,
                              border: `1px solid ${tm.color}35`,
                              borderRadius: 3, padding: '1px 5px', letterSpacing: '0.05em',
                              flexShrink: 0,
                            }}>
                              {tm.label.toUpperCase()}
                            </span>

                            {/* Title */}
                            <span style={{
                              fontFamily: 'var(--font-inter)', fontSize: 13,
                              color: 'var(--text-secondary)', flex: 1,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {e.title}
                            </span>

                            {/* Project pill */}
                            {projName && (
                              <span style={{
                                fontFamily: 'var(--font-inter)', fontSize: 10,
                                color: 'var(--text-muted)',
                                background: 'var(--surface-2)', border: '1px solid var(--border)',
                                borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                              }}>
                                {projName}
                              </span>
                            )}

                            {/* Time */}
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                              color: 'var(--text-muted)', flexShrink: 0, minWidth: 36,
                              textAlign: 'right',
                            }}>
                              {new Date(e.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Open in notes */}
                            <button
                              onClick={ev => {
                                ev.stopPropagation()
                                window.open(`/dashboard/notes/${e.id}`, '_blank')
                              }}
                              className="group-hover:opacity-100"
                              style={{
                                opacity: 0, transition: 'opacity 0.15s',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 2, flexShrink: 0,
                              }}
                              onMouseEnter={e2 => (e2.currentTarget.style.color = 'var(--accent)')}
                              onMouseLeave={e2 => (e2.currentTarget.style.color = 'var(--text-muted)')}
                              title="Open as note"
                            >
                              <BookOpen size={11} />
                            </button>

                            <ExternalLink
                              size={10}
                              className="group-hover:opacity-100"
                              style={{ opacity: 0, transition: 'opacity 0.15s', color: 'var(--text-muted)', flexShrink: 0 }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {/* Load more */}
            {total > limit && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => setLimit(l => l + 80)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
                    fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <ChevronDown size={13} /> Load more ({total - limit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}
