import type { FeaturePhase } from '@/lib/types'

export const FEATURES: FeaturePhase[] = [
  {
    id: 1,
    name: 'Total Recall',
    tagline: 'Every decision. Every bug. Every context. Never lost.',
    description: 'CAMELEON captures every piece of knowledge your AI assistant generates — decisions, bugs, learnings, tasks — and makes them instantly searchable across all sessions.',
    accent: '#00FF88',
    glow: 'rgba(0,255,136,0.15)',
  },
  {
    id: 2,
    name: 'Think, Don\'t Search',
    tagline: 'Semantic memory that understands what you mean.',
    description: 'Ask in natural language. CAMELEON\'s RAG engine surfaces the most relevant past context — not keyword matches, but conceptual understanding. Your AI knows what matters.',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    id: 3,
    name: 'Orchestrated Intelligence',
    tagline: 'Multi-agent workflows with shared memory.',
    description: 'Run specialized agents — backend, frontend, designer, tester — that all share the same persistent memory. The orchestrator coordinates. The agents execute. CAMELEON remembers.',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    id: 4,
    name: 'Your AI, Your Rules',
    tagline: 'Hard rules. Soft preferences. Always respected.',
    description: 'Define behavior rules that persist across every session. From code style preferences to security constraints — your AI follows them consistently, forever.',
    accent: '#06B6D4',
    glow: 'rgba(6,182,212,0.15)',
  },
  {
    id: 5,
    name: 'Create From Context',
    tagline: 'Content generation grounded in your reality.',
    description: 'Generate LinkedIn posts, newsletters, and technical content informed by your actual work. CAMELEON knows what you shipped, what you learned, what matters.',
    accent: '#F43F5E',
    glow: 'rgba(244,63,94,0.15)',
  },
]
