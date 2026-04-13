import type { SignalEntry } from '@/lib/types'

export const SIGNAL_ENTRIES: SignalEntry[] = [
  { id: 's1',  timestamp: '2026-04-12 09:23', user: 'alex_r@studio',      message: '"Context persists across every session. This changes everything."', type: 'quote', avatarId: 5 },
  { id: 's2',  timestamp: '2026-04-12 09:45', user: undefined,             message: 'npm downloads ──── ↓ 12,483 this week', type: 'stat' },
  { id: 's3',  timestamp: '2026-04-12 10:12', user: 'mia.t@agency',        message: '"Changed how I work with Claude Code completely."', type: 'quote', avatarId: 12 },
  { id: 's4',  timestamp: '2026-04-12 11:03', user: undefined,             message: '★ 847 stars on GitHub', type: 'stat' },
  { id: 's5',  timestamp: '2026-04-12 11:45', user: undefined,             message: 'PR merged ──────── feat/memory-search ✓', type: 'event' },
  { id: 's6',  timestamp: '2026-04-12 12:30', user: 'dev.carlos@corp',     message: '"Our entire team shares context now. No more repeated explanations."', type: 'quote', avatarId: 23 },
  { id: 's7',  timestamp: '2026-04-12 13:15', user: undefined,             message: '◎ 234 teams active this month', type: 'stat' },
  { id: 's8',  timestamp: '2026-04-12 14:00', user: 'priya.k@startup',     message: '"The RAG search is genuinely impressive. Finds exactly what I need."', type: 'quote', avatarId: 34 },
  { id: 's9',  timestamp: '2026-04-12 14:33', user: undefined,             message: 'Release v1.4.2 ─── multi-agent sessions stable', type: 'event' },
  { id: 's10', timestamp: '2026-04-12 15:20', user: 'tom.w@freelance',     message: '"I never lose context between work sessions anymore."', type: 'quote', avatarId: 45 },
  { id: 's11', timestamp: '2026-04-12 16:05', user: undefined,             message: '⚡ 99.9% uptime ────── last 90 days', type: 'stat' },
  { id: 's12', timestamp: '2026-04-12 17:00', user: 'sarah.m@agency',      message: '"Best DX improvement of 2026 hands down."', type: 'quote', avatarId: 57 },
  { id: 's13', timestamp: '2026-04-12 17:30', user: undefined,             message: 'Issue closed ─────── #142 context-overflow fix', type: 'event' },
  { id: 's14', timestamp: '2026-04-12 18:15', user: 'james.p@startup',     message: '"Multi-agent orchestration is a game-changer."', type: 'quote', avatarId: 63 },
  { id: 's15', timestamp: '2026-04-12 19:00', user: undefined,             message: '↑ 47% faster context retrieval vs v1.3', type: 'stat' },
]
