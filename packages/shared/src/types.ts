export type EntryType = 'task' | 'note' | 'decision' | 'meet' | 'idea' | 'log' | 'analysis' | 'plan' | 'post' | 'file'
export type EntryStatus = 'pending' | 'in_progress' | 'done' | 'blocked'
export type ProjectStatus = 'active' | 'paused' | 'done'
export type RuleCategory = 'behavior' | 'memory' | 'output' | 'general'
export type GenerationPlatform = 'linkedin' | 'twitter' | 'newsletter'

export interface Project {
  id: string
  name: string
  company: string | null
  stack: string[] | null
  status: ProjectStatus
  description: string | null
  created_at: string
}

export interface Person {
  id: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export interface Entry {
  id: string
  type: EntryType
  title: string
  content: string | null
  status: EntryStatus | null
  pinned: boolean
  project_id: string | null
  person_id: string | null
  tags: string[] | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // joined
  project?: Pick<Project, 'id' | 'name'> | null
  person?: Pick<Person, 'id' | 'name'> | null
}

export interface Embedding {
  id: string
  entry_id: string | null
  embedding: number[]
  content: string
  source_type: 'entry' | 'file'
  file_path: string | null
  created_at: string
}

export interface Rule {
  id: string
  title: string
  content: string
  category: RuleCategory | null
  active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface GenerationProfile {
  id: string
  platform: GenerationPlatform
  intent: string
  tone: string
  topics: string[]
  avoid: string[]
  post_frequency: string | null
  language: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface SearchResult {
  entry: Entry
  score: number
}
