'use client'
import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'

interface Analysis {
  id: string
  title: string
  content?: string
  project?: { id: string; name: string } | null
  tags: string[]
  created_at: string
}

const PROJECT_PALETTE = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#F97316',
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function SectionAnalyze({ direction }: SectionProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Analysis | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ents }, { data: projs }] = await Promise.all([
      supabase.from('entries').select('*, project:projects(id, name)').eq('type', 'analysis').order('created_at', { ascending: false }).limit(100),
      supabase.from('projects').select('id, name').order('name'),
    ])
    setAnalyses((ents ?? []) as Analysis[])
    setProjects((projs ?? []) as { id: string; name: string }[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this analysis?')) return
    setDeleting(id)
    await supabase.from('embeddings').delete().eq('entry_id', id)
    await supabase.from('entries').delete().eq('id', id)
    setAnalyses(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    setDeleting(null)
  }, [selected])

  const filtered = analyses.filter(a => !filterProject || a.project?.id === filterProject)

  // Stable color per project by position in list
  const projectColorMap: Record<string, string> = Object.fromEntries(
    projects.map((p, i) => [p.id, PROJECT_PALETTE[i % PROJECT_PALETTE.length]])
  )

  const selectedProjColor = selected?.project
    ? (projectColorMap[selected.project.id] ?? '#71717A')
    : null

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Analyses" subtitle={loading ? 'Loading…' : `${filtered.length} saved analyses`} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '16px 28px', overflow: 'hidden' }}>

        {/* Filter pills */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterProject('')}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font-inter)', transition: 'all 0.15s',
                border: `1px solid ${!filterProject ? 'var(--accent)' : 'var(--border)'}`,
                background: !filterProject ? 'var(--accent-glow)' : 'transparent',
                color: !filterProject ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: !filterProject ? 500 : 400,
              }}
            >
              All
            </button>
            {projects.map((p, i) => {
              const color = PROJECT_PALETTE[i % PROJECT_PALETTE.length]
              const isActive = filterProject === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setFilterProject(v => v === p.id ? '' : p.id)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--font-inter)', transition: 'all 0.15s',
                    border: `1px solid ${isActive ? color : 'var(--border)'}`,
                    background: isActive ? `${color}18` : 'transparent',
                    color: isActive ? color : 'var(--text-muted)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 76, borderRadius: 8, opacity: 1 - i * 0.14 }} />
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ height: 3, borderRadius: 2 }} />
              <div className="skeleton" style={{ height: 26, borderRadius: 6, width: '55%' }} />
              <div className="skeleton" style={{ height: 20, borderRadius: 4, width: '30%' }} />
              <div className="skeleton" style={{ flex: 1, borderRadius: 8 }} />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-state-icon">🔍</div>
            <p>No analyses saved yet</p>
            <p className="empty-state-hint">Ask Claude to analyse a project</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

            {/* Sidebar list */}
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', paddingRight: 4 }}
            >
              {filtered.map(a => {
                const projColor = a.project ? (projectColorMap[a.project.id] ?? '#71717A') : null
                const isSelected = selected?.id === a.id
                const isHovered = hoveredId === a.id
                return (
                  <motion.button
                    key={a.id}
                    variants={rowVariants}
                    onClick={() => setSelected(a)}
                    onMouseEnter={() => setHoveredId(a.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '10px 12px 10px',
                      paddingLeft: isSelected ? 10 : 12,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected || isHovered ? 'var(--surface-2)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {/* Project badge row */}
                    <div style={{ marginBottom: 6, minHeight: 18 }}>
                      {projColor && a.project ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '1px 6px', borderRadius: 3,
                          fontSize: 10, fontFamily: 'var(--font-inter)', fontWeight: 500,
                          background: `${projColor}18`,
                          color: projColor,
                          border: `1px solid ${projColor}30`,
                        }}>
                          {a.project.name}
                        </span>
                      ) : null}
                    </div>
                    {/* Title + date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                      <p style={{
                        fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500,
                        color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {a.title}
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                        color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1.4,
                      }}>
                        {fmtDate(a.created_at)}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>

            {/* Detail panel */}
            <div style={{
              flex: 1, minWidth: 0,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {selected ? (
                <>
                  {/* Top accent bar */}
                  <div style={{ height: 3, background: 'var(--accent)', borderRadius: '8px 8px 0 0', flexShrink: 0 }} />

                  {/* Fixed header */}
                  <div style={{ padding: '16px 20px 14px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h2 style={{
                        fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600,
                        color: 'var(--text-primary)', margin: 0, flex: 1, paddingRight: 12, lineHeight: 1.3,
                      }}>
                        {selected.title}
                      </h2>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <button
                          onClick={() => handleDelete(selected.id)}
                          disabled={deleting === selected.id}
                          title="Delete analysis"
                          style={{
                            background: 'none', border: '1px solid var(--border)', borderRadius: 5,
                            color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px',
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontFamily: 'var(--font-inter)', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                        <button
                          onClick={() => setSelected(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Meta row: project badge + date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {selected.project && selectedProjColor && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 10px', borderRadius: 4,
                          fontSize: 12, fontFamily: 'var(--font-inter)', fontWeight: 500,
                          background: `${selectedProjColor}18`,
                          color: selectedProjColor,
                          border: `1px solid ${selectedProjColor}35`,
                        }}>
                          {selected.project.name}
                        </span>
                      )}
                      <span style={{
                        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                        color: 'var(--text-muted)',
                      }}>
                        {fmtDateTime(selected.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Scrollable markdown content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.85 }} className="md-prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selected.content ?? 'No content.'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p>Select an analysis to read</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </SectionWrapper>
  )
}
