'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import type { Project, Entry } from '@context-engine/shared'
import { EditProjectModal } from '@/components/dashboard/EditProjectModal'
import { gridVariants, cardVariants as cardGrowAnim, fadeUpVariants, itemVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { SECTION_INDEX } from './types'

const PAGE_SIZE = 16

interface HealthData { done: number; pending: number; in_progress: number; blocked: number }
interface ProjectFull extends Project { entryCount: number; health: HealthData }

const STATUS_LABEL: Record<string, string> = { active: 'Active', paused: 'Paused', done: 'Done' }
const STATUS_COLOR: Record<string, string> = { active: '#22C55E', paused: '#EAB308', done: '#3B82F6' }

function healthColor(h: HealthData): string {
  const total = h.done + h.pending + h.in_progress + h.blocked
  if (!total) return '#52525B'
  if (h.blocked / total > 0.3) return '#EF4444'
  if (h.pending / total > 0.4) return '#EAB308'
  return '#22C55E'
}

function HealthBar({ h }: { h: HealthData }) {
  const total = h.done + h.pending + h.in_progress + h.blocked || 1
  return (
    <div style={{ height: 3, display: 'flex', borderRadius: 2, overflow: 'hidden', gap: 1, width: '100%' }}>
      {h.done > 0 && (
        <motion.div initial={{ flex: 0 }} animate={{ flex: h.done / total }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: '#22C55E', borderRadius: 2 }} />
      )}
      {(h.pending + h.in_progress) > 0 && (
        <motion.div initial={{ flex: 0 }} animate={{ flex: (h.pending + h.in_progress) / total }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{ background: '#EAB308', borderRadius: 2 }} />
      )}
      {h.blocked > 0 && (
        <motion.div initial={{ flex: 0 }} animate={{ flex: h.blocked / total }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          style={{ background: '#EF4444', borderRadius: 2 }} />
      )}
      {total === 1 && (
        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 2 }} />
      )}
    </div>
  )
}

