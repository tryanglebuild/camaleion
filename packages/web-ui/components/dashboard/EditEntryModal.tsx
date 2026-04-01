'use client'
import { useState, useEffect } from 'react'
import { EditModal, Field, ModalInput, ModalSelect } from '@/components/ui/EditModal'
import type { Entry, EntryType, EntryStatus } from '@context-engine/shared'

const TYPES: { value: EntryType; label: string }[] = [
  { value: 'task', label: 'Task' }, { value: 'note', label: 'Note' },
  { value: 'decision', label: 'Decision' }, { value: 'meet', label: 'Meet' },
  { value: 'idea', label: 'Idea' }, { value: 'log', label: 'Log' },
]
const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
]

interface Props {
  entry: Entry | null
  onClose: () => void
  onSaved: () => void
}

export function EditEntryModal({ entry, onClose, onSaved }: Props) {
  const [type, setType]       = useState<EntryType>('note')
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus]   = useState<EntryStatus>('pending')
  const [tags, setTags]       = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!entry) return
    setType(entry.type)
    setTitle(entry.title)
    setContent(entry.content ?? '')
    setStatus(entry.status ?? 'pending')
    setTags(entry.tags?.join(', ') ?? '')
  }, [entry])

  async function handleSave() {
    if (!entry || !title.trim()) return
    setLoading(true)
    await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, title: title.trim(),
        content: content.trim() || null,
        status: status || null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      }),
    })
    setLoading(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!entry) return
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    onSaved()
    onClose()
  }

  return (
    <EditModal
      open={!!entry}
      title="Edit entry"
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      loading={loading}
    >
      <Field label="Type">
        <ModalSelect value={type} onChange={v => setType(v as EntryType)} options={TYPES} />
      </Field>
      <Field label="Title">
        <ModalInput value={title} onChange={setTitle} placeholder="Entry title…" />
      </Field>
      <Field label="Content">
        <ModalInput value={content} onChange={setContent} placeholder="Content…" multiline />
      </Field>
      <Field label="Status">
        <ModalSelect value={status} onChange={v => setStatus(v as EntryStatus)} options={STATUSES} />
      </Field>
      <Field label="Tags (comma separated)">
        <ModalInput value={tags} onChange={setTags} placeholder="tag1, tag2, tag3" />
      </Field>
    </EditModal>
  )
}
