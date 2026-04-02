'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Mail, Building2, Briefcase, Pencil } from 'lucide-react'
import { sectionVariants } from './sectionVariants'
import type { SectionProps } from './types'
import { SECTION_INDEX } from './types'
import { supabase } from '@/lib/supabase'
import type { Person, Entry } from '@context-engine/shared'
import { EditPersonModal } from '@/components/dashboard/EditPersonModal'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'

const PAGE_SIZE = 20

interface PersonFull extends Person { entryCount: number }

// ── Avatar ──────────────────────────────────────────────────────────
const PALETTE = ['#3B82F6','#8B5CF6','#EC4899','#10B981','#F59E0B','#06B6D4','#EF4444','#6366F1']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7FFFFFFF
  return PALETTE[h % PALETTE.length]
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const color = avatarColor(name)
  const initials = getInitials(name)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--surface-3)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: size * 0.28, fontWeight: 700, color }}>
        {initials}
      </span>
    </div>
  )
}

// ── Profile Panel ──────────────────────────────────────────────────
function ProfilePanel({ person, onEdit, onSaved, onNavigateTo }: { person: PersonFull; onEdit: () => void; onSaved: () => void; onNavigateTo?: SectionProps['onNavigateTo'] }) {
  const [tab, setTab] = useState<'notes' | 'entries' | 'contact'>('notes')
  const [notes, setNotes] = useState(person.notes ?? '')
  const [entries, setEntries] = useState<Entry[]>([])
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState({ email: person.email ?? '', company: person.company ?? '', role: person.role ?? '' })
  const color = avatarColor(person.name)

  const TYPE_COLOR: Record<string, string> = { task:'#3B82F6', note:'#8B5CF6', decision:'#F59E0B', meet:'#10B981', idea:'#EC4899', log:'#71717A' }

  useEffect(() => {
    setNotes(person.notes ?? '')
    setFieldValues({ email: person.email ?? '', company: person.company ?? '', role: person.role ?? '' })
  }, [person])

  useEffect(() => {
    if (tab === 'entries') {
      supabase.from('entries').select('id,title,type,status,created_at')
        .eq('person_id', person.id).order('created_at', { ascending: false }).limit(10)
        .then(({ data }) => setEntries((data ?? []) as Entry[]))
    }
  }, [tab, person.id])

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/people/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSavingNotes(false)
    onSaved()
  }

  const saveField = async (field: string, value: string) => {
    setEditingField(null)
    await fetch(`/api/people/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    onSaved()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-base)' }}>
      {/* Profile header */}
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar name={person.name} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + role on same line */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 700,
                color: 'var(--text-primary)', margin: 0 }}>{person.name}</h2>
              {person.role && (
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {person.role}
                </span>
              )}
            </div>
            {/* Company pill */}
            {person.company && (
              <span style={{ display: 'inline-flex', alignItems: 'center',
                fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-secondary)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '2px 8px' }}>
                {person.company}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, padding: '3px 8px',
              border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
              {person.entryCount} entries
            </span>
            <button onClick={onEdit}
              title="Edit person"
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-active)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}>
              <Pencil size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['notes', 'entries', 'contact'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '5px 12px', fontFamily: 'var(--font-inter)', fontSize: 12,
              background: tab === t ? 'var(--surface-3)' : 'transparent',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 20, cursor: 'pointer',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.15s', textTransform: 'capitalize',
              fontWeight: tab === t ? 500 : 400 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {/* Notes */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Notes &amp; context
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onFocus={e => { e.target.style.background = 'var(--surface-2)'; e.target.style.borderRadius = '6px'; e.target.style.padding = '12px' }}
              onBlur={e => { e.target.style.background = 'transparent'; e.target.style.borderRadius = '0'; e.target.style.padding = '12px 0'; saveNotes() }}
              placeholder="Write notes about this person…"
              style={{ flex: 1, minHeight: 200, background: 'transparent',
                border: 'none', borderRadius: 0, padding: '12px 0',
                fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-secondary)',
                lineHeight: 1.7, resize: 'none', outline: 'none', transition: 'all 0.2s',
                caretColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              {savingNotes && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saving…</span>}
              <button onClick={saveNotes} className="btn btn-secondary">
                Save notes
              </button>
            </div>
          </div>
        )}

        {/* Entries */}
        {tab === 'entries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Associated entries
            </div>
            {entries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p>No entries yet</p>
                <p className="empty-state-hint">Entries linked to this person will appear here</p>
              </div>
            ) : entries.map(e => (
              <div key={e.id}
                onClick={() => onNavigateTo?.(SECTION_INDEX.ENTRIES, e.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)',
                  cursor: onNavigateTo ? 'pointer' : 'default',
                  transition: 'background 0.1s' }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-3)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'var(--surface-2)')}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: TYPE_COLOR[e.type] ?? '#52525B', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)',
                  minWidth: 52 }}>{e.type}</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {e.title}
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(e.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {tab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Contact info
            </div>
            {[
              { key: 'email', label: 'Email', icon: <Mail size={12} /> },
              { key: 'company', label: 'Company', icon: <Building2 size={12} /> },
              { key: 'role', label: 'Role', icon: <Briefcase size={12} /> },
            ].map(({ key, label, icon }) => (
              <div key={key} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                </div>
                {editingField === key ? (
                  <input autoFocus
                    value={fieldValues[key as keyof typeof fieldValues]}
                    onChange={e => setFieldValues(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => saveField(key, fieldValues[key as keyof typeof fieldValues])}
                    onKeyDown={e => { if (e.key === 'Enter') saveField(key, fieldValues[key as keyof typeof fieldValues]) }}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-active)',
                      fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-primary)', outline: 'none', paddingBottom: 2 }}
                  />
                ) : (
                  <div onClick={() => setEditingField(key)} style={{ fontFamily: 'var(--font-inter)', fontSize: 13,
                    color: fieldValues[key as keyof typeof fieldValues] ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'text', minHeight: 20 }}>
                    {fieldValues[key as keyof typeof fieldValues] || `Click to add ${label.toLowerCase()}…`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
export function SectionPeople({ direction, onNavigateTo }: SectionProps) {
  const [people, setPeople] = useState<PersonFull[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [selected, setSelected] = useState<PersonFull | null>(null)
  const [editPerson, setEditPerson] = useState<Person | null>(null)

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    const { data: ps, count } = await supabase.from('people').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)
    if (!ps) { setLoading(false); return }
    const withCounts = await Promise.all(
      ps.map(async per => {
        const { count: c } = await supabase.from('entries').select('id', { count: 'exact', head: true }).eq('person_id', per.id)
        return { ...per, entryCount: c ?? 0 } as PersonFull
      })
    )
    setPeople(withCounts)
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await supabase.from('people').insert({ name: newName.trim(), role: newRole.trim() || null })
    setNewName(''); setNewRole(''); setAdding(false)
    load(page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <SectionWrapper direction={direction}>

        <SectionHeader
          title="People"
          subtitle={`${total} contacts`}
          rightSlot={
            <button onClick={() => setAdding(v => !v)} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={11} /> Add person
            </button>
          }
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left — person list */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', background: 'var(--surface-1)',
        }}>
          {/* Add form */}
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)',
                  background: 'rgba(244,63,94,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                    placeholder="Name"
                    className="ctrl-input"
                    style={{ fontSize: 12 }} />
                  <input value={newRole} onChange={e => setNewRole(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    placeholder="Role (optional)"
                    className="ctrl-input"
                    style={{ fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1, fontSize: 11 }}>
                      Add
                    </button>
                    <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div data-inner-scroll style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 56, margin: '4px 8px', borderRadius: 4 }} />
              ))
            ) : people.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon">👥</div>
                <p>No contacts yet</p>
                <p className="empty-state-hint">Add people to track relationships</p>
              </div>
            ) : (
              <motion.div variants={listVariants} initial="hidden" animate="visible">
                {people.map(p => {
                  const isActive = selected?.id === p.id
                  const color = avatarColor(p.name)
                  return (
                    <motion.div
                      key={p.id}
                      variants={rowVariants}
                      onClick={() => setSelected(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px 9px 11px',
                        cursor: 'pointer', transition: 'all 0.12s',
                        borderLeft: isActive ? '3px solid #E11D48' : '3px solid transparent',
                        background: isActive ? 'var(--surface-2)' : 'transparent',
                        borderBottom: '1px solid var(--border)',
                      }}
                      whileHover={!isActive ? { backgroundColor: 'var(--surface-2)' } : {}}
                    >
                      <Avatar name={p.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        {p.role && (
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.role}
                          </div>
                        )}
                        {p.company && (
                          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>
                            {p.company}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--text-muted)',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '1px 6px', flexShrink: 0,
                      }}>
                        {p.entryCount}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => { setPage(p => p - 1); load(page - 1) }} disabled={page === 0}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={12} />
              </button>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)' }}>{page + 1}/{totalPages}</span>
              <button onClick={() => { setPage(p => p + 1); load(page + 1) }} disabled={page >= totalPages - 1}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: page >= totalPages - 1 ? 0.3 : 1 }}>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right — profile panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
              <ProfilePanel person={selected} onEdit={() => setEditPerson(selected)} onSaved={() => load(page)} onNavigateTo={onNavigateTo} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <p>No person selected</p>
                <p className="empty-state-hint">Click on a contact to view their profile</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>{/* end flex row body */}
      </SectionWrapper>

      <EditPersonModal person={editPerson} onClose={() => setEditPerson(null)} onSaved={() => load(page)} />
    </>
  )
}
