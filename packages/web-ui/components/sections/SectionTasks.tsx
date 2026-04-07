'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { type RefObject } from 'react'
import { Plus, X, GripVertical, Pencil } from 'lucide-react'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import type { Entry, EntryStatus } from '@context-engine/shared'
import { EditEntryModal } from '@/components/dashboard/EditEntryModal'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'

const COLUMNS: { id: EntryStatus; label: string; color: string }[] = [
  { id: 'pending',     label: 'Pending',     color: '#EAB308' },
  { id: 'in_progress', label: 'In progress', color: '#3B82F6' },
  { id: 'done',        label: 'Done',        color: '#22C55E' },
  { id: 'blocked',     label: 'Blocked',     color: '#EF4444' },
]

function TaskCard({
  entry, onDelete, onEdit, statusColor,
}: {
  entry: Entry
  onDelete: (id: string) => void
  onEdit: (e: Entry) => void
  statusColor: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        marginBottom: 6,
        borderRadius: 6,
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${statusColor}`,
        padding: '9px 10px',
        position: 'relative',
      }}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="group"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {/* Drag handle — visible only on group hover */}
        <button
          {...attributes} {...listeners}
          className="opacity-0 group-hover:opacity-100"
          style={{
            transition: 'opacity 0.15s',
            marginTop: 1, cursor: 'grab', color: 'var(--text-muted)',
            flexShrink: 0, background: 'none', border: 'none', padding: 1,
          }}
        >
          <GripVertical size={12} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <p style={{
              fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500,
              color: 'var(--text-primary)', lineHeight: 1.4, flex: 1, margin: 0,
            }}>
              {entry.title}
            </p>
            {/* Edit pencil — visible on group hover */}
            <button
              onClick={() => onEdit(entry)}
              className="opacity-0 group-hover:opacity-100"
              style={{
                transition: 'opacity 0.15s',
                flexShrink: 0, color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              }}
            >
              <Pencil size={10} />
            </button>
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {entry.tags.slice(0, 3).map(t => (
                <span key={t} style={{
                  fontFamily: 'var(--font-inter)', fontSize: 10,
                  padding: '2px 7px', borderRadius: 20,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete — visible on group hover, turns red */}
        <button
          onClick={() => onDelete(entry.id)}
          className="opacity-0 group-hover:opacity-100"
          style={{
            transition: 'opacity 0.15s, color 0.15s',
            flexShrink: 0, color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 3,
            pointerEvents: 'auto',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  )
}

interface ColumnProps {
  col: typeof COLUMNS[number]
  entries: Entry[]
  onDelete: (id: string) => void
  onEdit: (e: Entry) => void
  isAddTarget?: boolean
  adding?: boolean
  addInputRef?: RefObject<HTMLInputElement | null>
  newTitle?: string
  onNewTitleChange?: (v: string) => void
  onAdd?: () => void
  onCancelAdd?: () => void
}

function KanbanColumn({
  col, entries, onDelete, onEdit,
  isAddTarget, adding, addInputRef, newTitle, onNewTitleChange, onAdd, onCancelAdd,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      {/* Column header — colored top border + count pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 12px',
        background: isOver ? `${col.color}0a` : 'var(--surface-2)',
        borderTop: `3px solid ${col.color}`,
        border: isOver ? `1px solid ${col.color}55` : '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '6px 6px 0 0',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 600,
          color: 'var(--text-secondary)', flex: 1,
        }}>
          {col.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 500,
          color: 'var(--text-muted)',
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '1px 7px', minWidth: 18, textAlign: 'center',
        }}>
          {entries.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, padding: 8, minHeight: 120,
          border: isOver ? `1px solid ${col.color}55` : '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          background: isOver ? `${col.color}06` : 'var(--surface-1)',
          transition: 'border-color 0.15s, background 0.15s',
          overflowY: 'auto',
        }}
      >
        {/* Inline add input — only in pending column */}
        {isAddTarget && (
          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 6 }}
              >
                <div style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${col.color}50`,
                  borderLeft: `3px solid ${col.color}`,
                  borderRadius: 6, padding: '8px 10px',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <input
                    ref={addInputRef}
                    value={newTitle}
                    onChange={e => onNewTitleChange?.(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') onAdd?.()
                      if (e.key === 'Escape') onCancelAdd?.()
                    }}
                    placeholder="What needs to be done?"
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-inter)', fontSize: 13,
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    onClick={onAdd}
                    style={{
                      background: col.color, border: 'none', borderRadius: 4,
                      padding: '3px 9px', cursor: 'pointer',
                      color: 'white', fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 500,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={onCancelAdd}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {entries.map(e => (
              <TaskCard key={e.id} entry={e} onDelete={onDelete} onEdit={onEdit} statusColor={col.color} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {entries.length === 0 && !adding && (
          <div style={{
            minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)',
          }}>
            Empty
          </div>
        )}
      </div>
    </div>
  )
}

export function SectionTasks({ direction }: SectionProps) {
  const [tasks, setTasks]     = useState<Entry[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding]   = useState(false)
  const [editTask, setEditTask] = useState<Entry | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('type', 'task')
      .order('created_at', { ascending: false })
    setTasks((data ?? []) as Entry[])
  }, [])

  useEffect(() => { load() }, [load])

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string)

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    const colIds = COLUMNS.map(c => c.id) as string[]
    let targetStatus: EntryStatus

    if (colIds.includes(over.id as string)) {
      targetStatus = over.id as EntryStatus
    } else {
      const overTask = tasks.find(t => t.id === over.id)
      if (!overTask || !overTask.status) return
      targetStatus = overTask.status
    }

    if (activeTask.status === targetStatus) return

    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: targetStatus } : t))
    await fetch(`/api/entries/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    })
  }

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('entries').delete().eq('id', id)
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('entries')
      .insert({ title: newTitle.trim(), type: 'task', status: 'pending' })
      .select().single()
    if (data) setTasks(prev => [data as Entry, ...prev])
    setNewTitle('')
    setAdding(false)
  }

  const handleNewTaskClick = () => {
    setAdding(true)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  const grouped = Object.fromEntries(
    COLUMNS.map(c => [c.id, tasks.filter(t => t.status === c.id)])
  ) as Record<EntryStatus, Entry[]>

  const activeTask  = tasks.find(t => t.id === activeId)
  const activeCol   = activeTask ? COLUMNS.find(c => c.id === activeTask.status) : null

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader
        title="Tasks"
        subtitle="What needs to be done"
        rightSlot={
          <motion.button
            onClick={handleNewTaskClick}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <Plus size={13} /> New task
          </motion.button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          variants={listVariants} initial="hidden" animate="visible"
          data-inner-scroll
          style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, padding: '16px 20px', overflowX: 'auto', overflowY: 'hidden' }}
        >
          {COLUMNS.map(col => (
            <motion.div key={col.id} variants={rowVariants} style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <KanbanColumn
                col={col}
                entries={grouped[col.id] ?? []}
                onDelete={handleDelete}
                onEdit={setEditTask}
                isAddTarget={col.id === 'pending'}
                adding={col.id === 'pending' ? adding : false}
                addInputRef={col.id === 'pending' ? addInputRef : undefined}
                newTitle={col.id === 'pending' ? newTitle : ''}
                onNewTitleChange={col.id === 'pending' ? setNewTitle : undefined}
                onAdd={col.id === 'pending' ? handleAdd : undefined}
                onCancelAdd={col.id === 'pending' ? () => { setAdding(false); setNewTitle('') } : undefined}
              />
            </motion.div>
          ))}
        </motion.div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask && (
            <div style={{
              borderRadius: 6,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${activeCol?.color ?? '#71717A'}`,
              padding: '10px 12px',
              width: 210,
              transform: 'rotate(1.5deg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            }}>
              <p style={{
                fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500,
                color: 'var(--text-primary)', margin: 0, lineHeight: 1.4,
              }}>
                {activeTask.title}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <EditEntryModal entry={editTask} onClose={() => setEditTask(null)} onSaved={load} />
    </SectionWrapper>
  )
}
