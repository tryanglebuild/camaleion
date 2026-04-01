'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Edit2, Trash2 } from 'lucide-react'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import { SectionWrapper, SectionHeader } from './SectionLayout'

type RuleCategory = 'behavior' | 'memory' | 'output' | 'general'

interface Rule {
  id: string
  title: string
  content: string
  category: RuleCategory
  priority: number
  active: boolean
}

const CAT_COLOR: Record<RuleCategory, string> = {
  behavior: '#3B82F6',
  memory:   '#8B5CF6',
  output:   '#22C55E',
  general:  '#71717A',
}

const CAT_ORDER: RuleCategory[] = ['behavior', 'memory', 'output', 'general']

// ── Toggle pill ───────────────────────────────────────────────────
function TogglePill({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Deactivate' : 'Activate'}
      style={{
        width: 28, height: 14, borderRadius: 7,
        background: active ? 'var(--accent)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.18s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: active ? 15 : 2,
        width: 10, height: 10, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.18s cubic-bezier(0.4,0,0.2,1)',
        display: 'block',
      }} />
    </button>
  )
}

// ── Rule modal ────────────────────────────────────────────────────
function RuleModal({ rule, onClose, onSave }: { rule?: Rule | null; onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState(rule?.title ?? '')
  const [content, setContent] = useState(rule?.content ?? '')
  const [category, setCategory] = useState<RuleCategory>(rule?.category ?? 'general')
  const [priority, setPriority] = useState(rule?.priority ?? 5)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    if (rule) {
      await supabase.from('rules').update({ title, content, category, priority }).eq('id', rule.id)
    } else {
      await supabase.from('rules').insert({ title, content, category, priority, active: true })
    }
    setSaving(false)
    onSave()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
            {rule ? 'Edit rule' : 'New rule'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <input
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-inter)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          placeholder="Rule title…" value={title} onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-inter)', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'none', height: 90 }}
          placeholder="Instruction for the AI…" value={content} onChange={e => setContent(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CAT_ORDER.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 11,
                fontFamily: 'var(--font-inter)', cursor: 'pointer',
                border: `1px solid ${category === c ? CAT_COLOR[c] : 'var(--border)'}`,
                color: category === c ? CAT_COLOR[c] : 'var(--text-muted)',
                background: category === c ? `${CAT_COLOR[c]}12` : 'transparent',
              }}
            >{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)' }}>Priority</span>
          <input type="range" min={1} max={10} value={priority} onChange={e => setPriority(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-jetbrains-mono)', width: 24, textAlign: 'right' }}>P{priority}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}
            className="btn btn-primary"
            style={{ opacity: (saving || !title.trim() || !content.trim()) ? 0.4 : 1 }}
          >{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Section ───────────────────────────────────────────────────────
export function SectionRules({ direction }: SectionProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rule | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('rules').select('*').order('priority', { ascending: false })
    setRules((data ?? []) as Rule[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (rule: Rule) => {
    await supabase.from('rules').update({ active: !rule.active }).eq('id', rule.id)
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    await supabase.from('rules').delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const activeCount = rules.filter(r => r.active).length

  // Group rules by category, preserving CAT_ORDER
  const grouped = CAT_ORDER.reduce<Record<string, Rule[]>>((acc, cat) => {
    const catRules = rules.filter(r => r.category === cat)
    if (catRules.length > 0) acc[cat] = catRules
    return acc
  }, {})

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Rules"
        subtitle={loading ? 'Loading…' : `${activeCount} active · ${rules.length} total`}
        rightSlot={
          <motion.button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <Plus size={13} /> New rule
          </motion.button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, borderRadius: 6 }} />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <p>No rules yet</p>
            <p className="empty-state-hint">Create a rule to guide AI behaviour</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {Object.entries(grouped).map(([cat, catRules]) => {
              const category = cat as RuleCategory
              const catActive = catRules.filter(r => r.active).length
              const color = CAT_COLOR[category]

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Category header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-space-grotesk)', fontWeight: 600,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: color,
                    }}>{cat}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)' }}>
                      · {catActive} active
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 4 }} />
                  </div>

                  {/* Rule rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {catRules.map(rule => (
                      <motion.div
                        key={rule.id}
                        layout
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '20px 1fr 40px 1fr 36px 56px',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 10px',
                          borderRadius: 5,
                          opacity: rule.active ? 1 : 0.45,
                          transition: 'opacity 0.2s, background 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Active dot */}
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: rule.active ? color : 'transparent',
                          border: rule.active ? 'none' : `1.5px solid var(--border)`,
                          display: 'inline-block', margin: '0 auto',
                          flexShrink: 0,
                        }} />

                        {/* Title */}
                        <span style={{
                          fontSize: 12, fontFamily: 'var(--font-inter)', fontWeight: 500,
                          color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{rule.title}</span>

                        {/* Priority */}
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)',
                          color: rule.priority >= 8 ? 'var(--accent)' : 'var(--text-muted)',
                          textAlign: 'right',
                        }}>P{rule.priority}</span>

                        {/* Content preview */}
                        <span style={{
                          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-inter)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{rule.content}</span>

                        {/* Toggle pill */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <TogglePill active={rule.active} onClick={() => toggleActive(rule)} />
                        </div>

                        {/* Edit + Delete */}
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => { setEditing(rule); setModalOpen(true) }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, lineHeight: 1, transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          ><Edit2 size={12} /></button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, lineHeight: 1, transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          ><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <AnimatePresence>
          {modalOpen && (
            <RuleModal
              rule={editing}
              onClose={() => { setModalOpen(false); setEditing(null) }}
              onSave={() => { setModalOpen(false); setEditing(null); load() }}
            />
          )}
        </AnimatePresence>
      </div>
    </SectionWrapper>
  )
}
