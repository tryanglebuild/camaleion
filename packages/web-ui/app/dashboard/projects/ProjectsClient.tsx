'use client'

import { motion, type Variants } from 'framer-motion'
import type { Project } from '@context-engine/shared'
import { useLayoutMode } from '@/lib/use-layout-mode'

type P = Project & { entries: { count: number }[] }

const statusDot: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.6)]',
  paused: 'bg-yellow-400',
  done:   'bg-zinc-500',
}

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, delay: i * 0.05, ease: 'easeOut' as const },
  }),
}

export function ProjectsClient({ projects }: { projects: P[] }) {
  const { mode, mounted } = useLayoutMode()
  const isSplit = mounted && mode === 'split'

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <motion.div variants={fadeVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Projects
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {projects.length} PROJECT{projects.length !== 1 ? 'S' : ''} IN MEMORY
        </p>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div variants={fadeVariants} className="card p-14 text-center">
          <p className="module-label mb-2">&gt; NO PROJECTS_</p>
          <p className="text-xs text-[var(--text-muted)]">Projects are created automatically when adding entries.</p>
        </motion.div>
      ) : isSplit ? (
        /* ── SPLIT: table-style ── */
        <motion.div variants={fadeVariants} className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['NAME', 'COMPANY', 'STATUS', 'STACK', 'ENTRIES'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[9px] text-[var(--text-muted)] tracking-[0.12em]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}>{p.name}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status] ?? 'bg-zinc-500'}`} />
                      <span className="text-[10px] text-[var(--text-muted)]"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{p.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.stack ?? []).slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]"
                          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{t}</span>
                      ))}
                      {(p.stack ?? []).length > 3 && (
                        <span className="text-[9px] text-[var(--text-muted)]">+{p.stack!.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--accent)]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {p.entries?.[0]?.count ?? 0}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        /* ── GRID ── */
        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        >
          {projects.map((p, i) => (
            <motion.div key={p.id} variants={cardVariants} custom={i} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}>{p.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status] ?? 'bg-zinc-500'}`} />
                  <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{p.status}</span>
                </div>
              </div>
              {p.company && <p className="text-[11px] text-[var(--text-secondary)]">{p.company}</p>}
              {p.description && <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">{p.description}</p>}
              {p.stack && p.stack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.stack.map(tech => (
                    <span key={tech} className="px-1.5 py-0.5 text-[9px] rounded border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{tech}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-2.5 border-t border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                  {p.entries?.[0]?.count ?? 0} ENTR{(p.entries?.[0]?.count ?? 0) !== 1 ? 'IES' : 'Y'}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
