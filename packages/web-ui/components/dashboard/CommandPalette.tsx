'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Search, LayoutDashboard, Database, SearchIcon, FolderOpen, Building2, Users, CheckSquare, Shield, BarChart2, Map, FileText, Network, Settings, GitCommitVertical, Bot, MessageSquare } from 'lucide-react'

export const PALETTE_SECTIONS = [
  { label: 'Dashboard',  icon: LayoutDashboard, index: 0 },
  { label: 'Memory',     icon: Database,         index: 1 },
  { label: 'Search',     icon: SearchIcon,       index: 2 },
  { label: 'Projects',   icon: FolderOpen,       index: 3 },
  { label: 'Companies',  icon: Building2,        index: 4 },
  { label: 'People',     icon: Users,            index: 5 },
  { label: 'Chat',       icon: MessageSquare,    index: 6 },
  { label: 'Agents',     icon: Bot,              index: 7 },
  { label: 'Analyze',    icon: BarChart2,        index: 8 },
  { label: 'Plan',       icon: Map,              index: 9 },
  { label: 'Content',    icon: FileText,         index: 10 },
  { label: 'Graph',      icon: Network,          index: 11 },
  { label: 'Timeline',   icon: GitCommitVertical, index: 12 },
  { label: 'Tasks',      icon: CheckSquare,      index: 13 },
  { label: 'Rules',      icon: Shield,           index: 14 },
  { label: 'Settings',   icon: Settings,          index: 15 },
]

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function CommandPalette({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const filtered = PALETTE_SECTIONS.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => { setCursor(0) }, [query])

  // Auto-scroll active item into view
  useEffect(() => {
    itemRefs.current[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && filtered[cursor]) {
        onNavigate(filtered[cursor].index)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, cursor, filtered, onClose, onNavigate])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 99990,
            }}
          />
          <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '15vh', zIndex: 99991, pointerEvents: 'none',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '90vw', maxWidth: 480,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                pointerEvents: 'all',
              }}
            >
              {/* Search input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Go to section…"
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontFamily: 'var(--font-inter)', fontSize: 14,
                    color: 'var(--text-primary)',
                  }}
                />
                <kbd style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                  color: 'var(--text-muted)', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 4,
                  padding: '2px 6px',
                }}>esc</kbd>
              </div>

              {/* Results */}
              <div ref={listRef} style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)' }}>
                    No sections found
                  </div>
                ) : filtered.map((s, i) => {
                  const Icon = s.icon
                  const active = i === cursor
                  return (
                    <div
                      key={s.index}
                      ref={el => { itemRefs.current[i] = el }}
                      onClick={() => { onNavigate(s.index); onClose() }}
                      onMouseEnter={() => setCursor(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', cursor: 'pointer',
                        background: active ? 'var(--surface-2)' : 'transparent',
                        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <Icon size={14} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{
                        fontFamily: 'var(--font-inter)', fontSize: 13,
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: active ? 500 : 400,
                      }}>
                        {s.label}
                      </span>
                      {active && (
                        <kbd style={{
                          marginLeft: 'auto',
                          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                          color: 'var(--text-muted)', background: 'var(--surface-3)',
                          border: '1px solid var(--border)', borderRadius: 4,
                          padding: '2px 6px',
                        }}>↵</kbd>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer hint */}
              <div style={{
                padding: '8px 16px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 16, alignItems: 'center',
              }}>
                {[['↑↓', 'navigate'], ['↵', 'open'], ['N', 'new entry']].map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <kbd style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                      color: 'var(--text-muted)', background: 'var(--surface-2)',
                      border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px',
                    }}>{key}</kbd>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
