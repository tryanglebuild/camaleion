export type MemoryCardType = 'DECISION' | 'BUG' | 'PERSON' | 'TASK' | 'NOTE' | 'IDEA' | 'LOG'

export interface MemoryCardData {
  id: string
  type: MemoryCardType
  title: string
  content: string
  project?: string
  timestamp?: string
}

export interface FeaturePhase {
  id: number
  name: string
  tagline: string
  description: string
  accent: string
  glow: string
}

export interface SignalEntry {
  id: string
  timestamp: string
  user?: string
  message: string
  type: 'quote' | 'stat' | 'event'
  avatarId?: number
}

export interface DemoScenario {
  id: string
  chip: string
  command: string
  response: string
}
