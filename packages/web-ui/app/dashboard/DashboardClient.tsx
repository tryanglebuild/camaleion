'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Calendar, FolderOpen, Users } from 'lucide-react'
import type { Entry } from '@context-engine/shared'
import { EntryCard } from '@/components/dashboard/EntryCard'
import { AddEntryModal } from '@/components/dashboard/AddEntryModal'
import { pageVariants, fadeUpVariants, statVariants, itemVariants, gridVariants } from '@/lib/animation-variants'

interface Stats { entries: number; today: number; projects: number; people: number }

const STATS = (s: Stats) => [
  { label: 'TOTAL ENTRIES', value: s.entries, icon: Database,   color: '#3B82F6' },
  { label: 'TODAY',         value: s.today,   icon: Calendar,   color: '#86EFAC' },
  { label: 'PROJECTS',      value: s.projects, icon: FolderOpen, color: '#A78BFA' },
  { label: 'PEOPLE',        value: s.people,  icon: Users,      color: '#FCD34D' },
]

export function DashboardClient({ stats, initialEntries }: { stats: Stats; initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [modalOpen, setModalOpen] = useState(false)

  async function refresh() {
    const res = await fetch('/api/entries?limit=12')
    if (res.ok) setEntries(await res.json())
    else window.location.reload()
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">

      {/* Page title */}
      <motion.div variants={fadeUpVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Memory Overview
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          Your AI context — {stats.entries} total entries
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {STATS(stats).map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            custom={i}
            variants={statVariants}
            initial="hidden"
            animate="visible"
            className="card p-4 overflow-hidden"
            style={{ originX: 0, borderLeft: `3px solid ${color}` }}
          >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
              <span className="module-label" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <Icon size={13} style={{ color }} />
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="text-3xl font-bold leading-none"
              style={{ fontFamily: 'var(--font-space-grotesk)', color }}
            >
              {value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* Recent entries */}
      <motion.div variants={fadeUpVariants} className="mb-5">
        <p className="module-label mb-0.5">MODULE_01 · MEMORY</p>
        <h2 className="text-base font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Recent Entries
        </h2>
      </motion.div>

      {entries.length === 0 ? (
        <motion.div variants={fadeUpVariants} className="card p-12 text-center">
          <p className="module-label mb-2">NO ENTRIES FOUND</p>
          <p className="text-xs text-[var(--text-muted)]">
            Use the <span className="text-[var(--accent)]">+ NEW</span> button or MCP tool{' '}
            <code className="text-[var(--text-mono)]">add_entry</code>.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={gridVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {entries.map((entry, i) => (
            <EntryCard key={entry.id} entry={entry} index={i} />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
