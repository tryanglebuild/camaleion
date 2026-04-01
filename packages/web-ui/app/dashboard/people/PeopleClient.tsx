'use client'

import { motion, type Variants } from 'framer-motion'
import type { Person } from '@context-engine/shared'
import { Mail, Building2 } from 'lucide-react'
import { useLayoutMode } from '@/lib/use-layout-mode'

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

export function PeopleClient({ people }: { people: Person[] }) {
  const { mode, mounted } = useLayoutMode()
  const isSplit = mounted && mode === 'split'

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <motion.div variants={fadeVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          People
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {people.length} CONTACT{people.length !== 1 ? 'S' : ''} IN MEMORY
        </p>
      </motion.div>

      {people.length === 0 ? (
        <motion.div variants={fadeVariants} className="card p-14 text-center">
          <p className="module-label mb-2">&gt; NO CONTACTS_</p>
          <p className="text-xs text-[var(--text-muted)]">
            Use MCP tool <code className="text-[var(--text-mono)]">add_person</code>
          </p>
        </motion.div>
      ) : isSplit ? (
        /* ── SPLIT: table ── */
        <motion.div variants={fadeVariants} className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['NAME', 'ROLE', 'COMPANY', 'EMAIL'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[9px] text-[var(--text-muted)] tracking-[0.12em]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((person, i) => (
                <motion.tr
                  key={person.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0"
                        style={{ background: 'var(--accent-glow)', border: '1px solid rgba(59,130,246,0.2)', fontFamily: 'var(--font-space-grotesk)' }}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]"
                        style={{ fontFamily: 'var(--font-space-grotesk)' }}>{person.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{person.role ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{person.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    {person.email
                      ? <a href={`mailto:${person.email}`} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">{person.email}</a>
                      : <span className="text-xs text-[var(--text-muted)]">—</span>
                    }
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
          {people.map((person, i) => (
            <motion.div key={person.id} variants={cardVariants} custom={i} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold text-[var(--accent)] shrink-0"
                  style={{ background: 'var(--accent-glow)', border: '1px solid rgba(59,130,246,0.2)', fontFamily: 'var(--font-space-grotesk)' }}>
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}>{person.name}</p>
                  {person.role && <p className="text-[11px] text-[var(--text-secondary)]">{person.role}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {person.company && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <Building2 size={10} />{person.company}
                  </div>
                )}
                {person.email && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <Mail size={10} />
                    <a href={`mailto:${person.email}`} className="hover:text-[var(--accent)] transition-colors truncate">
                      {person.email}
                    </a>
                  </div>
                )}
              </div>
              {person.notes && (
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 pt-2.5 border-t border-[var(--border)]">
                  {person.notes}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
