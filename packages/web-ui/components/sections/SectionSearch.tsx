'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon, Clock, X, Zap, ExternalLink } from 'lucide-react'
import type { SectionProps } from './types'
import type { Entry } from '@context-engine/shared'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { SECTION_INDEX } from './types'

interface SearchEntry extends Entry { similarity?: number }

const TYPE_META: Record<string, { color: string; label: string }> = {
  task:     { color: '#3B82F6', label: 'TASK' },
  note:     { color: '#8B5CF6', label: 'NOTE' },
  decision: { color: '#F59E0B', label: 'DECISION' },
  meet:     { color: '#10B981', label: 'MEET' },
  idea:     { color: '#EC4899', label: 'IDEA' },
  log:      { color: '#71717A', label: 'LOG' },
}

const HISTORY_KEY = 'ce_query_history'
function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}
function saveToHistory(q: string) {
  const h = [q, ...getHistory().filter(x => x !== q)].slice(0, 10)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
}

function scoreLabel(s: number) {
  if (s >= 0.85) return { text: 'HIGH', color: '#22C55E' }
  if (s >= 0.65) return { text: 'MED',  color: '#EAB308' }
  return               { text: 'LOW',  color: '#71717A' }
}

const RAG_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rag-answer`

export function SectionSearch({ direction, onNavigateTo }: SectionProps) {
  const [draft, setDraft]             = useState('')
  const [results, setResults]         = useState<SearchEntry[]>([])
  const [loading, setLoading]         = useState(false)
  const [searched, setSearched]       = useState(false)
  const [threshold, setThreshold]     = useState(0.0)
  const [history, setHistory]         = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [selected, setSelected]       = useState<SearchEntry | null>(null)
  const [answer, setAnswer]           = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  useEffect(() => { setHistory(getHistory()) }, [])

  const filtered = results.filter(r => (r.similarity ?? 1) >= threshold)

  async function streamAnswer(q: string, data: SearchEntry[]) {
    if (!data.length) return
    setAnswer('')
    setAnswerLoading(true)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch(RAG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({ query: q, results: data.slice(0, 8) }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) { setAnswerLoading(false); return }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') { setAnswerLoading(false); return }
          try {
            const { token } = JSON.parse(raw) as { token: string }
            if (token) setAnswer(prev => prev + token)
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('RAG stream error', e)
    }
    setAnswerLoading(false)
  }

  async function run(q?: string) {
    const q_ = (q ?? draft).trim()
    if (!q_) return
    setDraft(q_)
    setLoading(true)
    setSearched(false)
    setResults([])
    setSelected(null)
    setAnswer('')
    setShowHistory(false)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q_)}&limit=20`)
    if (res.ok) {
      const data = await res.json() as SearchEntry[]
      setResults(data)
      saveToHistory(q_)
      setHistory(getHistory())
      streamAnswer(q_, data)
    }
    setLoading(false)
    setSearched(true)
  }

  // ── Shared input (rendered in both states, just moves) ──────────────
  function SearchInput({ compact }: { compact: boolean }) {
    return (
      <div style={{ position: 'relative', width: compact ? '100%' : 400 }}>
        <SearchIcon size={compact ? 13 : 15} style={{
          position: 'absolute', left: compact ? 12 : 16, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          ref={inputRef}
          value={draft}
          onChange={e => { setDraft(e.target.value); if (e.target.value === '') setShowHistory(true) }}
          onFocus={() => { if (!draft) setShowHistory(true) }}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder={compact ? 'Search for anything…' : 'Search for anything…'}
          style={{
            width: '100%', boxSizing: 'border-box',
            height: compact ? 36 : 44,
            paddingLeft: compact ? 32 : 44,
            paddingRight: draft ? (compact ? 68 : 80) : 16,
            background: compact ? 'var(--surface-2)' : 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: compact ? 8 : 12,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-inter)', fontSize: compact ? 13 : 14,
            outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocusCapture={e => {
            const t = e.target as HTMLInputElement
            t.style.borderColor = 'var(--accent)'
            t.style.boxShadow = '0 0 0 3px var(--accent-glow)'
          }}
          onBlurCapture={e => {
            const t = e.target as HTMLInputElement
            t.style.borderColor = 'var(--border)'
            t.style.boxShadow = 'none'
          }}
        />
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {draft && (
            <button
              onClick={() => { setDraft(''); setResults([]); setSearched(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={11} />
            </button>
          )}
          <button
            onClick={() => run()}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: compact ? 'var(--surface-3)' : 'var(--accent)',
              border: compact ? '1px solid var(--border)' : 'none',
              borderRadius: compact ? 5 : 8,
              padding: compact ? '2px 8px' : '5px 11px',
              cursor: 'pointer',
              color: compact ? 'var(--text-secondary)' : 'white',
            }}
          >
            <Zap size={compact ? 9 : 10} />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: compact ? 10 : 11, fontWeight: 500 }}>
              Run
            </span>
          </button>
        </div>

        {/* History dropdown */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                borderRadius: 10, overflow: 'hidden',
              }}
            >
              {history.slice(0, 6).map((h, i) => (
                <div
                  key={i}
                  onMouseDown={() => { setDraft(h); run(h) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', cursor: 'pointer', transition: 'background 0.1s',
                    borderBottom: i < Math.min(history.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <Clock size={9} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>{h}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Search"
        subtitle="Semantic memory retrieval"
        rightSlot={searched ? (
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)' }}>
            {filtered.length} results
          </span>
        ) : undefined}
      />

      <AnimatePresence mode="wait">
        {/* ── EMPTY STATE: centered search experience ─────────────────────── */}
        {!searched ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <SearchIcon size={22} style={{ color: 'var(--text-muted)' }} />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-space-grotesk)', fontSize: 22, fontWeight: 600,
              color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em',
            }}>
              Search memory
            </h2>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 28px' }}>
              Semantic search across all your entries
            </p>

            <SearchInput compact={false} />

            {/* Loading */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-live 1s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>Searching…</span>
              </div>
            )}

            {/* Recent history pills */}
            {!loading && history.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>Recent:</span>
                {history.slice(0, 5).map((h, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { setDraft(h); run(h) }}
                    style={{
                      fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

        ) : (
          /* ── RESULTS STATE ──────────────────────────────────────────────── */
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
          >
            {/* Compact bar: search + threshold inline */}
            <div style={{
              padding: '10px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              background: 'var(--surface-1)',
            }}>
              <div style={{ flex: 1 }}>
                <SearchInput compact />
              </div>

              {/* Threshold */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>
                  threshold:
                </span>
                <input
                  type="range" min={0} max={0.95} step={0.05} value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  style={{ width: 80, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 28 }}>
                  {threshold.toFixed(2)}
                </span>
              </div>

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-live 1s ease-in-out infinite' }} />
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)' }}>Searching…</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

              {/* AI Answer block */}
              <AnimatePresence>
                {(answer || answerLoading) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0, borderBottom: '1px solid var(--border)' }}
                  >
                    <div style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Left accent bar */}
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--accent)', flexShrink: 0, minHeight: 36 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                          <div style={{
                            width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)',
                            animation: answerLoading ? 'pulse-live 1s ease-in-out infinite' : 'none',
                          }} />
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.04em' }}>
                            AI synthesis{answerLoading ? '…' : ''}
                          </span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {answer}
                          {answerLoading && <span style={{ opacity: 0.5, animation: 'cursor-blink 1s step-end infinite' }}>▌</span>}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results table + detail panel */}
              <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

                {/* Results list */}
                <div
                  data-inner-scroll
                  style={{
                    flex: selected ? '0 0 400px' : '1 1 0',
                    overflowY: 'auto',
                    borderRight: selected ? '1px solid var(--border)' : 'none',
                    transition: 'flex 0.2s ease',
                  }}
                >
                  {searched && filtered.length === 0 && !loading && (
                    <div className="empty-state" style={{ padding: '60px 32px' }}>
                      <div className="empty-state-icon">🤷</div>
                      <p>No results found</p>
                      <p className="empty-state-hint">Try lowering the threshold or rephrasing your query</p>
                    </div>
                  )}

                  {filtered.length > 0 && (
                    <motion.div variants={listVariants} initial="hidden" animate="visible">
                      {filtered.map(r => {
                        const tm = TYPE_META[r.type] ?? { color: '#71717A', label: r.type.toUpperCase() }
                        const sim = r.similarity ?? 0
                        const score = scoreLabel(sim)
                        const isSelected = selected?.id === r.id
                        return (
                          <motion.div
                            key={r.id}
                            variants={rowVariants}
                            onClick={() => setSelected(isSelected ? null : r)}
                            className="search-row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '72px 58px 1fr 30px',
                              alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              background: isSelected ? 'var(--surface-2)' : 'transparent',
                              borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                              transition: 'background 0.12s',
                            }}
                            whileHover={{ backgroundColor: 'var(--surface-2)' }}
                          >
                            {/* Type badge */}
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fontWeight: 700,
                              color: tm.color, background: `${tm.color}18`,
                              border: `1px solid ${tm.color}35`,
                              borderRadius: 3, padding: '2px 5px',
                              letterSpacing: '0.05em', justifySelf: 'start',
                            }}>
                              {tm.label}
                            </span>

                            {/* Score dot + value */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: score.color, flexShrink: 0 }} />
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: score.color }}>
                                {sim.toFixed(2)}
                              </span>
                            </div>

                            {/* Title */}
                            <span style={{
                              fontFamily: 'var(--font-inter)', fontSize: 13,
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              paddingLeft: 10,
                            }}>
                              {r.title}
                            </span>

                            {/* ExternalLink — visible on selected or row hover */}
                            <button
                              onClick={e => { e.stopPropagation(); onNavigateTo?.(SECTION_INDEX.ENTRIES, r.id) }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 4, borderRadius: 4,
                                opacity: isSelected ? 1 : 0,
                                transition: 'opacity 0.15s, color 0.15s', justifySelf: 'end',
                              }}
                              className="row-link-btn"
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <ExternalLink size={11} />
                            </button>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--surface-2)', padding: '22px 24px' }}
                    >
                      {/* Actions row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <button
                          onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, selected.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                            color: 'var(--text-muted)', fontFamily: 'var(--font-inter)', fontSize: 11,
                            transition: 'color 0.15s, border-color 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <ExternalLink size={10} /> Open in Memory
                        </button>
                        <button
                          onClick={() => setSelected(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Type + score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        {(() => {
                          const tm = TYPE_META[selected.type] ?? { color: '#71717A', label: selected.type }
                          return (
                            <span style={{
                              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, fontWeight: 700,
                              color: tm.color, background: `${tm.color}18`,
                              border: `1px solid ${tm.color}35`,
                              borderRadius: 3, padding: '3px 7px', letterSpacing: '0.05em',
                            }}>
                              {tm.label}
                            </span>
                          )
                        })()}
                        {selected.similarity !== undefined && (
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                            {(selected.similarity * 100).toFixed(1)}% match
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 style={{
                        fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600,
                        color: 'var(--text-primary)', margin: '0 0 16px', lineHeight: 1.4, letterSpacing: '-0.01em',
                      }}>
                        {selected.title}
                      </h2>

                      {/* Content */}
                      {selected.content && (
                        <div style={{
                          fontFamily: 'var(--font-inter)', fontSize: 13,
                          color: 'var(--text-secondary)', lineHeight: 1.75,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          borderLeft: '3px solid var(--accent)',
                          background: 'var(--surface-3)',
                          borderRadius: '0 6px 6px 0',
                          padding: '12px 16px',
                        }}>
                          {selected.content}
                        </div>
                      )}

                      {/* Metadata */}
                      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {([
                          ['STATUS', selected.status],
                          ['DATE',   new Date(selected.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })],
                        ] as [string, string | null | undefined][]).map(([k, v]) => v && (
                          <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 52, letterSpacing: '0.06em' }}>{k}</span>
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>
                          </div>
                        ))}
                        {selected.tags && selected.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 52, letterSpacing: '0.06em', paddingTop: 3 }}>TAGS</span>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {selected.tags.map(t => (
                                <span key={t} style={{
                                  fontFamily: 'var(--font-inter)', fontSize: 11,
                                  padding: '2px 8px', borderRadius: 20,
                                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                                  color: 'var(--text-muted)',
                                }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionWrapper>
  )
}
