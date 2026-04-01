'use client'
import { motion } from 'framer-motion'
import type { Entry } from '@context-engine/shared'
import { Badge } from '@/components/ui/Badge'
import { FolderOpen, Tag } from 'lucide-react'
import { cardVariants, itemVariants } from '@/lib/animation-variants'

const TYPE_BORDER: Record<string, string> = {
  task:     '#3B82F6',
  note:     '#8B5CF6',
  decision: '#F59E0B',
  meet:     '#10B981',
  idea:     '#EC4899',
  log:      '#71717A',
  analysis: '#06B6D4',
  plan:     '#8B5CF6',
  post:     '#F97316',
  file:     '#64748B',
}

interface EntryCardProps {
  entry: Entry
  index?: number
  onClick?: () => void
}

export function EntryCard({ entry, index = 0, onClick }: EntryCardProps) {
  const date = new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  const project = entry.project as { name: string } | null | undefined
  const accentColor = TYPE_BORDER[entry.type] ?? '#71717A'

  return (
    <motion.div
      onClick={onClick}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px ${accentColor}33` }}
      className="card flex flex-col gap-0 group overflow-hidden"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `3px solid ${accentColor}`,
        originX: 0,
        transformOrigin: 'left center',
      }}
    >
      {/* Header row */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8,
          padding: '12px 14px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <Badge type={entry.type} />
          {entry.status && <Badge status={entry.status} />}
        </div>
        <span style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 9, color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          {date}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.45, margin: 0,
          padding: '0 14px 6px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.title}
      </motion.h3>

      {/* Content preview */}
      {entry.content && (
        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6, margin: 0,
            padding: '0 14px 10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {entry.content}
        </motion.p>
      )}

      {/* Footer */}
      {(project || (entry.tags && entry.tags.length > 0)) && (
        <motion.div
          variants={itemVariants}
          style={{
            marginTop: 'auto',
            padding: '8px 14px 10px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}
        >
          {project && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 9, color: 'var(--accent)',
            }}>
              <FolderOpen size={9} />{project.name}
            </span>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 9, color: 'var(--text-muted)',
            }}>
              <Tag size={9} />
              {entry.tags.slice(0, 2).join(', ')}
              {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
            </span>
          )}
        </motion.div>
      )}
      {/* Bottom type-color strip */}
      <div style={{
        height: 2, width: '100%', flexShrink: 0,
        background: `${accentColor}30`,
        borderRadius: '0 0 6px 6px',
      }} />
    </motion.div>
  )
}
