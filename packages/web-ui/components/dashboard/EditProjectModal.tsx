'use client'
import { useState, useEffect } from 'react'
import { EditModal, Field, ModalInput, ModalSelect } from '@/components/ui/EditModal'
import type { Project, ProjectStatus } from '@context-engine/shared'

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'done',   label: 'Done'   },
]

interface Props {
  project: Project | null
  onClose: () => void
  onSaved: () => void
}

export function EditProjectModal({ project, onClose, onSaved }: Props) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus]           = useState<ProjectStatus>('active')
  const [stack, setStack]             = useState('')
  const [company, setCompany]         = useState('')
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (!project) return
    setName(project.name)
    setDescription(project.description ?? '')
    setStatus(project.status)
    setStack(project.stack?.join(', ') ?? '')
    setCompany(project.company ?? '')
  }, [project])

  async function handleSave() {
    if (!project || !name.trim()) return
    setLoading(true)
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        status,
        stack: stack.trim() ? stack.split(',').map(s => s.trim()).filter(Boolean) : null,
        company: company.trim() || null,
      }),
    })
    setLoading(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!project) return
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    onSaved()
    onClose()
  }

  return (
    <EditModal
      open={!!project}
      title="Edit project"
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      loading={loading}
    >
      <Field label="Name">
        <ModalInput value={name} onChange={setName} placeholder="Project name…" />
      </Field>
      <Field label="Description">
        <ModalInput value={description} onChange={setDescription} placeholder="Description…" multiline />
      </Field>
      <Field label="Status">
        <ModalSelect value={status} onChange={v => setStatus(v as ProjectStatus)} options={STATUSES} />
      </Field>
      <Field label="Stack (comma separated)">
        <ModalInput value={stack} onChange={setStack} placeholder="Next.js, TypeScript, Supabase" />
      </Field>
      <Field label="Company">
        <ModalInput value={company} onChange={setCompany} placeholder="Company name…" />
      </Field>
    </EditModal>
  )
}
