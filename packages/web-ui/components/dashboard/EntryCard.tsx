'use client'
import { motion } from 'framer-motion'
import type { Entry } from '@context-engine/shared'
import { FolderOpen } from 'lucide-react'
import { cardVariants } from '@/lib/animation-variants'

const TYPE_META: Record<string, { label: string; color: string }> = {
  task:     { label: 'TASK',     color: '#3B82F6' },
  note:     { label: 'NOTE',     color: '#8B5CF6' },
  decision: { label: 'DECISION', color: '#F59E0B' },
  meet:     { label: 'MEET',     color: '#10B981' },
  idea:     { label: 'IDEA',     color: '#EC4899' },
  log:      { label: 'LOG',      color: '#71717A' },
  analysis: { label: 'ANALYSIS', color: '#06B6D4' },
  plan:     { label: 'PLAN',     color: '#6366F1' },
  post:     { label: 'POST',     color: '#F97316' },
  file:     { label: 'FILE',     color: '#64748B' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:     { label: 'pending',     color: '#EAB308' },
  in_progress: { label: 'in progress', color: '#3B82F6' },
  done:        { label: 'done',        color: '#22C55E' },
  blocked:     { label: 'blocked',     color: '#EF4444' },
}

interface EntryCardProps {
  entry: Entry
  index?: number
  onClick?: () => void
}

export function EntryCard({ entry, index = 0, onClick }: EntryCardProps) {
  const date = new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  const project = entry.project as { name: string } | null | undefined
  const meta  = TYPE_META[entry.type]   ?? { label: entry.type.toUpperCase(), color: '#71717A' }
  const sMeta = entry.status ? (STATUS_META[entry.status] ?? null) : null

  return (
    <motion.div
      onClick={onClick}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, borderColor: 'var(--border-active)', boxShadow: `0 6px 24px rgba(0,0,0,0.08)` }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Top type strip */}
      <div style={{ height: 2, background: meta.color, flexShrink: 0 }} />

      {/* Card content */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>

        {/* Row 1: type label + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 9, fontWeight: 600,
            letterSpacing: '0.1em',
            color: meta.color,
          }}>
            {meta.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 9, color: 'var(--text-muted)',
            opacity: 0.6, flexShrink: 0,
          }}>
            {date}
          </span>
        </div>

        {/* Row 2: title */}
        <h3 style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.4, margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {entry.title}
        </h3>

        {/* Row 3: content preview (1 line only — unobtrusive) */}
        {entry.content && (
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 11, color: 'var(--text-muted)',
            lineHeight: 1.5, margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            opacity: 0.8,
          }}>
            {entry.content}
          </p>
        )}

      </div>

      {/* Footer: status + project — always at bottom */}
      <div style={{
        padding: '7px 14px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap',
      }}>
        {sMeta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: sMeta.color, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-inter)', fontSize: 10,
              color: 'var(--text-muted)',
            }}>
              {sMeta.label}
            </span>
          </div>
        )}
        {project && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
            color: 'var(--text-muted)', opacity: 0.7,
            marginLeft: sMeta ? 'auto' : 0,
          }}>
            <FolderOpen size={8} strokeWidth={1.5} />
            {project.name}
          </span>
        )}
        {entry.tags && entry.tags.length > 0 && !project && (
          <span style={{
            fontFamily: 'var(--font-inter)', fontSize: 10,
            color: 'var(--text-muted)', opacity: 0.6,
          }}>
            {entry.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
          </span>
        )}
      </div>

    </motion.div>
  )
}

