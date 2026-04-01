'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, ChevronRight, FolderOpen, X } from 'lucide-react'
import type { Project } from '@context-engine/shared'

interface CompanyGroup { company: string; projects: Project[] }

const STATUS_COLOR: Record<string, string> = { active: '#22C55E', paused: '#EAB308', done: '#3B82F6' }
const COMPANY_COLOR: Record<string, string> = {
  dengun: '#3B82F6',
  tryangle: '#8B5CF6',
  personal: '#22C55E',
}

function companyColor(name: string) {
  return COMPANY_COLOR[name.toLowerCase()] ?? '#52525B'
}

export function CompaniesClient({ companies }: { companies: CompanyGroup[] }) {
  const [selected, setSelected] = useState<CompanyGroup | null>(null)

  const totalProjects = companies.reduce((s, c) => s + c.projects.length, 0)

  return (
    <div style={{ padding: '32px 32px 32px 80px', display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: '#3B82F6', letterSpacing: '0.14em', marginBottom: 4 }}>
          MODULE_09 // COMPANIES
        </p>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 22, fontWeight: 700, color: '#F4F4F5', margin: 0 }}>
          Companies
        </h1>
        <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#52525B', marginTop: 4 }}>
          {companies.length} COMPANIES // {totalProjects} PROJECTS TOTAL
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, minHeight: 0 }}>
        {/* Company list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 260, flexShrink: 0 }}>
          {companies.map(({ company, projects }) => {
            const active = projects.filter(p => p.status === 'active').length
            const isSelected = selected?.company === company
            const color = companyColor(company)
            return (
              <button
                key={company}
                onClick={() => setSelected(isSelected ? null : { company, projects })}
                style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 8,
                  border: `1px solid ${isSelected ? color : '#222'}`,
                  background: isSelected ? `${color}12` : '#111',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <Building2 size={14} style={{ color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 600, color: '#E4E4E7', margin: 0, textTransform: 'capitalize' }}>
                    {company}
                  </p>
                  <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: '#52525B', margin: '2px 0 0', letterSpacing: '0.08em' }}>
                    {projects.length} projects · {active} active
                  </p>
                </div>
                <ChevronRight size={12} style={{ color: isSelected ? color : '#3F3F46', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
            )
          })}
        </div>

        {/* Projects panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.company}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{ flex: 1, minWidth: 0, background: '#111', border: '1px solid #222', borderRadius: 8, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}
            >
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={14} style={{ color: companyColor(selected.company) }} />
                  <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 15, fontWeight: 600, color: '#F4F4F5', margin: 0, textTransform: 'capitalize' }}>
                    {selected.company}
                  </h2>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#52525B', cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              </div>

              {/* Project grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {selected.projects.map(p => (
                  <div
                    key={p.id}
                    style={{ padding: 14, borderRadius: 7, border: '1px solid #222', background: '#0D0D0D' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FolderOpen size={11} style={{ color: STATUS_COLOR[p.status ?? 'paused'] ?? '#52525B', flexShrink: 0 }} />
                        <p style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 12, fontWeight: 600, color: '#E4E4E7', margin: 0 }}>
                          {p.name}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 7, letterSpacing: '0.1em', fontFamily: 'var(--font-jetbrains-mono)',
                        color: STATUS_COLOR[p.status ?? 'paused'] ?? '#52525B',
                        border: `1px solid ${STATUS_COLOR[p.status ?? 'paused'] ?? '#52525B'}44`,
                        borderRadius: 3, padding: '1px 5px', flexShrink: 0,
                      }}>
                        {(p.status ?? 'paused').toUpperCase()}
                      </span>
                    </div>

                    {p.description && (
                      <p style={{ fontSize: 10, color: '#71717A', margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>
                    )}

                    {p.stack && p.stack.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.stack.slice(0, 4).map((s: string) => (
                          <span key={s} style={{ fontSize: 8, fontFamily: 'var(--font-jetbrains-mono)', color: '#52525B', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 3, padding: '1px 5px' }}>
                            {s}
                          </span>
                        ))}
                        {p.stack.length > 4 && (
                          <span style={{ fontSize: 8, fontFamily: 'var(--font-jetbrains-mono)', color: '#3F3F46' }}>+{p.stack.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!selected && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#3F3F46', letterSpacing: '0.1em' }}>
              &gt; SELECT A COMPANY_
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
