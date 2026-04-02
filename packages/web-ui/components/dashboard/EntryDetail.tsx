'use client'

import { motion } from 'framer-motion'
import type { Entry } from '@context-engine/shared'
import { Badge } from '@/components/ui/Badge'
import { X, FolderOpen, Tag, Calendar, User, BookOpen } from 'lucide-react'
import { growContainerVariants, itemVariants, listVariants, rowVariants } from '@/lib/animation-variants'

interface EntryDetailProps {
  entry: Entry
  onClose?: () => void
}

export function EntryDetail({ entry, onClose }: EntryDetailProps) {
  const date = new Date(entry.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const time = new Date(entry.created_at).toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit',
  })
  const project = entry.project as { name: string } | null | undefined
  const person = entry.person as { name: string } | null | undefined

  return (
    <motion.div variants={growContainerVariants} initial="hidden" animate="visible"
      className="card h-full flex flex-col overflow-hidden" style={{ originX: 0 }}>
      {/* Header */}
      <motion.div variants={itemVariants}
        className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge type={entry.type} />
          {entry.status && <Badge status={entry.status} />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/dashboard/notes/${entry.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors border border-[var(--border)] hover:border-[var(--accent)] rounded px-2 py-1"
            style={{ fontFamily: 'var(--font-inter)', textDecoration: 'none' }}
          >
            <BookOpen size={10} /> Full page
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Body */}
      <motion.div variants={listVariants} initial="hidden" animate="visible"
        className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Title */}
        <motion.h2 variants={rowVariants}
          className="text-lg font-semibold text-[var(--text-primary)] leading-snug"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {entry.title}
        </motion.h2>

        {/* Content */}
        {entry.content && (
          <motion.div variants={rowVariants}>
            <p className="module-label mb-2">CONTENT</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </motion.div>
        )}

        {/* Meta */}
        <motion.div variants={rowVariants} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <p className="module-label">DATE</p>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <Calendar size={10} />
              {date} {time}
            </div>
          </div>
          {project && (
            <div className="flex flex-col gap-1">
              <p className="module-label">PROJECT</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)]">
                <FolderOpen size={10} />
                {project.name}
              </div>
            </div>
          )}
          {person && (
            <div className="flex flex-col gap-1">
              <p className="module-label">PERSON</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <User size={10} />
                {person.name}
              </div>
            </div>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="module-label">TAGS</p>
              <div className="flex items-center gap-1 flex-wrap">
                {entry.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Entry ID */}
        <motion.div variants={rowVariants} className="mt-auto pt-4 border-t border-[var(--border)]">
          <p className="module-label mb-1">ENTRY_ID</p>
          <p
            className="text-[10px] text-[var(--text-muted)] font-mono break-all"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {entry.id}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
