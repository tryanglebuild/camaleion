'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SectionProps } from './types'
import { SECTION_INDEX } from './types'
import type { Project } from '@context-engine/shared'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { contentItemVariants, listContainerVariants, rowItemVariants } from './sectionVariants'

interface ProjectWithCount extends Project { entryCount: number }
interface CompanyGroup { company: string; projects: ProjectWithCount[] }

const STATUS_COLOR: Record<string, string> = { active: '#22C55E', paused: '#EAB308', done: '#3B82F6' }
const COMPANY_COLOR: Record<string, string> = {
  dengun: '#3B82F6', tryangle: '#8B5CF6', personal: '#22C55E',
}
function companyColor(name: string) { return COMPANY_COLOR[name.toLowerCase()] ?? '#71717A' }

export function SectionCompanies({ direction, onNavigateTo }: SectionProps) {
  const [companies, setCompanies] = useState<CompanyGroup[]>([])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('projects')
        .select('*')
        .not('company', 'is', null)
        .order('company')
        .order('name')
      const projects = (data ?? []) as Project[]

      // Fetch entry counts per project in parallel
      const withCounts = await Promise.all(
        projects.map(async (p) => {
          const { count } = await supabase
            .from('entries')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', p.id)
          return { ...p, entryCount: count ?? 0 } as ProjectWithCount
        })
      )

      const map = new Map<string, ProjectWithCount[]>()
      for (const p of withCounts) {
        const key = (p.company ?? 'Unknown').toLowerCase()
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(p)
      }
      setCompanies(Array.from(map.entries()).map(([company, projs]) => ({ company, projects: projs })))
      setLoading(false)
    }
    load()
  }, [])

  const totalProjects = companies.reduce((s, c) => s + c.projects.length, 0)

  function toggleCollapse(company: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(company)) next.delete(company)
      else next.add(company)
      return next
    })
  }

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Companies"
        subtitle={loading ? 'Loading…' : `${companies.length} companies · ${totalProjects} projects`}
      />

      <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 48 }}>
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="skeleton" style={{ height: 36, borderRadius: 6 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>No companies yet</p>
            <p className="empty-state-hint">Projects grouped by company will appear here</p>
          </div>
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {companies.map(({ company, projects }) => {
              const color = companyColor(company)
              const isCollapsed = collapsed.has(company)
              const initial = company.charAt(0).toUpperCase()

              return (
                <motion.div key={company} variants={rowItemVariants}>
                  {/* Company header row */}
                  <button
                    onClick={() => toggleCollapse(company)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                      marginBottom: 6,
                    }}
                  >
                    {/* Initial circle */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'var(--surface-3)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-space-grotesk)', fontSize: 16, fontWeight: 700,
                        color: color, lineHeight: 1,
                      }}>
                        {initial}
                      </span>
                    </div>

                    {/* Company name + count */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                      <span style={{
                        fontFamily: 'var(--font-space-grotesk)', fontSize: 15, fontWeight: 600,
                        color: 'var(--text-primary)', textTransform: 'capitalize', letterSpacing: '-0.01em',
                      }}>
                        {company}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'var(--surface-3)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '2px 8px',
                        }}>
                          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                        </span>
                        <ChevronDown
                          size={13}
                          style={{
                            color: 'var(--text-muted)',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.18s',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 4, marginLeft: 52 }} />

                  {/* Project rows */}
                  {!isCollapsed && (
                    <motion.div
                      variants={listContainerVariants}
                      initial="initial"
                      animate="animate"
                      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {projects.map((p) => {
                        const statusColor = STATUS_COLOR[p.status ?? 'paused'] ?? '#71717A'
                        return (
                          <motion.div
                            key={p.id}
                            variants={contentItemVariants}
                            onClick={() => onNavigateTo?.(SECTION_INDEX.PROJECTS)}
                            style={{
                              paddingLeft: 52, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                              display: 'flex', alignItems: 'center', gap: 10,
                              borderRadius: 6, cursor: 'pointer',
                              transition: 'background 0.12s',
                            }}
                            whileHover={{ backgroundColor: 'var(--surface-2)' }}
                          >
                            {/* Status dot */}
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: statusColor, flexShrink: 0,
                              boxShadow: `0 0 6px ${statusColor}60`,
                            }} />

                            {/* Project name */}
                            <span style={{
                              fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500,
                              color: 'var(--text-primary)', flex: 1, minWidth: 0,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {p.name}
                            </span>

                            {/* Status badge */}
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                              color: statusColor,
                              background: `${statusColor}14`,
                              border: `1px solid ${statusColor}30`,
                              borderRadius: 3, padding: '2px 6px',
                              letterSpacing: '0.04em', textTransform: 'uppercase',
                              flexShrink: 0,
                            }}>
                              {p.status ?? 'paused'}
                            </span>

                            {/* Entry count in mono */}
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                              color: 'var(--text-muted)', flexShrink: 0, width: 56,
                              textAlign: 'right',
                            }}>
                              {p.entryCount} entries
                            </span>

                            {/* Navigate icon */}
                            <ExternalLink size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.6 }} />
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </SectionWrapper>
  )
}
