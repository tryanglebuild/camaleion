'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Trash2, X } from 'lucide-react'
import type { SectionProps } from './types'
import { SECTION_INDEX } from './types'
import { supabase } from '@/lib/supabase'
import { SectionWrapper, SectionHeader } from './SectionLayout'

type TaskStatus = 'pending' | 'done' | 'blocked'

interface TaskEntry { id: string; title: string; content?: string; status: TaskStatus; metadata?: Record<string, string> }
interface PlanEntry { id: string; title: string; content?: string; project?: { id: string; name: string } | null; tags: string[]; created_at: string; tasks?: TaskEntry[] }

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending:  '#EAB308',
  done:     '#22C55E',
  blocked:  '#EF4444',
}

// Small status dot/icon
function StatusDot({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return (
      <span style={{ color: '#22C55E', fontSize: 13, lineHeight: 1, flexShrink: 0 }}>✓</span>
    )
  }
  if (status === 'blocked') {
    return (
      <span style={{ color: '#EF4444', fontSize: 12, lineHeight: 1, flexShrink: 0, fontWeight: 700 }}>✕</span>
    )
  }
  // pending
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      border: '1.5px solid #EAB308', background: 'transparent', flexShrink: 0,
    }} />
  )
}

// Multi-segment progress bar
function SegmentedBar({ tasks }: { tasks: TaskEntry[] }) {
  if (tasks.length === 0) return null
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const pending = total - done - blocked

  return (
    <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', width: '100%', background: 'var(--surface-3)' }}>
      {done > 0 && (
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: '#22C55E' }}
        />
      )}
      {blocked > 0 && (
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${(blocked / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
          style={{ height: '100%', background: '#EF4444' }}
        />
      )}
      {pending > 0 && (
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${(pending / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          style={{ height: '100%', background: '#EAB308', opacity: 0.45 }}
        />
      )}
    </div>
  )
}

export function SectionPlan({ direction, onNavigateTo }: SectionProps) {
  const [plans, setPlans] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    const { data: planData } = await supabase.from('entries').select('*, project:projects(id, name)').eq('type', 'plan').order('created_at', { ascending: false }).limit(50)
    const planList = (planData ?? []) as PlanEntry[]
    if (planList.length > 0) {
      const { data: taskData } = await supabase.from('entries').select('*').eq('type', 'task').order('created_at', { ascending: true }).limit(500)
      const tasks = (taskData ?? []) as (TaskEntry & { metadata?: Record<string, string> })[]
      planList.forEach(plan => { plan.tasks = tasks.filter(t => t.metadata?.plan_id === plan.id) })
    }
    setPlans(planList)
    // All plans expanded by default
    setOpen(new Set(planList.map(p => p.id)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleOpen = (id: string) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const updateTaskStatus = async (taskId: string, status: TaskStatus, planId: string) => {
    await supabase.from('entries').update({ status }).eq('id', taskId)
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: p.tasks?.map(t => t.id === taskId ? { ...t, status } : t) } : p))
  }

  const deleteTask = async (taskId: string, planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: p.tasks?.filter(t => t.id !== taskId) } : p))
    await supabase.from('entries').delete().eq('id', taskId)
  }

  const deletePlan = async (plan: PlanEntry) => {
    setPlans(prev => prev.filter(p => p.id !== plan.id))
    const taskIds = (plan.tasks ?? []).map(t => t.id)
    if (taskIds.length > 0) await supabase.from('entries').delete().in('id', taskIds)
    await supabase.from('entries').delete().eq('id', plan.id)
  }

  const totalTasks = plans.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
  const doneTasks = plans.reduce((s, p) => s + (p.tasks?.filter(t => t.status === 'done').length ?? 0), 0)

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Plans" subtitle={loading ? 'Loading…' : `${plans.length} plans · ${doneTasks}/${totalTasks} tasks done`} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 8 }} />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No plans yet</p>
            <p className="empty-state-hint">Ask Claude to plan a feature and save it</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820 }}>
            <AnimatePresence>
              {plans.map(plan => {
                const tasks = plan.tasks ?? []
                const done = tasks.filter(t => t.status === 'done').length
                const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0
                const isOpen = open.has(plan.id)

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    style={{
                      background: 'var(--surface-1)', border: '1px solid var(--border)',
                      borderRadius: 8, overflow: 'hidden', marginBottom: 0,
                    }}
                  >
                    {/* Plan header */}
                    <div style={{ padding: '12px 14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <button
                          onClick={() => toggleOpen(plan.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1, flexShrink: 0 }}
                        >
                          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>

                        {/* Title */}
                        <span style={{
                          fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 600,
                          color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{plan.title}</span>

                        {/* Project badge */}
                        {plan.project && (
                          <span style={{
                            fontSize: 10, fontFamily: 'var(--font-inter)', fontWeight: 500,
                            color: 'var(--accent)', background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                            borderRadius: 4, padding: '1px 6px', flexShrink: 0, opacity: 0.85,
                          }}>{plan.project.name}</span>
                        )}

                        {/* Progress % */}
                        {tasks.length > 0 && (
                          <span style={{
                            fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)',
                            color: progress === 100 ? '#22C55E' : 'var(--text-muted)',
                            flexShrink: 0,
                          }}>{progress}%</span>
                        )}

                        {/* Task count */}
                        {tasks.length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)', flexShrink: 0 }}>
                            {done}/{tasks.length}
                          </span>
                        )}

                        {/* Delete plan */}
                        <button
                          onClick={() => deletePlan(plan)}
                          title="Delete plan and all its tasks"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        ><Trash2 size={12} /></button>
                      </div>

                      {/* Progress bar */}
                      {tasks.length > 0 && (
                        <div style={{ paddingLeft: 21, paddingBottom: 10 }}>
                          <SegmentedBar tasks={tasks} />
                        </div>
                      )}
                    </div>

                    {/* Task rows */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', borderTop: tasks.length > 0 ? '1px solid var(--border)' : 'none' }}
                        >
                          <div style={{ padding: '6px 0 8px' }}>
                            {plan.content && (
                              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 14px 8px 35px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{plan.content}</p>
                            )}
                            {tasks.length === 0 ? (
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)', fontStyle: 'italic', padding: '6px 14px 4px 35px' }}>No tasks yet</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <AnimatePresence>
                                  {tasks.map(task => (
                                    <motion.div
                                      key={task.id}
                                      layout
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 4 }}
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '20px 1fr auto auto',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '5px 12px 5px 14px',
                                        transition: 'background 0.12s',
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      {/* Status indicator */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <StatusDot status={task.status} />
                                      </div>

                                      {/* Task title */}
                                      <span style={{
                                        fontSize: 12, fontFamily: 'var(--font-inter)',
                                        color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                      }}>{task.title}</span>

                                      {/* → tasks chip */}
                                      <div>
                                        {onNavigateTo && task.status !== 'done' && (
                                          <button
                                            onClick={() => onNavigateTo(SECTION_INDEX.TASKS, task.id)}
                                            title="Open in Tasks"
                                            style={{
                                              padding: '1px 7px', borderRadius: 4, fontSize: 10,
                                              fontFamily: 'var(--font-inter)', border: '1px solid var(--border)',
                                              color: 'var(--text-muted)', background: 'none', cursor: 'pointer',
                                              letterSpacing: '0.03em', transition: 'color 0.12s, border-color 0.12s',
                                              whiteSpace: 'nowrap',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                                          >→ tasks</button>
                                        )}
                                      </div>

                                      {/* Status cycle + delete */}
                                      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                        {(['pending', 'done', 'blocked'] as TaskStatus[]).filter(s => s !== task.status).map(s => (
                                          <button
                                            key={s}
                                            onClick={() => updateTaskStatus(task.id, s, plan.id)}
                                            title={`Mark as ${s}`}
                                            style={{
                                              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                              border: `1.5px solid ${STATUS_COLOR[s]}`,
                                              background: 'transparent', cursor: 'pointer', padding: 0,
                                              transition: 'background 0.12s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = STATUS_COLOR[s])}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                          />
                                        ))}
                                        <button
                                          onClick={() => deleteTask(task.id, plan.id)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 1px', lineHeight: 1, transition: 'color 0.12s', marginLeft: 2 }}
                                          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                        ><X size={11} /></button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}
