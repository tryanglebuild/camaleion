'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { X, Plus, ChevronLeft, ChevronRight, Grid3X3, Columns2, AlignLeft, Pencil, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sectionVariants } from './sectionVariants'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import { EntryCard } from '@/components/dashboard/EntryCard'
import { AddEntryModal } from '@/components/dashboard/AddEntryModal'
import { EditEntryModal } from '@/components/dashboard/EditEntryModal'
import type { Entry, EntryType, EntryStatus } from '@context-engine/shared'

const TYPES: EntryType[] = ['task', 'note', 'decision', 'meet', 'idea', 'log']
const STATUSES: EntryStatus[] = ['pending', 'in_progress', 'done', 'blocked']
const PAGE_SIZE = 18

// Per-type color palette
const TYPE_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  task:     { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)',  label: 'TASK' },
  note:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.3)',  label: 'NOTE' },
  decision: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  label: 'DECISION' },
  meet:     { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  label: 'MEET' },
  idea:     { color: '#EC4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.3)',  label: 'IDEA' },
  log:      { color: '#71717A', bg: 'rgba(113,113,122,0.08)', border: 'rgba(113,113,122,0.3)', label: 'LOG' },
}

const STATUS_META: Record<string, { color: string }> = {
  pending:     { color: '#EAB308' },
  in_progress: { color: '#3B82F6' },
  done:        { color: '#22C55E' },
  blocked:     { color: '#EF4444' },
}

type ViewMode = 'grid' | 'split' | 'timeline'

