'use client'
import { useState, useEffect } from 'react'
import { EditModal, Field, ModalInput } from '@/components/ui/EditModal'
import type { Person } from '@context-engine/shared'

interface Props {
  person: Person | null
  onClose: () => void
  onSaved: () => void
}

export function EditPersonModal({ person, onClose, onSaved }: Props) {
  const [name, setName]       = useState('')
  const [role, setRole]       = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail]     = useState('')
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!person) return
    setName(person.name)
    setRole(person.role ?? '')
    setCompany(person.company ?? '')
    setEmail(person.email ?? '')
    setNotes(person.notes ?? '')
  }, [person])

  async function handleSave() {
    if (!person || !name.trim()) return
    setLoading(true)
    await fetch(`/api/people/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        role: role.trim() || null,
        company: company.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      }),
    })
    setLoading(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!person) return
    await fetch(`/api/people/${person.id}`, { method: 'DELETE' })
    onSaved()
    onClose()
  }

  return (
    <EditModal
      open={!!person}
      title="Edit person"
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      loading={loading}
    >
      <Field label="Name">
        <ModalInput value={name} onChange={setName} placeholder="Full name…" />
      </Field>
      <Field label="Role">
        <ModalInput value={role} onChange={setRole} placeholder="e.g. Developer, Designer…" />
      </Field>
      <Field label="Company">
        <ModalInput value={company} onChange={setCompany} placeholder="Company name…" />
      </Field>
      <Field label="Email">
        <ModalInput value={email} onChange={setEmail} placeholder="email@example.com" />
      </Field>
      <Field label="Notes">
        <ModalInput value={notes} onChange={setNotes} placeholder="Additional notes…" multiline />
      </Field>
    </EditModal>
  )
}
