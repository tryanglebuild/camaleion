'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Plus, X, ShieldCheck, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type RuleCategory = 'behavior' | 'memory' | 'output' | 'general'

interface Rule {
  id: string
  title: string
  content: string
  category: RuleCategory
  priority: number
  active: boolean
  created_at: string
}

const CATEGORIES: RuleCategory[] = ['behavior', 'memory', 'output', 'general']

const CATEGORY_COLORS: Record<RuleCategory, string> = {
  behavior: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  memory:   'text-purple-400 border-purple-400/40 bg-purple-400/10',
  output:   'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  general:  'text-[var(--text-muted)] border-[var(--border)] bg-transparent',
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-32 animate-pulse bg-[var(--surface-2)]" />
      ))}
    </div>
  )
}

interface RuleModalProps {
  rule?: Rule | null
  onClose: () => void
  onSave: () => void
}

function RuleModal({ rule, onClose, onSave }: RuleModalProps) {
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
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="card w-full max-w-lg p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {rule ? 'Edit Rule' : 'New Rule'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            className="ctrl-input w-full"
            placeholder="Rule title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="ctrl-input w-full resize-none h-24"
            placeholder="Rule content / instruction for the AI…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2 py-1 rounded text-[9px] tracking-[0.06em] border transition-all ${
                  category === c
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                }`}
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="module-label">PRIORITY</span>
            <input
              type="range" min={1} max={10}
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--accent)] w-4 text-right" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              {priority}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="px-4 py-2 rounded text-xs bg-[var(--accent)] text-white disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {saving ? 'SAVING…' : 'SAVE'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<RuleCategory | ''>('')
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

  const filtered = rules.filter(r => !filterCat || r.category === filterCat)
  const activeCount = rules.filter(r => r.active).length

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      {/* Header */}
      <motion.div variants={fadeVariants} className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            System Rules
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
            {loading ? 'LOADING…' : `${activeCount} ACTIVE / ${rules.length} TOTAL // INJECTED AT SESSION START`}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          <Plus size={12} /> NEW RULE
        </button>
      </motion.div>

      {/* Info banner */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex items-center gap-3 border-[var(--accent)]/30">
        <ShieldCheck size={14} className="text-[var(--accent)] shrink-0" />
        <p className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          Active rules are sent to the AI at the start of every session via <span className="text-[var(--accent)]">query_context()</span>. Higher priority rules appear first.
        </p>
      </motion.div>

      {/* Filter */}
      <motion.div variants={fadeVariants} className="flex gap-1 flex-wrap mb-5">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(v => v === c ? '' : c)}
            className={`px-2 py-1 rounded text-[9px] tracking-[0.06em] border transition-all ${
              filterCat === c
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
            }`}
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {c.toUpperCase()}
          </button>
        ))}
        {filterCat && (
          <button
            onClick={() => setFilterCat('')}
            className="ml-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            <X size={10} /> CLEAR
          </button>
        )}
      </motion.div>

      {/* Grid */}
      <motion.div variants={fadeVariants}>
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="module-label mb-2">&gt; NO RULES FOUND_</p>
            <p className="text-xs text-[var(--text-muted)]">Create a rule to guide the AI behaviour</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((rule, i) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className={`card p-4 flex flex-col gap-3 transition-all ${rule.active ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] tracking-[0.08em] border ${CATEGORY_COLORS[rule.category]}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {rule.category.toUpperCase()}
                      </span>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mt-1.5 line-clamp-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {rule.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <span className="text-[9px] text-[var(--accent)] w-4 text-right" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        P{rule.priority}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-3 flex-1">
                    {rule.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`flex items-center gap-1.5 text-[9px] tracking-[0.06em] transition-colors ${
                        rule.active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                      }`}
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      <span className={`w-6 h-3 rounded-full relative transition-colors ${rule.active ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'}`}>
                        <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${rule.active ? 'left-3.5' : 'left-0.5'}`} />
                      </span>
                      {rule.active ? 'ACTIVE' : 'OFF'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(rule); setModalOpen(true) }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <RuleModal
            rule={editing}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            onSave={() => { setModalOpen(false); setEditing(null); load() }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
