'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SectionProps } from './types'
import type { Entry, EntryType, EntryStatus } from '@context-engine/shared'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { SECTION_INDEX } from './types'
import { getClientConfig } from '@/lib/supabase'

interface SearchEntry extends Entry { similarity?: number }

const TYPE_META: Record<string, { color: string; label: string }> = {
  task:     { color: '#3B82F6', label: 'TASK' },
  note:     { color: '#8B5CF6', label: 'NOTE' },
  decision: { color: '#F59E0B', label: 'DECISION' },
  meet:     { color: '#10B981', label: 'MEET' },
  idea:     { color: '#EC4899', label: 'IDEA' },
  log:      { color: '#71717A', label: 'LOG' },
  analysis: { color: '#06B6D4', label: 'ANALYSIS' },
  plan:     { color: '#6366F1', label: 'PLAN' },
  post:     { color: '#F97316', label: 'POST' },
}

const ALL_TYPES = Object.keys(TYPE_META) as EntryType[]
const ALL_STATUSES: EntryStatus[] = ['pending', 'done', 'blocked', 'in_progress']
type DateRange = '' | 'week' | 'month'

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const terms = query.trim().split(/\s+/).filter(t => t.length > 1)
  if (!terms.length) return text
  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: 'rgba(var(--accent-rgb, 99,102,241),0.15)', color: 'var(--accent)', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
      : part
  )
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

function relativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const RAG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rag-answer`
  : ''

interface TerminalInputProps {
  compact: boolean
  draft: string
  setDraft: (v: string) => void
  setResults: (v: SearchEntry[]) => void
  setSearched: (v: boolean) => void
  run: (q?: string, type?: EntryType | '') => void
  showHistory: boolean
  setShowHistory: (v: boolean) => void
  history: string[]
  inputRef: React.RefObject<HTMLInputElement | null>
}

function TerminalInput({ compact, draft, setDraft, setResults, setSearched, run, showHistory, setShowHistory, history, inputRef }: TerminalInputProps) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Prefix >_ */}
      <span style={{
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: compact ? 12 : 14,
        color: 'var(--search-accent, var(--accent))',
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1,
      }}>
        {'>_'}
      </span>
      <input
        ref={inputRef}
        value={draft}
        onChange={e => { setDraft(e.target.value); if (e.target.value === '') setShowHistory(true) }}
        onFocus={() => { if (!draft) setShowHistory(true) }}
        onBlur={() => setTimeout(() => setShowHistory(false), 150)}
        onKeyDown={e => e.key === 'Enter' && run()}
        placeholder="Search for anything…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: compact ? 40 : 52,
          paddingLeft: 44,
          paddingRight: 80,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 0,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: compact ? 14 : 15,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocusCapture={e => {
          const t = e.target as HTMLInputElement
          t.style.borderColor = 'var(--accent)'
          t.style.boxShadow = '0 0 0 1px var(--accent)'
        }}
        onBlurCapture={e => {
          const t = e.target as HTMLInputElement
          t.style.borderColor = 'var(--border)'
          t.style.boxShadow = 'none'
        }}
      />
      {/* Submit button */}
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
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 11,
            border: '1px solid var(--border)',
            background: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 0,
          }}
        >
          [↵]
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
              borderRadius: 0, overflow: 'hidden',
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
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{h}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HistoryItemProps {
  index: number
  query: string
  onSelect: () => void
}

function HistoryItem({ index, query, onSelect }: HistoryItemProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        padding: '6px 0', cursor: 'pointer',
        background: hovered ? 'var(--search-accent-muted)' : 'transparent',
        paddingLeft: hovered ? 8 : 0,
        transition: 'background 100ms ease, padding-left 100ms ease',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
        color: hovered ? 'var(--search-accent)' : 'var(--search-accent-dim)',
        minWidth: 24, flexShrink: 0, transition: 'color 100ms ease',
      }}>
        {String(index + 1).padStart(2, '0')}.
      </span>
      <span style={{
        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13,
        color: hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
        transition: 'color 100ms ease',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {query}
      </span>
    </div>
  )
}

const tabBase: React.CSSProperties = {
  padding: '0 12px',
  height: 40,
  display: 'flex',
  alignItems: 'center',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-jetbrains-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

export function SectionSearch({ direction, onNavigateTo }: SectionProps) {
  const [draft, setDraft]               = useState('')
  const [results, setResults]           = useState<SearchEntry[]>([])
  const [loading, setLoading]           = useState(false)
  const [searched, setSearched]         = useState(false)
  const [threshold, setThreshold]       = useState(0.0)
  const [filterType, setFilterType]     = useState<EntryType | ''>('')
  const [filterStatus, setFilterStatus] = useState<EntryStatus | ''>('')
  const [filterDate, setFilterDate]     = useState<DateRange>('')
  const [history, setHistory]           = useState<string[]>([])
  const [showHistory, setShowHistory]   = useState(false)
  const [selected, setSelected]         = useState<SearchEntry | null>(null)
  const [answer, setAnswer]             = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const inputRef       = useRef<HTMLInputElement>(null)
  const abortRef       = useRef<AbortController | null>(null)
  const lastQuery      = useRef('')
  const answerScrollRef = useRef<HTMLDivElement>(null)
  const filterRefetchRef = useRef(false)

  useEffect(() => { setHistory(getHistory()) }, [])

  useEffect(() => {
    if (answerScrollRef.current) {
      answerScrollRef.current.scrollTop = answerScrollRef.current.scrollHeight
    }
  }, [answer])

  const filtered = results.filter(r => {
    if ((r.similarity ?? 1) < threshold) return false
    if (filterStatus && r.status !== filterStatus) return false
    if (filterDate) {
      const d = new Date(r.created_at)
      const now = new Date()
      if (filterDate === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
        if (d < weekAgo) return false
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)
        if (d < monthAgo) return false
      }
    }
    return true
  })

  async function streamAnswer(q: string, data: SearchEntry[]) {
    if (!data.length) return
    setAnswer('')
    setAnswerLoading(true)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      // Use dynamic config so credentials changed in Settings are respected
      const { supabaseUrl, supabaseAnonKey } = getClientConfig()
      const ragUrl = supabaseUrl
        ? `${supabaseUrl}/functions/v1/rag-answer`
        : RAG_URL
      const authKey = supabaseAnonKey || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
      const res = await fetch(ragUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`,
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

  async function run(q?: string, type?: EntryType | '') {
    const q_ = (q ?? draft).trim()
    if (!q_) return
    const type_ = type !== undefined ? type : filterType
    lastQuery.current = q_
    setDraft(q_)
    setLoading(true)
    setShowHistory(false)

    if (!filterRefetchRef.current) {
      // New search: reset to empty state
      setSearched(false)
      setResults([])
      setSelected(null)
      setAnswer('')
    }
    filterRefetchRef.current = false // reset flag

    const params = new URLSearchParams({ q: q_, limit: '20' })
    if (type_) params.set('type', type_)
    const res = await fetch(`/api/search?${params}`)
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

  // Rerun when type filter changes (if we already have a query)
  useEffect(() => {
    if (searched && lastQuery.current) {
      filterRefetchRef.current = true
      run(lastQuery.current, filterType)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  const terminalInputProps: Omit<TerminalInputProps, 'compact'> = {
    draft, setDraft, setResults, setSearched, run, showHistory, setShowHistory, history, inputRef,
  }

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Search"
        subtitle="Semantic memory retrieval"
        rightSlot={searched ? (
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
            {filtered.length} results
          </span>
        ) : undefined}
      />

      <AnimatePresence mode="wait">
        {/* ── EMPTY STATE ──────────────────────────────────────────────────── */}
        {!searched ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
            style={{
              position: 'relative', flex: 1, display: 'flex', flexDirection: 'column',
              padding: 'var(--space-lg) var(--space-lg) var(--space-xl)',
              '--search-accent': '#C8A84B',
              '--search-accent-dim': '#8A7233',
              '--search-accent-muted': 'rgba(200, 168, 75, 0.08)',
              '--space-2xs': '4px',
              '--space-xs': '8px',
              '--space-sm': '16px',
              '--space-md': '24px',
              '--space-lg': '40px',
              '--space-xl': '64px',
              '--space-2xl': '96px',
              '--rail-width': '2px',
              '--rail-offset': '40px',
              '--history-indent': '56px',
            } as React.CSSProperties}
          >
            {/* 1. SearchStatusStrip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: 'var(--space-2xl)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--text-muted)' }}>
                  Memory System
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-2xs)' }}>
                  last indexed just now
                </div>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)',
                color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                {results.length > 0 ? `${results.length} results` : '—'}
              </div>
            </div>

            {/* 2. Left structural rail (absolute) */}
            <div style={{ position: 'absolute', left: 'var(--rail-offset)', top: 'calc(var(--space-lg) + 56px)',
              bottom: 'var(--space-xl)', width: 'var(--rail-width)',
              background: 'var(--search-accent-dim)' }} />

            {/* 3. Content hanging off the rail */}
            <div style={{ paddingLeft: 'var(--history-indent)', display: 'flex', flexDirection: 'column',
              gap: 'var(--space-md)' }}>

              {/* TerminalInput */}
              <TerminalInput compact={false} {...terminalInputProps} />

              {/* Loading indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--search-accent)', animation: 'pulse-live 1s ease-in-out infinite' }} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                    color: 'var(--text-secondary)' }}>Searching…</span>
                </div>
              )}

              {/* History */}
              {!loading && history.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                    History
                  </div>
                  {history.slice(0, 6).map((h, i) => (
                    <HistoryItem key={h} index={i} query={h} onSelect={() => { setDraft(h); run(h) }} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          /* ── RESULTS STATE ──────────────────────────────────────────────── */
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
          >
            {/* Compact top search bar */}
            <div style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1 }}>
                <TerminalInput compact {...terminalInputProps} />
              </div>

              {/* Threshold */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  min:
                </span>
                <input
                  type="range" min={0} max={0.95} step={0.05} value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  style={{ width: 80, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--accent)', minWidth: 32 }}>
                  {threshold.toFixed(2)}
                </span>
              </div>

              {/* Loading dot */}
              {loading && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-live 1s ease-in-out infinite', flexShrink: 0 }} />
              )}
            </div>

            {/* Filter strip — tab underline style */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              height: 40,
              borderBottom: '1px solid var(--border)',
              padding: '0 24px',
              overflowX: 'auto',
              flexShrink: 0,
              gap: 0,
            }}>
              {/* Type group */}
              {(['', ...ALL_TYPES] as (EntryType | '')[]).map(t => {
                const tm = t ? TYPE_META[t] : null
                const active = filterType === t
                return (
                  <button
                    key={t || 'all'}
                    onClick={() => setFilterType(t)}
                    style={{
                      ...tabBase,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                      marginBottom: active ? -1 : 0,
                    }}
                  >
                    {t === '' ? 'ALL' : tm?.label ?? t.toUpperCase()}
                  </button>
                )
              })}

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px', flexShrink: 0 }} />

              {/* Status group */}
              {(['', ...ALL_STATUSES] as (EntryStatus | '')[]).map(s => {
                const active = filterStatus === s
                return (
                  <button
                    key={s || 'any'}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      ...tabBase,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                      marginBottom: active ? -1 : 0,
                    }}
                  >
                    {s === '' ? 'ANY' : s.replace('_', ' ').toUpperCase()}
                  </button>
                )
              })}

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px', flexShrink: 0 }} />

              {/* Date group */}
              {([['', 'ALL TIME'], ['week', 'THIS WEEK'], ['month', 'LAST 30D']] as [DateRange, string][]).map(([v, label]) => {
                const active = filterDate === v
                return (
                  <button
                    key={v || 'alltime'}
                    onClick={() => setFilterDate(v)}
                    style={{
                      ...tabBase,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                      marginBottom: active ? -1 : 0,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* 3-column body */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

              {/* LEFT — AI Synthesis panel */}
              {(answer || answerLoading) && (
                <div style={{
                  width: 280,
                  flexShrink: 0,
                  borderRight: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  {/* Sticky header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: answerLoading ? 'pulse-live 1.8s ease-in-out infinite' : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      flex: 1,
                    }}>
                      AI SYNTHESIS
                    </span>
                  </div>
                  {/* Scrollable body */}
                  <div
                    ref={answerScrollRef}
                    style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 16 }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--text-secondary)',
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {answer}
                      </ReactMarkdown>
                      {answerLoading && <span style={{ opacity: 0.5 }}>▌</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* MIDDLE — Results list */}
              <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                {/* Sticky list header */}
                <div style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--surface-1)',
                  zIndex: 1,
                }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {filtered.length} RESULTS
                  </span>
                </div>

                {/* Empty state */}
                {searched && filtered.length === 0 && !loading && (
                  <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--text-muted)' }}>No results found</span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)' }}>Try lowering the threshold or rephrasing your query</span>
                  </div>
                )}

                {/* Result rows */}
                {filtered.map((r, i) => {
                  const tm = TYPE_META[r.type] ?? { color: '#71717A', label: r.type.toUpperCase() }
                  const sim = r.similarity ?? 0
                  const sl = scoreLabel(sim)
                  const isSelected = selected?.id === r.id
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i < 5 ? i * 0.03 : 0.15 }}
                      onClick={() => setSelected(isSelected ? null : r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface-2)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                        paddingLeft: isSelected ? 14 : 16,
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)' }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      {/* Type badge */}
                      <div style={{ width: 64, flexShrink: 0 }}>
                        <span style={{
                          background: `${tm.color}1F`,
                          color: tm.color,
                          borderRadius: 2,
                          padding: '2px 6px',
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                        }}>
                          {tm.label}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div style={{ width: 36, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: sl.color, lineHeight: 1 }}>
                          {sim.toFixed(2)}
                        </span>
                        <div style={{ width: 24, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                          <div style={{ height: 2, width: `${(sim * 100).toFixed(0)}%`, background: sl.color }} />
                        </div>
                      </div>

                      {/* Title + project */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {highlight(r.title, lastQuery.current)}
                        </div>
                        {r.project?.name && (
                          <span style={{
                            display: 'block',
                            fontFamily: 'var(--font-jetbrains-mono)',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                          }}>
                            {r.project.name}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div style={{ width: 56, flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {relativeDate(r.created_at)}
                        </span>
                      </div>

                      {/* External link */}
                      <div style={{ width: 20, flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); onNavigateTo?.(SECTION_INDEX.ENTRIES, r.id) }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 2,
                            opacity: 0.4,
                            transition: 'opacity 0.15s, color 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* RIGHT — Detail panel */}
              <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                  {!selected ? (
                    <motion.div
                      key="empty-detail"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
                    >
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        ← select an entry
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                    >
                      {/* Topbar */}
                      {(() => {
                        const tm = TYPE_META[selected.type] ?? { color: '#71717A', label: selected.type.toUpperCase() }
                        return (
                          <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            justifyContent: 'space-between',
                            flexShrink: 0,
                          }}>
                            <span style={{
                              background: `${tm.color}1F`,
                              color: tm.color,
                              borderRadius: 2,
                              padding: '2px 6px',
                              fontFamily: 'var(--font-jetbrains-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                            }}>
                              {tm.label}
                            </span>
                            {selected.similarity !== undefined && (
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--accent)', flex: 1, paddingLeft: 4 }}>
                                {(selected.similarity * 100).toFixed(1)}% match
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, selected.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  background: 'none',
                                  border: '1px solid var(--border)',
                                  borderRadius: 0,
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--font-jetbrains-mono)',
                                  fontSize: 11,
                                  transition: 'color 0.15s, border-color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                              >
                                <ExternalLink size={10} /> Open
                              </button>
                              <button
                                onClick={() => setSelected(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Scrollable body */}
                      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 16px' }}>
                        {/* Title */}
                        <h2 style={{
                          fontFamily: 'var(--font-space-grotesk)',
                          fontSize: 20,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.25,
                          marginBottom: 16,
                          margin: '0 0 16px',
                        }}>
                          {selected.title}
                        </h2>

                        {/* Metadata strip */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 16,
                          paddingBottom: 16,
                          borderBottom: '1px solid var(--border)',
                          marginBottom: 20,
                          flexWrap: 'wrap',
                        }}>
                          {selected.project?.name && (
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {selected.project.name}
                            </span>
                          )}
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {new Date(selected.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {selected.status && (
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {selected.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        {selected.content && (
                          <p style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: 'var(--text-secondary)',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {selected.content}
                          </p>
                        )}

                        {/* Tags */}
                        {selected.tags && selected.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20 }}>
                            {selected.tags.map(t => (
                              <span key={t} style={{
                                fontFamily: 'var(--font-jetbrains-mono)',
                                fontSize: 10,
                                padding: '3px 8px',
                                border: '1px solid var(--border)',
                                borderRadius: 2,
                                color: 'var(--text-muted)',
                              }}>
                                {t}
                              </span>
                            ))}
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
