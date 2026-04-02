'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'
interface ToastItem { id: string; type: ToastType; message: string }

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export function useToast() { return useContext(ToastContext) }

const ICONS = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle }
const COLORS = { success: '#22C55E', error: '#EF4444', warning: '#F59E0B' }

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = ICONS[item.type]
  const color = COLORS[item.type]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'var(--surface-1)',
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
        minWidth: 220, maxWidth: 340,
        pointerEvents: 'all',
      }}
    >
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-inter)', fontSize: 13,
        color: 'var(--text-primary)', flex: 1, lineHeight: 1.4,
      }}>
        {item.message}
      </span>
      <button
        onClick={() => onDismiss(item.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 2, lineHeight: 1, flexShrink: 0 }}
      >
        <X size={11} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = String(++counter.current)
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column-reverse', gap: 8,
        zIndex: 99999, pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(item => (
            <Toast key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
