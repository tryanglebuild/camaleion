'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import type { Entry, EntryType, EntryStatus } from '@context-engine/shared'
import { supabase } from '@/lib/supabase'
import { EntryCard } from '@/components/dashboard/EntryCard'
import { EntryDetail } from '@/components/dashboard/EntryDetail'
import { AddEntryModal } from '@/components/dashboard/AddEntryModal'
import { useLayoutMode } from '@/lib/use-layout-mode'

const TYPES: EntryType[] = ['task', 'note', 'decision', 'meet', 'idea', 'log']
const STATUSES: EntryStatus[] = ['pending', 'done', 'blocked']

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}
const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="card h-36 animate-pulse bg-[var(--surface-2)]" />
      ))}
    </div>
  )
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Entry | null>(null)
  const [filterType, setFilterType] = useState<EntryType | ''>('')
  const [filterStatus, setFilterStatus] = useState<EntryStatus | ''>('')
  const [filterSearch, setFilterSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const { mode, mounted } = useLayoutMode()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('entries')
      .select('*, project:projects(id, name), person:people(id, name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setEntries((data ?? []) as Entry[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = entries.filter(e => {
    if (filterType && e.type !== filterType) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      return e.title.toLowerCase().includes(q) || (e.content ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const hasFilters = !!(filterType || filterStatus || filterSearch)

  const isSplit = mounted && mode === 'split'

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      {/* Header */}
      <motion.div variants={fadeVariants} className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Memory Entries
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {loading ? 'LOADING…' : `${filtered.length} / ${entries.length} ENTRIES`}
        </p>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={12} className="text-[var(--text-muted)] shrink-0" />
        <input
          className="ctrl-input !w-36"
          placeholder="Search…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(v => v === t ? '' : t)}
              className={`px-2 py-1 rounded text-[9px] tracking-[0.06em] border transition-all ${
                filterType === t
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
              }`}
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(v => v === s ? '' : s)}
              className={`px-2 py-1 rounded text-[9px] tracking-[0.06em] border transition-all ${
                filterStatus === s
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
              }`}
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); setFilterSearch('') }}
            className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            <X size={10} /> CLEAR
          </button>
        )}
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeVariants}>
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="module-label mb-2">&gt; NO ENTRIES FOUND_</p>
            <p className="text-xs text-[var(--text-muted)]">Adjust your filters</p>
          </div>
        ) : isSplit ? (
          /* ── SPLIT VIEW ── */
          <div className="flex gap-4 h-[calc(100vh-14rem)]">
            {/* Left: scrollable list */}
            <div className="w-72 xl:w-80 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map((entry, i) => (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(entry)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selected?.id === entry.id
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)] glow-border'
                        : 'card hover:border-[rgba(59,130,246,0.4)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-[8px] tracking-[0.1em] text-[var(--text-muted)]"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        {entry.type.toUpperCase()}
                      </span>
                      {entry.status && (
                        <span className="text-[8px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                          {entry.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      {entry.title}
                    </p>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Right: detail panel */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <EntryDetail entry={selected} onClose={() => setSelected(null)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-full card flex items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="module-label mb-2">&gt; SELECT AN ENTRY_</p>
                      <p className="text-xs text-[var(--text-muted)]">Click any entry on the left to view details</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <AnimatePresence mode="popLayout">
            <motion.div layout variants={gridVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  )
}
