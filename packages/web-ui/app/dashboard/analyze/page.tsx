'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X, BarChart2, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Analysis {
  id: string
  title: string
  content: string
  project?: { id: string; name: string } | null
  tags: string[]
  created_at: string
}

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-[var(--surface-2)]" />
      ))}
    </div>
  )
}

interface AnalysisDetailProps {
  analysis: Analysis
  onClose: () => void
}

function AnalysisDetail({ analysis, onClose }: AnalysisDetailProps) {
  return (
    <div className="card p-5 h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {analysis.title}
        </h2>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] shrink-0">
          <X size={14} />
        </button>
      </div>
      {analysis.project && (
        <span className="inline-flex px-2 py-0.5 rounded text-[9px] tracking-[0.06em] border border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent-glow)] w-fit" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {analysis.project.name.toUpperCase()}
        </span>
      )}
      {analysis.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] border border-[var(--border)] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed flex-1">
        {analysis.content}
      </p>
      <p className="text-[9px] text-[var(--text-muted)] mt-auto" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
        {new Date(analysis.created_at).toLocaleString()}
      </p>
    </div>
  )
}

export default function AnalyzePage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Analysis | null>(null)
  const [filterProject, setFilterProject] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ents }, { data: projs }] = await Promise.all([
      supabase
        .from('entries')
        .select('*, project:projects(id, name)')
        .eq('type', 'analysis')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('projects').select('id, name').order('name'),
    ])
    setAnalyses((ents ?? []) as Analysis[])
    setProjects((projs ?? []) as { id: string; name: string }[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = analyses.filter(a => {
    if (filterProject && a.project?.id !== filterProject) return false
    return true
  })

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      {/* Header */}
      <motion.div variants={fadeVariants} className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          AI Analyses
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {loading ? 'LOADING…' : `${filtered.length} ANALYSES // SAVED BY CLAUDE VIA save_analysis`}
        </p>
      </motion.div>

      {/* Info */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex items-center gap-3 border-[var(--accent)]/30">
        <BarChart2 size={14} className="text-[var(--accent)] shrink-0" />
        <p className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          Analyses are created by Claude using the <span className="text-[var(--accent)]">save_analysis</span> MCP tool. Ask Claude to analyse a project, code, or topic and it will persist the result here.
        </p>
      </motion.div>

      {/* Filter */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex items-center gap-2">
        <SlidersHorizontal size={12} className="text-[var(--text-muted)] shrink-0" />
        <select
          className="ctrl-input !w-44"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {filterProject && (
          <button
            onClick={() => setFilterProject('')}
            className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
            <p className="module-label mb-2">&gt; NO ANALYSES FOUND_</p>
            <p className="text-xs text-[var(--text-muted)]">Ask Claude: &quot;Analyse [project] and save the result&quot;</p>
          </div>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-18rem)]">
            {/* List */}
            <div className="w-72 xl:w-80 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map((a, i) => (
                  <motion.button
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(a)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selected?.id === a.id
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)] glow-border'
                        : 'card hover:border-[rgba(59,130,246,0.4)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {a.project && (
                        <span className="text-[8px] tracking-[0.1em] text-[var(--accent)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                          {a.project.name.toUpperCase()}
                        </span>
                      )}
                      <span className="text-[8px] text-[var(--text-muted)] ml-auto" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      {a.title}
                    </p>
                    {a.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {a.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[7px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Detail */}
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
                    <AnalysisDetail analysis={selected} onClose={() => setSelected(null)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-full card flex items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="module-label mb-2">&gt; SELECT AN ANALYSIS_</p>
                      <p className="text-xs text-[var(--text-muted)]">Click any item on the left</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