// ── Project Detail Slide-over ──────────────────────────────────────
function ProjectDetail({ project, onClose, onEdit, onNavigateTo }: {
  project: ProjectFull
  onClose: () => void
  onEdit: () => void
  onNavigateTo?: (sectionIndex: number, itemId?: string) => void
}) {
  const [tab, setTab] = useState<'entries' | 'team'>('entries')
  const [entries, setEntries] = useState<Entry[]>([])
  const hc = healthColor(project.health)

  useEffect(() => {
    supabase.from('entries').select('id,title,type,status,created_at').eq('project_id', project.id)
      .order('created_at', { ascending: false }).limit(16)
      .then(({ data }) => setEntries((data ?? []) as Entry[]))
  }, [project.id])

  const TYPE_COLOR: Record<string, string> = {
    task:'#3B82F6', note:'#8B5CF6', decision:'#F59E0B', meet:'#10B981', idea:'#EC4899', log:'#71717A',
  }

  return (
    <motion.div
      initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        position: 'fixed', right: 0, top: 0, height: '100vh', width: 340,
        background: 'var(--surface-1)', borderLeft: '1px solid var(--border)',
        zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'hidden',
        boxShadow: `-4px 0 24px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        {/* Colored top accent */}
        <div style={{ height: 3, background: STATUS_COLOR[project.status] ?? 'var(--border)' }} />
        <div style={{ padding: '14px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
            <button onClick={onEdit} style={{ fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 500, background: 'none',
              border: '1px solid var(--border)', borderRadius: 3, padding: '3px 8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>
              <X size={14} />
            </button>
          </div>
          {/* Editorial: large initial + name + status badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 40, fontWeight: 700,
              color: STATUS_COLOR[project.status] ?? 'var(--text-muted)', lineHeight: 0.9, flexShrink: 0 }}>
              {project.name[0]?.toUpperCase() ?? '?'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 16, fontWeight: 700,
                color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.2 }}>
                {project.name}
              </h3>
              <span style={{
                fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                padding: '2px 7px', borderRadius: 3,
                background: `${STATUS_COLOR[project.status] ?? '#52525B'}20`,
                border: `1px solid ${STATUS_COLOR[project.status] ?? '#52525B'}40`,
                color: STATUS_COLOR[project.status] ?? 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
            </div>
          </div>
          {project.description && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {project.description}
            </p>
          )}
          <HealthBar h={project.health} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {[['done', project.health.done, '#22C55E'], ['pending', project.health.pending + project.health.in_progress, '#EAB308'], ['blocked', project.health.blocked, '#EF4444']].map(([l, v, c]) => (
              <span key={l as string} style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {v as number} {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['entries', 'team'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '10px 0', fontFamily: 'var(--font-inter)', fontSize: 12,
              fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? `2px solid var(--accent)` : '2px solid transparent',
              transition: 'all 0.15s' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === 'entries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 20 }}>
                <div className="empty-state-icon">📭</div>
                <p>No entries yet</p>
              </div>
            ) : entries.map(e => (
              <div
                key={e.id}
                onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, e.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e2 => { (e2.currentTarget as HTMLDivElement).style.background = 'var(--surface-3)'; (e2.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-active)' }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; (e2.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
              >
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: TYPE_COLOR[e.type] ?? '#52525B', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {e.title}
                </span>
                <ExternalLink size={9} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.6 }} />
              </div>
            ))}
          </div>
        )}
        {tab === 'team' && (
          <div className="empty-state" style={{ paddingTop: 20 }}>
            <div className="empty-state-icon">👥</div>
            <p>No team data</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES)}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <ExternalLink size={10} /> Open all entries
        </button>
      </div>
    </motion.div>
  )
}

// ── Summary pills ───────────────────────────────────────────────────
function StatusSummary({ projects }: { projects: ProjectFull[] }) {
  const counts = { active: 0, paused: 0, done: 0 }
  for (const p of projects) {
    if (p.status === 'active') counts.active++
    else if (p.status === 'paused') counts.paused++
    else if (p.status === 'done') counts.done++
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {[['active', counts.active, '#22C55E'], ['paused', counts.paused, '#EAB308'], ['done', counts.done, '#3B82F6']].map(([l, v, c]) => (
        <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: c as string, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {v as number} {(l as string)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
export function SectionProjects({ direction, onNavigateTo }: SectionProps) {
  const [projects, setProjects] = useState<ProjectFull[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [detailProject, setDetailProject] = useState<ProjectFull | null>(null)

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    const { data: ps, count } = await supabase
      .from('projects').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)

    if (!ps) { setLoading(false); return }

    // Fetch health data
    let healthMap: Record<string, HealthData> = {}
    try {
      const res = await fetch('/api/projects/health')
      if (res.ok) healthMap = await res.json()
    } catch { /* ignore */ }

    const withData = await Promise.all(
      ps.map(async proj => {
        const { count: c } = await supabase.from('entries').select('id', { count: 'exact', head: true }).eq('project_id', proj.id)
        const h = healthMap[proj.id] ?? { done: 0, pending: 0, in_progress: 0, blocked: 0 }
        return { ...proj, entryCount: c ?? 0, health: h } as ProjectFull
      })
    )
    setProjects(withData)
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await supabase.from('projects').insert({ name: newName.trim(), status: 'active' })
    setNewName(''); setAdding(false)
    load(page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <SectionWrapper direction={direction}>

        <SectionHeader
          title="Projects"
          subtitle={`${total} ${total === 1 ? 'project' : 'projects'}`}
          rightSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <StatusSummary projects={projects} />
              <button onClick={() => setAdding(true)} className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Plus size={10} /> New project
              </button>
            </div>
          }
        />

        {/* ── Add bar ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '10px 32px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="Project name…"
                  className="ctrl-input"
                  style={{ flex: 1, fontFamily: 'var(--font-inter)', fontSize: 13 }} />
                <button onClick={handleAdd} className="btn btn-primary">Create</button>
                <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid — scrollable ──────────────────────────────────── */}
        <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, alignItems: 'start' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 140, borderRadius: 8 }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 80 }}>
              <div className="empty-state-icon">📁</div>
              <p>No projects yet</p>
              <p className="empty-state-hint">Create a project to start organising your work</p>
            </div>
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, alignItems: 'start', paddingBottom: 20 }}
            >
              {projects.map((p, i) => {
                const sc = STATUS_COLOR[p.status] ?? '#52525B'
                const total = p.health.done + p.health.pending + p.health.in_progress + p.health.blocked || 1
                return (
                  <motion.div key={p.id}
                    custom={i}
                    variants={cardGrowAnim}
                    onClick={() => setDetailProject(p)}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                    }}
                    whileHover={{ y: -2, borderColor: 'var(--border-active)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  >
                    {/* Top accent strip */}
                    <div style={{ height: 3, background: sc, flexShrink: 0 }} />

                    {/* Card body */}
                    <div style={{ padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Row 1: name + status + count */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <h3 style={{
                          fontFamily: 'var(--font-space-grotesk)', fontSize: 14, fontWeight: 700,
                          color: 'var(--text-primary)', margin: 0, lineHeight: 1.3,
                          flex: 1, minWidth: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.name}
                        </h3>
                        <span style={{
                          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                          color: 'var(--text-muted)', background: 'var(--surface-2)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          padding: '2px 6px', flexShrink: 0, lineHeight: 1,
                        }}>
                          {p.entryCount}
                        </span>
                      </div>

                      {/* Row 2: status badge + stack pills */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                        <span style={{
                          fontFamily: 'var(--font-inter)', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
                          padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
                          border: `1px solid ${sc}40`, color: sc,
                          background: `${sc}0f`,
                        }}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                        {p.stack?.slice(0, 3).map(s => (
                          <span key={s} style={{
                            fontFamily: 'var(--font-inter)', fontSize: 9,
                            padding: '2px 5px', borderRadius: 3,
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}>
                            {s}
                          </span>
                        ))}
                        {(p.stack?.length ?? 0) > 3 && (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 9, color: 'var(--text-muted)' }}>
                            +{(p.stack?.length ?? 0) - 3}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p style={{
                          fontFamily: 'var(--font-inter)', fontSize: 11,
                          color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {p.description}
                        </p>
                      )}

                      {/* Health stats row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.health.done > 0 && (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontWeight: 600 }}>{p.health.done}</span>
                            <span style={{ opacity: 0.7 }}>done</span>
                          </span>
                        )}
                        {(p.health.pending + p.health.in_progress) > 0 && (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: '#EAB308', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontWeight: 600 }}>{p.health.pending + p.health.in_progress}</span>
                            <span style={{ opacity: 0.7 }}>open</span>
                          </span>
                        )}
                        {p.health.blocked > 0 && (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontWeight: 600 }}>{p.health.blocked}</span>
                            <span style={{ opacity: 0.7 }}>blocked</span>
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Health bar flush at bottom */}
                    <div style={{ height: 4, display: 'flex', flexShrink: 0 }}>
                      {p.health.done > 0 && <div style={{ flex: p.health.done / total, background: '#22C55E' }} />}
                      {(p.health.pending + p.health.in_progress) > 0 && <div style={{ flex: (p.health.pending + p.health.in_progress) / total, background: '#EAB308' }} />}
                      {p.health.blocked > 0 && <div style={{ flex: p.health.blocked / total, background: '#EF4444' }} />}
                      {total === 1 && <div style={{ flex: 1, background: 'var(--border)' }} />}
                    </div>

                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* ── Pagination — sticky bottom, outside scroll ─────────── */}
        {totalPages > 1 && (
          <div style={{
            borderTop: '1px solid var(--border)', padding: '10px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, background: 'var(--surface-1)',
          }}>
            <button onClick={() => { setPage(p => p - 1); load(page - 1) }} disabled={page === 0} className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={11} /> Prev
            </button>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
            <button onClick={() => { setPage(p => p + 1); load(page + 1) }} disabled={page >= totalPages - 1} className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Next <ChevronRight size={11} />
            </button>
          </div>
        )}

      {/* Slide-over */}
      <AnimatePresence>
        {detailProject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailProject(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }} />
            <ProjectDetail project={detailProject} onClose={() => setDetailProject(null)}
              onEdit={() => { setEditProject(detailProject); setDetailProject(null) }}
              onNavigateTo={onNavigateTo} />
          </>
        )}
      </AnimatePresence>
      </SectionWrapper>

      <EditProjectModal project={editProject} onClose={() => setEditProject(null)} onSaved={() => load(page)} />
    </>
  )
}
