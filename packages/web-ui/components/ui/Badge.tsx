import type { EntryType, EntryStatus } from '@context-engine/shared'

const typeConfig: Record<EntryType, { label: string; color: string }> = {
  task:     { label: 'TASK',     color: 'text-blue-600 border-blue-200 bg-blue-50' },
  note:     { label: 'NOTE',     color: 'text-stone-600 border-stone-200 bg-stone-50' },
  decision: { label: 'DECISION', color: 'text-violet-600 border-violet-200 bg-violet-50' },
  meet:     { label: 'MEET',     color: 'text-amber-600 border-amber-200 bg-amber-50' },
  idea:     { label: 'IDEA',     color: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
  log:      { label: 'LOG',      color: 'text-orange-600 border-orange-200 bg-orange-50' },
  analysis: { label: 'ANALYSIS', color: 'text-cyan-700 border-cyan-200 bg-cyan-50' },
  plan:     { label: 'PLAN',     color: 'text-indigo-600 border-indigo-200 bg-indigo-50' },
  post:     { label: 'POST',     color: 'text-pink-600 border-pink-200 bg-pink-50' },
  file:     { label: 'FILE',     color: 'text-teal-600 border-teal-200 bg-teal-50' },
}

const statusDot: Record<EntryStatus, string> = {
  pending:     'bg-amber-500',
  in_progress: 'bg-blue-500',
  done:        'bg-emerald-500',
  blocked:     'bg-red-500',
}
const statusColor: Record<EntryStatus, string> = {
  pending:     'text-amber-700 border-amber-200 bg-amber-50',
  in_progress: 'text-blue-700 border-blue-200 bg-blue-50',
  done:        'text-emerald-700 border-emerald-200 bg-emerald-50',
  blocked:     'text-red-700 border-red-200 bg-red-50',
}

interface BadgeProps {
  type?: EntryType
  status?: EntryStatus
  text?: string
  className?: string
}

const base = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] tracking-[0.08em] border'

export function Badge({ type, status, text, className = '' }: BadgeProps) {
  if (type) {
    const c = typeConfig[type]
    return (
      <span className={`${base} ${c.color} ${className}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
        {c.label}
      </span>
    )
  }
  if (status) {
    return (
      <span className={`${base} ${statusColor[status]} ${className}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
        <span className={`w-1 h-1 rounded-full shrink-0 ${statusDot[status]}`} />
        {status.toUpperCase()}
      </span>
    )
  }
  if (text) {
    return (
      <span className={`${base} text-stone-600 border-stone-200 bg-stone-50 ${className}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
        {text}
      </span>
    )
  }
  return null
}
