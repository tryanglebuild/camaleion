'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type TaskStatus = 'pending' | 'done' | 'blocked'

interface TaskEntry {
  id: string
  title: string
  content?: string
  status: TaskStatus
  created_at: string
}

interface PlanEntry {
  id: string
  title: string
  content?: string
  project?: { id: string; name: string } | null
  tags: string[]
  created_at: string
  tasks?: TaskEntry[]
}

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  done:    'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  blocked: 'text-red-400 border-red-400/40 bg-red-400/10',
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-20 animate-pulse bg-[var(--surface-2)]" />
      ))}
    </div>
  )
}

function PlanCard({ plan }: { plan: PlanEntry }) {
  const [open, setOpen] = useState(false)
  const tasks = plan.tasks ?? []
  const doneCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await supabase.from('entries').update({ status }).eq('id', taskId)
    plan.tasks = tasks.map(t => t.id === taskId ? { ...t, status } : t)
  }

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="mt-0.5 text-[var(--text-muted)] shrink-0">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {plan.project && (
              <span className="text-[8px] tracking-[0.1em] text-[var(--accent)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                {plan.project.name.toUpperCase()}
              </span>
            )}
            <span className="text-[8px] text-[var(--text-muted)] ml-auto" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              {new Date(plan.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {plan.title}
          </p>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-muted)] shrink-0" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                {doneCount}/{tasks.length}
              </span>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-4 space-y-3">
              {plan.content && (
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {plan.content}
                </p>
              )}
              {tasks.length === 0 ? (
                <p className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                  No tasks in this plan.
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-2.5 rounded bg-[var(--surface-2)]">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[7px] tracking-[0.08em] border shrink-0 mt-0.5 ${STATUS_COLORS[task.status]}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {task.status.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          {task.title}
                        </p>
                        {task.content && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{task.content}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(['pending', 'done', 'blocked'] as TaskStatus[]).filter(s => s !== task.status).map(s => (
                          <button
                            key={s}
                            onClick={() => updateTaskStatus(task.id, s)}
                            className="text-[8px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlanPage() {
  const [plans, setPlans] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: planData } = await supabase
      .from('entries')
      .select('*, project:projects(id, name)')
      .eq('type', 'plan')
      .order('created_at', { ascending: false })
      .limit(50)

    const planList = (planData ?? []) as PlanEntry[]

    if (planList.length > 0) {
      const { data: taskData } = await supabase
        .from('entries')
        .select('*')
        .eq('type', 'task')
        .order('created_at', { ascending: true })
        .limit(500)

      const tasks = (taskData ?? []) as (TaskEntry & { metadata?: Record<string, string> })[]
      planList.forEach(plan => {
        plan.tasks = tasks.filter(t => t.metadata?.plan_id === plan.id)
      })
    }

    setPlans(planList)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalTasks = plans.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
  const doneTasks = plans.reduce((s, p) => s + (p.tasks?.filter(t => t.status === 'done').length ?? 0), 0)

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      {/* Header */}
      <motion.div variants={fadeVariants} className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          AI Plans
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {loading ? 'LOADING…' : `${plans.length} PLANS // ${doneTasks}/${totalTasks} TASKS DONE`}
        </p>
      </motion.div>

      {/* Info */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex items-center gap-3 border-[var(--accent)]/30">
        <ListChecks size={14} className="text-[var(--accent)] shrink-0" />
        <p className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          Plans are created by Claude using <span className="text-[var(--accent)]">save_plan</span>. Each plan includes task breakdowns with status tracking. You can update task status below.
        </p>
      </motion.div>

      {/* Plans */}
      <motion.div variants={fadeVariants}>
        {loading ? (
          <Skeleton />
        ) : plans.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="module-label mb-2">&gt; NO PLANS FOUND_</p>
            <p className="text-xs text-[var(--text-muted)]">Ask Claude: &quot;Plan [project/feature] and save it&quot;</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