// ── DetailPanel ─────────────────────────────────────────────────────
function DetailPanel({ entry, onClose, onSaved }: { entry: Entry; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle]           = useState(entry.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent]       = useState(entry.content ?? '')
  const [editingContent, setEditingContent] = useState(false)
  const [status, setStatus]         = useState<EntryStatus>(entry.status ?? 'pending')
  const [saving, setSaving]         = useState(false)
  const tm = TYPE_META[entry.type] ?? TYPE_META.log

  const save = async (updates: Partial<Entry>) => {
    setSaving(true)
    await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        flex: 1, minWidth: 0, background: 'var(--surface-1)', overflowY: 'auto',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}
    >
      {/* Color accent top - removed */}
      <div style={{ padding: '16px 20px 24px', flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, padding: '2px 8px', borderRadius: 3,
            border: '1px solid var(--border)', color: 'var(--text-secondary)', flexShrink: 0 }}>
            {entry.type}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {saving && <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>saving…</span>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => { setEditingTitle(false); save({ title }) }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditingTitle(false); save({ title }) } }}
            style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none',
              borderBottom: `1px solid ${tm.color}`,
              fontFamily: 'var(--font-inter)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
              outline: 'none', paddingBottom: 4, marginBottom: 16 }}
          />
        ) : (
          <h3 onClick={() => setEditingTitle(true)}
            title="Click to edit"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 15,
              fontWeight: 600, color: 'var(--text-primary)', cursor: 'text', marginBottom: 16,
              borderBottom: '1px solid transparent', paddingBottom: 4, lineHeight: 1.4,
              transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'var(--border)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'}
          >
            {title}
          </h3>
        )}

        {/* Content — MD view / edit */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p className="section-label">Content</p>
            <button
              onClick={() => {
                if (editingContent) save({ content })
                setEditingContent(v => !v)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: `1px solid ${editingContent ? tm.color : 'var(--border)'}`,
                borderRadius: 3, padding: '2px 7px', cursor: 'pointer',
                color: editingContent ? tm.color : 'var(--text-muted)', transition: 'all 0.15s',
                fontFamily: 'var(--font-inter)', fontSize: 11 }}>
              {editingContent
                ? <><Eye size={9} /><span>Preview</span></>
                : <><Pencil size={9} /><span>Edit</span></>}
            </button>
          </div>

          {editingContent ? (
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Markdown supported…"
              style={{
                width: '100%', boxSizing: 'border-box',
                minHeight: 200, resize: 'vertical',
                background: 'var(--surface-2)',
                border: `1px solid ${tm.color}60`,
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-inter)', fontSize: 13,
                lineHeight: 1.6, padding: '10px 12px',
                outline: 'none',
              }}
            />
          ) : content ? (
            <div style={{
              fontFamily: 'var(--font-inter)', fontSize: 13,
              color: 'var(--text-secondary)', lineHeight: 1.6,
              borderLeft: `2px solid ${tm.color}60`, paddingLeft: 12,
            }}
              className="md-prose"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <button onClick={() => setEditingContent(true)}
              style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 6,
                width: '100%', padding: '20px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-inter)', fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
              + add content
            </button>
          )}
        </div>

        {/* Status */}
        <div style={{ marginBottom: 16 }}>
          <p className="section-label" style={{ marginBottom: 6 }}>Status</p>
          <select value={status}
            onChange={async e => { const s = e.target.value as EntryStatus; setStatus(s); await save({ status: s }) }}
            className="ctrl-input"
            style={{ color: STATUS_META[status]?.color ?? 'var(--text-primary)', width: '100%' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {entry.project && (
            <div style={{ display: 'flex', gap: 8 }}>
              <p className="section-label" style={{ minWidth: 60 }}>Project</p>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {(entry.project as { name: string }).name}
              </span>
            </div>
          )}
          {entry.person && (
            <div style={{ display: 'flex', gap: 8 }}>
              <p className="section-label" style={{ minWidth: 60 }}>Person</p>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {(entry.person as { name: string }).name}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <p className="section-label" style={{ minWidth: 60 }}>Date</p>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {new Date(entry.created_at).toLocaleDateString('pt-PT')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Timeline view ──────────────────────────────────────────────────
function TimelineView({ entries, onSelect }: { entries: Entry[]; onSelect: (e: Entry) => void }) {
  // Group by month
  const groups: { label: string; items: Entry[] }[] = []
  for (const entry of entries) {
    const label = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
    const g = groups.find(g => g.label === label)
    if (g) g.items.push(entry)
    else groups.push({ label, items: [entry] })
  }

  return (
    <div style={{ padding: '0 20px 40px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {groups.map(group => (
        <div key={group.label}>
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{group.label}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--border)', transform: 'translateX(-50%)' }} />

            {group.items.map((entry, i) => {
              const tm = TYPE_META[entry.type] ?? TYPE_META.log
              const isLeft = i % 2 === 0
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end',
                    paddingBottom: 16, position: 'relative',
                  }}
                >
                  {/* Dot on center line */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 16, transform: 'translate(-50%, -50%)',
                    width: 8, height: 8, borderRadius: '50%', background: tm.color,
                    boxShadow: `0 0 8px ${tm.color}80`, zIndex: 1,
                  }} />
                  {/* Card */}
                  <div
                    onClick={() => onSelect(entry)}
                    style={{
                      width: '44%', background: 'var(--surface-1)', border: `1px solid ${tm.border}`,
                      borderRadius: 6, padding: '12px 14px', cursor: 'pointer',
                      borderTop: `2px solid ${tm.color}`,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, padding: '1px 6px', borderRadius: 2,
                        background: tm.bg, color: tm.color, letterSpacing: '0.08em' }}>{tm.label}</span>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      {entry.title}
                    </p>
                    {entry.content && (
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.content.slice(0, 80)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Split list row ──────────────────────────────────────────────────
function SplitRow({ entry, active, onClick }: { entry: Entry; active: boolean; onClick: () => void }) {
  const tm = TYPE_META[entry.type] ?? TYPE_META.log
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      cursor: 'pointer', borderBottom: '1px solid var(--border)',
      borderLeft: active ? `3px solid ${tm.color}` : '3px solid transparent',
      background: active ? tm.bg : 'transparent',
      transition: 'all 0.12s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: tm.color, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, color: tm.color, letterSpacing: '0.08em', minWidth: 52, flexShrink: 0 }}>{tm.label}</span>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {entry.title}
      </span>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
        {new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
      </span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
import { gridVariants, cardVariants as cardGrowAnim } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'

export function SectionEntries({ direction, initialItemId }: SectionProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<EntryType | ''>('')
  const [filterStatus, setFilterStatus] = useState<EntryStatus | ''>('')
  const [filterSearch, setFilterSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    let q = supabase
      .from('entries')
      .select('*, project:projects(id,name), person:people(id,name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)
    if (filterType) q = q.eq('type', filterType)
    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterSearch) q = q.ilike('title', `%${filterSearch}%`)
    const { data, count } = await q
    setEntries((data ?? []) as Entry[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [filterType, filterStatus, filterSearch])

  useEffect(() => { setPage(0); load(0) }, [load])

  // Open a specific entry when navigated from another section
  useEffect(() => {
    if (!initialItemId) return
    async function openById() {
      const { data } = await supabase
        .from('entries')
        .select('*, project:projects(id,name), person:people(id,name)')
        .eq('id', initialItemId)
        .single()
      if (data) {
        setSelectedEntry(data as Entry)
        setViewMode('split')
      }
    }
    openById()
  }, [initialItemId])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const goPage = (p: number) => { setPage(p); load(p) }
  const hasFilters = !!(filterType || filterStatus || filterSearch)

  const activeTypeMeta = filterType ? (TYPE_META[filterType] ?? TYPE_META.log) : null

  return (
    <>
      <SectionWrapper direction={direction}>
        <SectionHeader
          title="Memory"
          subtitle={`${total} entries${filterType ? ` · ${filterType}` : ''}`}
          rightSlot={
            <button onClick={() => setModalOpen(true)} className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <Plus size={11} /> New entry
            </button>
          }
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left sidebar — filters */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '20px 0',
          background: 'var(--surface-1)',
        }}>
          {/* Search */}
          <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Search entries…"
              className="ctrl-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Type filters */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="section-label">Type</p>
            {(['', ...TYPES] as (EntryType | '')[]).map(t => {
              const tm = t ? TYPE_META[t] : null
              const active = filterType === t
              return (
                <button key={t || 'all'} onClick={() => setFilterType(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '5px 8px',
                    borderRadius: 20, border: active ? `1px solid ${tm?.border ?? 'var(--border)'}` : '1px solid transparent',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                    background: active ? (tm?.bg ?? 'var(--surface-2)') : 'transparent',
                    color: active ? (tm?.color ?? 'var(--text-primary)') : 'var(--text-muted)',
                    transition: 'all 0.12s' }}>
                  {tm && <div style={{ width: 5, height: 5, borderRadius: '50%', background: tm.color, flexShrink: 0 }} />}
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12 }}>
                    {t === '' ? 'All' : t}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Status filters */}
          <div style={{ padding: '12px 16px' }}>
            <p className="section-label">Status</p>
            {(['', ...STATUSES] as (EntryStatus | '')[]).map(s => {
              const sm = s ? STATUS_META[s] : null
              const active = filterStatus === s
              return (
                <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '5px 8px',
                    borderRadius: 20, border: active ? `1px solid ${sm?.color ?? 'var(--border)'}40` : '1px solid transparent',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                    background: active ? `${sm?.color ?? '#fff'}14` : 'transparent',
                    color: active ? (sm?.color ?? 'var(--text-primary)') : 'var(--text-muted)',
                    transition: 'all 0.12s' }}>
                  {sm && <div style={{ width: 5, height: 5, borderRadius: '50%', background: sm.color, flexShrink: 0 }} />}
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12 }}>
                    {s === '' ? 'All' : s.replace('_', ' ')}
                  </span>
                </button>
              )
            })}
            {hasFilters && (
              <button
                onClick={() => { setFilterType(''); setFilterStatus(''); setFilterSearch('') }}
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, width: '100%', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                <X size={11} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface-1)',
            position: 'relative', zIndex: 10 }}>
            {/* Active type accent */}
            {activeTypeMeta && (
              <div style={{ height: 20, width: 3, borderRadius: 2, background: activeTypeMeta.color, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }} />
            {/* View mode */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 6, padding: 3, border: '1px solid var(--border)' }}>
              {([['grid', Grid3X3], ['split', Columns2], ['timeline', AlignLeft]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => { setViewMode(mode); setSelectedEntry(null) }}
                  style={{ padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? 'var(--accent)' : 'transparent',
                    color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s',
                    fontFamily: 'var(--font-inter)', fontSize: 11,
                    fontWeight: viewMode === mode ? 500 : 400 }}>
                  <Icon size={11} />
                  <span style={{ textTransform: 'capitalize' }}>{mode}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={12} /> New entry
            </button>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            {/* Grid view */}
            {viewMode === 'grid' && (
              <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 140, borderRadius: 6 }} />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <p>No entries yet</p>
                    <p className="empty-state-hint">Start capturing your thoughts, tasks and decisions</p>
                  </div>
                ) : (
                  <motion.div key={`${filterType}-${filterStatus}-${page}`} variants={gridVariants} initial="hidden" animate="visible"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {entries.map((entry, i) => (
                      <motion.div key={entry.id} custom={i} variants={cardGrowAnim} style={{ originX: 0 }}>
                        <EntryCard entry={entry} index={i} onClick={() => setEditEntry(entry)} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Split view */}
            {viewMode === 'split' && (
              <>
                <div data-inner-scroll style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 44, margin: '4px 8px', borderRadius: 4 }} />
                    ))
                  ) : entries.map(entry => (
                    <SplitRow key={entry.id} entry={entry} active={selectedEntry?.id === entry.id}
                      onClick={() => setSelectedEntry(entry)} />
                  ))}
                </div>
                <AnimatePresence>
                  {selectedEntry ? (
                    <DetailPanel key={selectedEntry.id} entry={selectedEntry} onClose={() => setSelectedEntry(null)}
                      onSaved={() => load(page)} />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">←</div>
                        <p>Select an entry</p>
                        <p className="empty-state-hint">Choose an entry from the list to view details</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Timeline view */}
            {viewMode === 'timeline' && (
              <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', paddingTop: 20 }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 80, borderRadius: 6 }} />
                    ))}
                  </div>
                ) : (
                  <TimelineView entries={entries} onSelect={e => { setViewMode('split'); setSelectedEntry(e) }} />
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => goPage(page - 1)} disabled={page === 0} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: page === 0 ? 0.35 : 1 }}>
                <ChevronLeft size={13} /> Prev
              </button>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: page >= totalPages - 1 ? 0.35 : 1 }}>
                Next <ChevronRight size={13} />
              </button>
          </div>
          )}
        </div>
        </div>{/* end flex row */}
      </SectionWrapper>

      <AddEntryModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => load(page)} />
      <EditEntryModal entry={editEntry} onClose={() => setEditEntry(null)} onSaved={() => load(page)} />
    </>
  )
}
