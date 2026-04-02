'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { useIsMobile } from '@/lib/use-window-width'

interface EditModalProps {
  open: boolean
  title: React.ReactNode
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
  loading?: boolean
  children: React.ReactNode
}

export function EditModal({ open, title, onClose, onSave, onDelete, loading, children }: EditModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return }
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setConfirmDelete(false); onClose() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9998,
            }}
          />
          {/* Centered wrapper — no transform, just flex centering */}
          <div
            key="modal-wrap"
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.94, y: 20 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={isMobile ? {
                width: '100vw', height: '100dvh',
                background: 'var(--surface-1)',
                borderRadius: 0,
                padding: '16px 16px 32px',
                pointerEvents: 'all',
                overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
              } : {
                width: '90vw', maxWidth: 520,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 24,
                pointerEvents: 'all',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {title}
                </h2>
                <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>

              <motion.div variants={listVariants} initial="hidden" animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {children}
              </motion.div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'space-between', alignItems: 'center' }}>
                {onDelete ? (
                  confirmDelete ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>
                        Sure?
                      </span>
                      <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>
                        Cancel
                      </button>
                      <button onClick={onDelete} className="btn" style={{
                        fontSize: 11, padding: '4px 10px',
                        borderColor: 'rgba(239,68,68,0.5)', color: '#EF4444',
                        background: 'rgba(239,68,68,0.07)',
                      }}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="btn" style={{
                      fontSize: 12, padding: '6px 14px', borderColor: 'rgba(239,68,68,0.4)',
                      color: '#EF4444',
                    }}>Delete</button>
                  )
                ) : <div />}
                {!confirmDelete && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={onSave} disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
                      {loading ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div variants={rowVariants}>
      <label style={{
        fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 500,
        color: 'var(--text-muted)', display: 'block', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </motion.div>
  )
}

export function ModalInput({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 4, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)',
    fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' as const,
    boxSizing: 'border-box',
  }
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={base} />
  )
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
  )
}

export function ModalSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="ctrl-input"
      style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 4, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)',
        fontFamily: 'var(--font-inter)', outline: 'none', boxSizing: 'border-box' as const }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
