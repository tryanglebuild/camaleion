'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutGrid, PanelRight, Plus } from 'lucide-react'
import { useLayoutMode } from '@/lib/use-layout-mode'
import { useState } from 'react'
import { AddEntryModal } from '@/components/dashboard/AddEntryModal'
import { growContainerVariants, itemVariants } from '@/lib/animation-variants'

const ROUTE_META: Record<string, { module: string; label: string }> = {
  '/dashboard':          { module: 'MODULE_00', label: 'Overview' },
  '/dashboard/entries':  { module: 'MODULE_01 · MEMORY', label: 'Entries' },
  '/dashboard/search':   { module: 'MODULE_02 · RAG', label: 'Search' },
  '/dashboard/projects': { module: 'MODULE_03', label: 'Projects' },
  '/dashboard/people':   { module: 'MODULE_04', label: 'People' },
  '/dashboard/rules':    { module: 'MODULE_05', label: 'Rules' },
  '/dashboard/analyze':  { module: 'MODULE_06', label: 'Analyses' },
  '/dashboard/plan':     { module: 'MODULE_07', label: 'Plans' },
  '/dashboard/generate': { module: 'MODULE_08', label: 'Content' },
}

export function TopBar() {
  const pathname = usePathname()
  const { mode, toggle, mounted } = useLayoutMode()
  const [modalOpen, setModalOpen] = useState(false)
  const meta = ROUTE_META[pathname] ?? { module: 'BRAIN', label: '' }

  const showToggle = pathname === '/dashboard/entries' || pathname === '/dashboard/projects' || pathname === '/dashboard/people'

  return (
    <>
      <motion.header
        variants={growContainerVariants}
        initial="hidden"
        animate="visible"
        style={{ originX: 0 }}
        className="h-12 border-b border-[var(--border)] bg-[var(--surface-1)] flex items-center px-5 gap-4 shrink-0 sticky top-0 z-20"
      >
        {/* Breadcrumb */}
        <motion.div variants={itemVariants} className="flex-1 flex items-center gap-2.5">
          <span
            className="text-[9px] text-[var(--text-mono-dim)] tracking-[0.14em] font-medium"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {meta.module}
          </span>
          {meta.label && (
            <>
              <span className="text-[var(--border-active)] text-xs select-none">/</span>
              <span
                className="text-[11px] font-medium text-[var(--text-secondary)]"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {meta.label}
              </span>
            </>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          {/* Layout toggle */}
          {showToggle && mounted && (
            <motion.button
              whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              onClick={toggle}
              title={mode === 'grid' ? 'Switch to Split view' : 'Switch to Grid view'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] transition-colors text-[9px] tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {mode === 'grid'
                ? <><PanelRight size={11} /> SPLIT</>
                : <><LayoutGrid size={11} /> GRID</>
              }
            </motion.button>
          )}

          {/* New entry */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--accent)] text-white text-[9px] tracking-[0.1em] font-medium"
            style={{ fontFamily: 'var(--font-jetbrains-mono)', boxShadow: '0 1px 4px var(--accent-glow-lg)' }}
          >
            <Plus size={11} /> NEW
          </motion.button>
        </motion.div>
      </motion.header>

      <AddEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  )
}
