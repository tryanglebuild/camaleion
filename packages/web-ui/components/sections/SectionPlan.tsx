'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { SectionProps } from './types'
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

function PlanDetailPanel({ plan, onUpdateStatus, onDeleteTask }: {
  plan: PlanEntry
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onDeleteTask: (taskId: string) => void
}) {
  const tasks = plan.tasks ?? []
  const done = tasks.filter(t => t.status === 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Detail header */}
      <div style={{ padding: '16px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          {plan.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: tasks.length > 0 ? 10 : 0 }}>
          {plan.project && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 2, padding: '2px 6px' }}>
              {plan.project.name}
            </span>
          )}
          {tasks.length > 0 && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
              {done}/{tasks.length} tasks · {Math.round((done / tasks.length) * 100)}% · {blocked} blocked
            </span>
          )}
        </div>
        {tasks.length > 0 && <SegmentedBar tasks={tasks} />}
      </div>
      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {plan.content && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 24px 12px', lineHeight: 1.5 }}>{plan.content}</p>
        )}
        {tasks.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)', fontStyle: 'italic', padding: '8px 24px' }}>No tasks</p>
        ) : tasks.map(task => (
          <div key={task.id}
            style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', alignItems: 'start', gap: 8, padding: '7px 24px', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
              <StatusDot status={task.status} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-inter)', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'done' ? 'line-through' : 'none', lineHeight: 1.4 }}>
                {task.title}
              </span>
              {task.content && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>{task.content}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center', paddingTop: 2 }}>
              {(['pending', 'done', 'blocked'] as TaskStatus[]).filter(s => s !== task.status).map(s => (
                <button key={s} onClick={() => onUpdateStatus(task.id, s)}
                  style={{ width: 7, height: 7, borderRadius: '50%', border: `1.5px solid ${STATUS_COLOR[s]}`, background: 'transparent', cursor: 'pointer', padding: 0, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = STATUS_COLOR[s])}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                />
              ))}
              <button onClick={() => onDeleteTask(task.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 1px', lineHeight: 1, transition: 'color 0.12s', marginLeft: 2 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              ><X size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SectionPlan({ direction }: SectionProps) {
  const [plans, setPlans] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanEntry | null>(null)

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
    setSelectedPlan(prev => prev ? (planList.find(p => p.id === prev.id) ?? planList[0] ?? null) : (planList[0] ?? null))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateTaskStatus = async (taskId: string, status: TaskStatus, planId: string) => {
    await supabase.from('entries').update({ status }).eq('id', taskId)
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: p.tasks?.map(t => t.id === taskId ? { ...t, status } : t) } : p))
    setSelectedPlan(prev => prev?.id === planId ? { ...prev, tasks: prev.tasks?.map(t => t.id === taskId ? { ...t, status } : t) } : prev)
  }

  const deleteTask = async (taskId: string, planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: p.tasks?.filter(t => t.id !== taskId) } : p))
    setSelectedPlan(prev => prev?.id === planId ? { ...prev, tasks: prev.tasks?.filter(t => t.id !== taskId) } : prev)
    await supabase.from('entries').delete().eq('id', taskId)
  }

  const deletePlan = async (plan: PlanEntry) => {
    setPlans(prev => prev.filter(p => p.id !== plan.id))
    setSelectedPlan(prev => prev?.id === plan.id ? (plans.find(p => p.id !== plan.id) ?? null) : prev)
    const taskIds = (plan.tasks ?? []).map(t => t.id)
    if (taskIds.length > 0) await supabase.from('entries').delete().in('id', taskIds)
    await supabase.from('entries').delete().eq('id', plan.id)
  }

  const totalTasks = plans.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
  const doneTasks = plans.reduce((s, p) => s + (p.tasks?.filter(t => t.status === 'done').length ?? 0), 0)

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Plans" subtitle={loading ? 'Loading…' : `${plans.length} plans · ${doneTasks}/${totalTasks} tasks done`} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* Left panel — plans list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* List header */}
          <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface-1)' }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PLANS</span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{plans.length}</span>
          </div>
          {/* Scrollable list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, margin: '4px 8px', borderRadius: 4 }} />)
            ) : plans.length === 0 ? (
              <div style={{ padding: '20px 16px' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', opacity: 0.4 }}>// NO PLANS YET</span>
              </div>
            ) : plans.map(plan => {
              const tasks = plan.tasks ?? []
              const done = tasks.filter(t => t.status === 'done').length
              const blocked = tasks.filter(t => t.status === 'blocked').length
              const borderColor = tasks.length === 0 ? 'var(--border)' : done === tasks.length ? '#22C55E' : blocked > 0 ? '#EF4444' : '#EAB308'
              const isSelected = selectedPlan?.id === plan.id
              return (
                <div key={plan.id} className="group"
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderLeft: `3px solid ${isSelected ? borderColor : 'transparent'}`,
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? 'var(--surface-2)' : 'transparent',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-1)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plan.title}
                    </span>
                    {plan.project && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 2, padding: '1px 5px', flexShrink: 0 }}>
                        {plan.project.name}
                      </span>
                    )}
                    <button className="opacity-0 group-hover:opacity-100"
                      onClick={e => { e.stopPropagation(); deletePlan(plan) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, transition: 'opacity 0.15s,color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    ><X size={11} /></button>
                  </div>
                  {tasks.length > 0 && (
                    <>
                      <SegmentedBar tasks={tasks} />
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                        {done}/{tasks.length}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel — plan detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {selectedPlan ? (
            <PlanDetailPanel
              plan={selectedPlan}
              onUpdateStatus={(taskId, status) => updateTaskStatus(taskId, status, selectedPlan.id)}
              onDeleteTask={(taskId) => deleteTask(taskId, selectedPlan.id)}
            />
          ) : (
            <div style={{ padding: '20px 24px' }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', opacity: 0.4 }}>
                // NO PLAN SELECTED
              </span>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
