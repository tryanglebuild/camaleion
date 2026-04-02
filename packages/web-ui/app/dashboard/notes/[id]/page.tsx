'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Edit3, Eye, Save, Star, Tag, Calendar, Layers } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '@context-engine/shared'

const TYPE_COLOR: Record<string, string> = {
  task: '#3B82F6', note: '#8B5CF6', decision: '#F59E0B',
  meet: '#10B981', idea: '#EC4899', log: '#71717A',
  analysis: '#06B6D4', plan: '#6366F1', post: '#F97316',
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NotesPage() {
  const router = useRouter()
  const params = useParams()

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back()
    else router.push('/dashboard')
  }, [router])
  const id = params.id as string

  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editTitle, setEditTitle] = useState(false)
  const [editContent, setEditContent] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/entries/${id}`)
      if (!res.ok) { setError('Entry not found'); setLoading(false); return }
      const data = await res.json() as Entry
      setEntry(data)
      setTitle(data.title)
      setContent(data.content ?? '')
      setLoading(false)
    }
    if (id) load()
  }, [id])

  // Esc key: exit edit mode or go back
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editTitle) { setEditTitle(false); return }
        if (editContent) { setEditContent(false); return }
        goBack()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editTitle, editContent, router])

  // Focus input when entering edit mode
  useEffect(() => { if (editTitle) setTimeout(() => titleRef.current?.focus(), 30) }, [editTitle])
  useEffect(() => { if (editContent) setTimeout(() => contentRef.current?.focus(), 30) }, [editContent])

  const save = useCallback(async (updates: Partial<Entry>) => {
    if (!entry) return
    setSaving(true)
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setEntry(prev => prev ? { ...prev, ...updates } : prev)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [entry, id])

  const accentColor = entry ? (TYPE_COLOR[entry.type] ?? 'var(--accent)') : 'var(--accent)'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-live 1s ease-in-out infinite' }} />
    </div>
  )

  if (error || !entry) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-muted)' }}>{error || 'Not found'}</p>
      <button onClick={() => goBack()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={13} /> Back
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: accentColor, flexShrink: 0 }} />

      {/* Toolbar */}
      <div style={{
        height: 52, flexShrink: 0, borderBottom: '1px solid var(--border)',
        background: 'var(--surface-1)',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
      }}>
        <button
          onClick={() => goBack()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontFamily: 'var(--font-inter)', fontSize: 12,
            transition: 'color 0.15s', padding: '4px 0',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Type badge */}
        <span style={{
          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, fontWeight: 700,
          color: accentColor, background: `${accentColor}18`,
          border: `1px solid ${accentColor}35`,
          borderRadius: 3, padding: '2px 7px', letterSpacing: '0.05em',
        }}>
          {entry.type.toUpperCase()}
        </span>

        {entry.status && (
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
            color: 'var(--text-muted)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '2px 7px', letterSpacing: '0.05em',
          }}>
            {entry.status.replace('_', ' ').toUpperCase()}
          </span>
        )}

        {entry.pinned && (
          <Star size={12} style={{ color: '#EAB308', fill: '#EAB308' }} />
        )}

        <div style={{ flex: 1 }} />

        {/* Save indicator */}
        <AnimatePresence>
          {(saving || saved) && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: saving ? 'var(--text-muted)' : '#22C55E' }}
            >
              {saving ? 'Saving…' : 'Saved'}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Edit / Preview toggle for content */}
        <button
          onClick={() => setEditContent(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: editContent ? 'var(--surface-3)' : 'none',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '4px 10px', cursor: 'pointer',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-inter)', fontSize: 11,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {editContent ? <><Eye size={11} /> Preview</> : <><Edit3 size={11} /> Edit</>}
        </button>
      </div>

      {/* Document body */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px 24px 80px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>

          {/* Title */}
          {editTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => { setEditTitle(false); if (title !== entry.title) save({ title }) }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditTitle(false); if (title !== entry.title) save({ title }) } }}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderBottom: `2px solid ${accentColor}`,
                outline: 'none', paddingBottom: 8,
                fontFamily: 'var(--font-space-grotesk)', fontSize: 36, fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2,
                boxSizing: 'border-box', marginBottom: 24,
              }}
            />
          ) : (
            <h1
              onClick={() => setEditTitle(true)}
              style={{
                fontFamily: 'var(--font-space-grotesk)', fontSize: 36, fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2,
                margin: '0 0 24px', cursor: 'text',
                borderBottom: '2px solid transparent',
                paddingBottom: 8,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              {title || <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 28 }}>Click to add title…</span>}
            </h1>
          )}

          {/* Metadata row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>
                {relativeTime(entry.created_at)}
              </span>
            </div>
            {(entry.project as { name?: string } | null)?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={11} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)' }}>
                  {(entry.project as { name?: string }).name}
                </span>
              </div>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={11} style={{ color: 'var(--text-muted)' }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      fontFamily: 'var(--font-inter)', fontSize: 10,
                      padding: '1px 6px', borderRadius: 20,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 36 }} />

          {/* Content */}
          {editContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                ref={contentRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={() => { if (content !== (entry.content ?? '')) save({ content }) }}
                placeholder="Write in Markdown…"
                style={{
                  width: '100%', minHeight: 400,
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 20,
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, lineHeight: 1.7,
                  color: 'var(--text-secondary)', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box',
                  caretColor: 'var(--accent)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditContent(false); if (content !== (entry.content ?? '')) save({ content }) }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={12} /> Save
                </button>
              </div>
            </div>
          ) : content ? (
            <div
              onClick={() => setEditContent(true)}
              className="prose-note"
              style={{ cursor: 'text' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div
              onClick={() => setEditContent(true)}
              style={{
                padding: '32px 0', cursor: 'text',
                fontFamily: 'var(--font-inter)', fontSize: 15,
                color: 'var(--text-muted)', fontStyle: 'italic',
              }}
            >
              Click to add content… (Markdown supported)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
