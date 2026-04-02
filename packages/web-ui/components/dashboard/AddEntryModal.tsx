'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import type { EntryType, EntryStatus } from '@context-engine/shared'
import { modalVariants, backdropVariants, itemVariants } from '@/lib/animation-variants'
import { useToast } from '@/components/ui/Toaster'
import { useIsMobile } from '@/lib/use-window-width'

const ENTRY_TYPES: EntryType[] = ['task', 'note', 'decision', 'meet', 'idea', 'log']
const STATUS_OPTIONS: EntryStatus[] = ['pending', 'done', 'blocked']

const TYPE_COLOR: Record<string, string> = {
  task: '#3B82F6', note: '#8B5CF6', decision: '#F59E0B',
  meet: '#10B981', idea: '#EC4899', log: '#71717A',
}

interface AddEntryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddEntryModal({ open, onClose, onSuccess }: AddEntryModalProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [type, setType] = useState<EntryType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<EntryStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reset = useCallback(() => {
    setType('note'); setTitle(''); setContent('')
    setProject(''); setTags(''); setStatus('pending'); setError('')
  }, [])

  useEffect(() => {
    if (!open) return
    reset()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, reset])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, title: title.trim(),
          content: content.trim() || undefined,
          project: project.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          status: type === 'task' ? status : undefined,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      toast('Entry saved')
      onSuccess(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const accentColor = TYPE_COLOR[type] ?? 'var(--accent)'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={isMobile ? undefined : modalVariants}
              initial={isMobile ? { opacity: 0, y: 40 } : 'hidden'}
              animate={isMobile ? { opacity: 1, y: 0 } : 'visible'}
              exit={isMobile ? { opacity: 0, y: 40 } : 'exit'}
              transition={isMobile ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] } : undefined}
              onClick={e => e.stopPropagation()}
              style={isMobile ? {
                position: 'fixed', inset: 0,
                background: 'var(--surface-1)',
                borderTop: `3px solid ${accentColor}`,
                borderRadius: 0,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              } : {
                borderTop: `3px solid ${accentColor}`,
              }}
              className={isMobile ? '' : 'card w-full max-w-lg overflow-hidden'}
            >
              {/* Header */}
              <motion.div variants={itemVariants} className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
                  <h2
                    className="text-sm font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    New entry
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded hover:bg-[var(--surface-2)]"
                >
                  <X size={14} />
                </button>
              </motion.div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-0 px-5 py-4">
                {/* Type selector */}
                <motion.div variants={itemVariants} className="mb-4">
                  <p className="text-[10px] text-[var(--text-muted)] mb-2 font-medium tracking-wider uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                    Type
                  </p>
                  <div className="grid grid-cols-6 gap-1">
                    {ENTRY_TYPES.map(t => (
                      <button
                        key={t} type="button" onClick={() => setType(t)}
                        className="py-1.5 rounded text-[10px] border transition-all capitalize"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          borderColor: type === t ? TYPE_COLOR[t] : 'var(--border)',
                          color: type === t ? TYPE_COLOR[t] : 'var(--text-muted)',
                          background: type === t ? `${TYPE_COLOR[t]}11` : 'transparent',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div variants={itemVariants} className="mb-3">
                  <input
                    className="ctrl-input"
                    placeholder="Title *"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                  />
                </motion.div>

                {/* Content */}
                <motion.div variants={itemVariants} className="mb-3">
                  <textarea
                    className="ctrl-input resize-none"
                    rows={3}
                    placeholder="Content (optional)"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </motion.div>

                {/* Project + Tags */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 mb-3">
                  <input className="ctrl-input" placeholder="Project" value={project} onChange={e => setProject(e.target.value)} />
                  <input className="ctrl-input" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
                </motion.div>

                {/* Status (task only) */}
                <AnimatePresence>
                  {type === 'task' && (
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <p className="text-[10px] text-[var(--text-muted)] mb-2 font-medium tracking-wider uppercase"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>Status</p>
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s} type="button" onClick={() => setStatus(s)}
                            className="flex-1 py-1.5 rounded text-[10px] capitalize border transition-all"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              borderColor: status === s ? 'var(--accent)' : 'var(--border)',
                              color: status === s ? 'var(--accent)' : 'var(--text-muted)',
                              background: status === s ? 'var(--accent-glow)' : 'transparent',
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p
                    variants={itemVariants}
                    className="text-[11px] text-red-400 border border-red-400/20 bg-red-400/5 rounded px-3 py-2 mb-3"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary w-full justify-center"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Plus size={12} /> Add entry</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
