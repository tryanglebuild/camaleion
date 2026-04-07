'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import type { SectionProps } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  role: string
  system_prompt: string
  status: 'active' | 'inactive'
  color: string
  last_synced: string | null
  updated_at: string
}

interface Session {
  id: string
  goal: string
  status: 'active' | 'completed' | 'failed'
  started_at: string
  ended_at: string | null
  last_message?: string
  agent_count?: number
}

interface Message {
  id: string
  session_id: string
  from_agent: string
  to_agent: string
  type: 'task' | 'result' | 'request' | 'question' | 'answer' | 'context' | 'state' | 'error'
  content: string
  task_id: string | null
  ref_task: string | null
  expects_reply: boolean
  verdict: 'pass' | 'fail' | 'weak' | null
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  orchestrator:    '#3B82F6',
  ideator:         '#F59E0B',
  frontend:        '#8B5CF6',
  backend:         '#06B6D4',
  fullstack:       '#14B8A6',
  tester:          '#EF4444',
  designer:        '#EC4899',
  'design-critic': '#F97316',
  'data-analyst':  '#84CC16',
}

const TYPE_COLORS: Record<string, string> = {
  task:     '#3B82F6',
  result:   '#22C55E',
  request:  '#F59E0B',
  question: '#F59E0B',
  answer:   '#06B6D4',
  context:  '#8B5CF6',
  state:    '#71717A',
  error:    '#EF4444',
}

function agentColor(name: string, fallback?: string): string {
  return AGENT_COLORS[name] ?? fallback ?? '#71717A'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function elapsedTime(start: string, end: string | null): string {
  const from = new Date(start).getTime()
  const to = end ? new Date(end).getTime() : Date.now()
  const sec = Math.floor((to - from) / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

// ── Markdown styles ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdComponents: Record<string, React.ComponentType<any>> = {
  h1: ({ children, ...props }) => (
    <h1 {...props} style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 {...props} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>{children}</h3>
  ),
  p: ({ children, ...props }) => (
    <p {...props} style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12, marginTop: 0, fontSize: 13 }}>{children}</p>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} style={{ fontWeight: 600 }}>{children}</strong>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = !!className
    if (isBlock) {
      return (
        <code
          {...props}
          className={className}
          style={{
            display: 'block',
            background: 'var(--surface-2)',
            padding: 12,
            border: '1px solid var(--border)',
            overflowX: 'auto',
            fontSize: 12,
            borderRadius: 0,
            fontFamily: 'var(--font-mono)',
            marginBottom: 12,
          }}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        {...props}
        style={{
          fontFamily: 'var(--font-mono)',
          background: 'var(--surface-2)',
          padding: '2px 5px',
          border: '1px solid var(--border)',
          fontSize: 12,
          borderRadius: 0,
        }}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre {...props} style={{ margin: '0 0 12px', padding: 0, background: 'none' }}>{children}</pre>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} style={{ paddingLeft: 16, marginBottom: 12, marginTop: 0 }}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} style={{ paddingLeft: 16, marginBottom: 12, marginTop: 0 }}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 13, marginBottom: 4 }}>{children}</li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      style={{
        borderLeft: '3px solid var(--border)',
        paddingLeft: 12,
        color: 'var(--text-secondary)',
        margin: '12px 0',
      }}
    >
      {children}
    </blockquote>
  ),
}

// ── TypeBadge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type, verdict }: { type: string; verdict?: string | null }) {
  const isFailResult = type === 'result' && verdict === 'fail'
  const isPassResult = type === 'result' && verdict === 'pass'
  const isWeakResult = type === 'result' && verdict === 'weak'

  const color = isFailResult ? '#EF4444'
    : isPassResult ? '#22C55E'
    : isWeakResult ? '#F59E0B'
    : TYPE_COLORS[type] ?? '#71717A'

  const label = isFailResult ? 'FAIL'
    : isPassResult ? 'PASS'
    : isWeakResult ? 'WEAK'
    : type.toUpperCase()

  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
      color, border: `1px solid ${color}40`, borderRadius: 3,
      padding: '1px 5px', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ── DateSeparator ─────────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, agents }: { msg: Message; agents: Agent[] }) {
  const agentDef = agents.find(a => a.name === msg.from_agent)
  const color = agentDef?.color ?? agentColor(msg.from_agent)
  const isLeft = msg.from_agent !== msg.to_agent || msg.from_agent === 'orchestrator'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        marginBottom: 16,
      }}
    >
      {/* Agent label + timestamp */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 4,
        width: '72%',
        justifyContent: isLeft ? 'space-between' : 'space-between',
        flexDirection: isLeft ? 'row' : 'row-reverse',
      }}>
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', color,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {msg.from_agent} → {msg.to_agent}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {formatTime(msg.created_at)}
        </span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '72%',
        background: isLeft ? 'var(--surface-1)' : 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderLeft: isLeft ? `3px solid ${color}` : '1px solid var(--border)',
        borderRight: !isLeft ? `3px solid ${color}` : '1px solid var(--border)',
        borderRadius: 0,
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {msg.content}
          </ReactMarkdown>
        </div>
        {/* TypeBadge below content */}
        <div style={{ marginTop: 6 }}>
          <TypeBadge type={msg.type} verdict={msg.verdict} />
        </div>
      </div>
    </motion.div>
  )
}

// ── SessionItem ───────────────────────────────────────────────────────────────

function SessionItem({ session, active, onClick, onEnd, onDelete }: {
  session: Session; active: boolean; onClick: () => void
  onEnd: (id: string) => void; onDelete: (id: string) => void
}) {
  const isLive = session.status === 'active'
  return (
    <div
      className="group"
      onClick={onClick}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-1)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      style={{
        width: '100%', textAlign: 'left', background: active ? 'var(--surface-1)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{
          fontSize: 13, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {session.goal}
        </span>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: isLive ? 'var(--accent)' : 'var(--text-muted)',
        }} />
      </div>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        display: 'block', textAlign: 'right',
      }}>
        {formatDate(session.started_at)} {formatTime(session.started_at)}
      </span>
      {/* Hover-reveal actions */}
      <div className="opacity-0 group-hover:opacity-100" style={{ display: 'flex', gap: 4, marginTop: 2, transition: 'opacity 0.15s' }}>
        {session.status === 'active' && (
          <button onClick={e => { e.stopPropagation(); onEnd(session.id) }}
            style={{ padding: '2px 7px', fontSize: 9, fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.1em',
              border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 2, transition: 'color 0.12s,border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#22C55E'; e.currentTarget.style.borderColor = '#22C55E' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >END</button>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(session.id) }}
          style={{ padding: '2px 7px', fontSize: 9, fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.1em',
            border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 2, transition: 'color 0.12s,border-color 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >×</button>
      </div>
    </div>
  )
}

// ── AgentRosterItem ───────────────────────────────────────────────────────────

function AgentRosterItem({ agent, selected, onClick, onDelete }: {
  agent: Agent; selected: boolean; onClick: () => void; onDelete: (id: string) => void
}) {
  const color = agent.color ?? agentColor(agent.name)
  return (
    <button
      className="group"
      onClick={onClick}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      style={{
        width: '100%', textAlign: 'left',
        background: selected ? `${color}14` : 'transparent',
        border: 'none', borderBottom: '1px solid var(--border)',
        borderLeft: selected ? `4px solid ${color}` : '4px solid transparent',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{agent.role}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          className="opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onDelete(agent.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, transition: 'opacity 0.15s,color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Trash2 size={11} />
        </button>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: color,
          opacity: agent.status === 'active' ? 1 : 0.35,
        }} />
      </div>
    </button>
  )
}

// ── AgentDetail ───────────────────────────────────────────────────────────────

function AgentDetail({ agent, onSave }: { agent: Agent; onSave: (a: Agent) => void }) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [prompt, setPrompt] = useState(agent.system_prompt)
  const [saving, setSaving] = useState(false)
  const [flashSave, setFlashSave] = useState(false)
  const color = agent.color ?? agentColor(agent.name)

  // Sync prompt when agent changes
  useEffect(() => {
    setPrompt(agent.system_prompt)
    setMode('view')
  }, [agent.id, agent.system_prompt])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('agents')
      .update({ system_prompt: prompt, updated_at: new Date().toISOString() })
      .eq('id', agent.id)
    setSaving(false)
    if (!error) {
      onSave({ ...agent, system_prompt: prompt })
      setMode('view')
      setFlashSave(true)
      setTimeout(() => setFlashSave(false), 600)
    }
  }

  async function toggleStatus() {
    const next: Agent['status'] = agent.status === 'active' ? 'inactive' : 'active'
    await supabase.from('agents').update({ status: next }).eq('id', agent.id)
    onSave({ ...agent, status: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Color bar */}
      <div style={{ height: 3, background: color, flexShrink: 0 }} />

      <div style={{ padding: '24px 24px 0', flex: 1, overflowY: 'auto' }}>
        {/* Agent header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: color,
            boxShadow: `0 0 0 2px var(--bg-base), 0 0 0 4px ${color}`,
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {agent.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                {agent.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: color,
                background: `${color}22`,
                borderRadius: 12, padding: '3px 10px',
              }}>
                {agent.status}
              </span>
              <button
                onClick={toggleStatus}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '3px 8px',
                  cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)',
                }}
              >
                Toggle
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{agent.role}</div>
          </div>
        </div>

        {/* System prompt panel */}
        <div style={{ paddingBottom: 24 }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
              color: 'var(--text-muted)', textTransform: 'uppercase',
            }}>
              System Prompt
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <button
                onClick={() => setMode('view')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                  fontWeight: mode === 'view' ? 500 : 400,
                  color: mode === 'view' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                VIEW
              </button>
              <span style={{ color: 'var(--border)', userSelect: 'none' }}>|</span>
              <button
                onClick={() => setMode('edit')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                  fontWeight: mode === 'edit' ? 500 : 400,
                  color: mode === 'edit' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                EDIT
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'view' ? (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, background: flashSave ? `var(--accent)14` : 'transparent' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <pre style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                  color: 'var(--text-secondary)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  padding: '12px 14px', margin: 0, overflow: 'auto',
                }}>
                  {agent.system_prompt}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={20}
                  style={{
                    width: '100%', resize: 'vertical',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: 0,
                    padding: '10px 14px',
                    fontSize: 13, fontFamily: 'var(--font-mono)',
                    lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setPrompt(agent.system_prompt); setMode('view') }}
                    style={{
                      background: 'none', border: 'none',
                      padding: '6px 12px', cursor: 'pointer',
                      fontSize: 13, color: 'var(--text-muted)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: 'var(--accent)', border: 'none', borderRadius: 4,
                      padding: '6px 16px', cursor: 'pointer',
                      fontSize: 13, color: '#fff', fontWeight: 500,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const PRESET_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#DC2626', '#4F46E5']

// ── Main section ──────────────────────────────────────────────────────────────

export function SectionAgents({ direction }: SectionProps) {
  const [tab, setTab] = useState<'sessions' | 'roster'>('sessions')
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createRole, setCreateRole] = useState('')
  const [createPrompt, setCreatePrompt] = useState('')
  const [createColor, setCreateColor] = useState(PRESET_COLORS[0])

  // ── Load sessions ──────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from('agent_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    if (!data) return

    const enriched: Session[] = await Promise.all(data.map(async s => {
      const { data: lastMsg } = await supabase
        .from('agent_messages')
        .select('content, from_agent')
        .eq('session_id', s.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { data: agentNames } = await supabase
        .from('agent_messages')
        .select('from_agent')
        .eq('session_id', s.id)

      const uniqueAgents = new Set((agentNames ?? []).map((m: { from_agent: string }) => m.from_agent))

      return {
        ...s,
        last_message: lastMsg ? `${lastMsg.from_agent}: ${lastMsg.content.slice(0, 60)}` : undefined,
        agent_count: uniqueAgents.size,
      }
    }))

    setSessions(enriched)
    setLoadingSessions(false)
    if (!selectedSession && enriched.length > 0) {
      setSelectedSession(enriched[0].id)
    }
  }, [selectedSession])

  // ── Load agents ────────────────────────────────────────────────
  const loadAgents = useCallback(async () => {
    const { data } = await supabase.from('agents').select('*').order('name')
    if (data) {
      setAgents(data)
      if (!selectedAgent && data.length > 0) setSelectedAgent(data[0].id)
    }
  }, [selectedAgent])

  // ── Load messages ──────────────────────────────────────────────
  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true)
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoadingMessages(false)
  }, [])

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => { loadSessions(); loadAgents() }, [])

  // ── Load messages when session changes ─────────────────────────
  useEffect(() => {
    if (!selectedSession) return
    loadMessages(selectedSession)
  }, [selectedSession])

  // ── Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (!selectedSession) return

    const channel = supabase
      .channel(`agent_messages:${selectedSession}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
          filter: `session_id=eq.${selectedSession}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setSessions(prev => prev.map(s =>
            s.id === selectedSession
              ? { ...s, last_message: `${msg.from_agent}: ${msg.content.slice(0, 60)}` }
              : s
          ))
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [selectedSession])

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedSessionData = sessions.find(s => s.id === selectedSession)
  const selectedAgentData = agents.find(a => a.id === selectedAgent)
  const activeAgentCount = agents.filter(a => a.status === 'active').length

  async function handleEndSession(id: string) {
    await supabase.from('agent_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' as Session['status'], ended_at: new Date().toISOString() } : s))
  }

  async function handleDeleteSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (selectedSession === id) setSelectedSession(null)
    await supabase.from('agent_sessions').delete().eq('id', id)
  }

  async function handleDeleteAgent(id: string) {
    setAgents(prev => prev.filter(a => a.id !== id))
    if (selectedAgent === id) setSelectedAgent(null)
    await supabase.from('agents').delete().eq('id', id)
  }

  async function handleCreateAgent() {
    if (!createName.trim()) return
    const { data } = await supabase.from('agents').insert({
      name: createName.trim(),
      role: createRole.trim() || 'Agent',
      system_prompt: createPrompt.trim(),
      color: createColor,
      status: 'active',
    }).select().single()
    if (data) {
      setAgents(prev => [...prev, data as Agent])
      setCreateName(''); setCreateRole(''); setCreatePrompt(''); setCreateColor(PRESET_COLORS[0])
      setShowCreateForm(false)
    }
  }

  function groupByDate(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = []
    for (const msg of msgs) {
      const label = formatDate(msg.created_at)
      const last = groups[groups.length - 1]
      if (!last || last.date !== label) groups.push({ date: label, messages: [msg] })
      else last.messages.push(msg)
    }
    return groups
  }

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="CE.AGENTS" />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* ── CommandBar ──────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          height: 36, padding: '0 20px', gap: 8,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-1)',
          flexShrink: 0,
        }}>
          {(['sessions', 'roster'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '4px 10px',
                background: tab === t ? 'var(--surface-3)' : 'transparent',
                border: `1px solid ${tab === t ? 'var(--border-active)' : 'var(--border)'}`,
                borderRadius: 3, cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.12s',
              }}
            >{t === 'sessions' ? 'SESSIONS' : 'ROSTER'}</button>
          ))}
          {/* Active agents pill */}
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            <span style={{ color: '#22C55E', fontSize: 10 }}>●</span>
            {activeAgentCount} active
          </div>
        </div>

        {/* ── View panels ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            {tab === 'sessions' ? (
              <motion.div
                key="sessions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
              >
                {/* Left panel — sessions list */}
                <div style={{
                  width: 240, flexShrink: 0,
                  background: 'var(--surface-2)',
                  borderRight: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loadingSessions ? (
                      <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
                    ) : sessions.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)' }}>
                        No sessions yet.
                      </div>
                    ) : (
                      sessions.map(s => (
                        <SessionItem
                          key={s.id}
                          session={s}
                          active={s.id === selectedSession}
                          onClick={() => setSelectedSession(s.id)}
                          onEnd={handleEndSession}
                          onDelete={handleDeleteSession}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Right panel — conversation */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
                  {selectedSessionData ? (
                    <>
                      {/* Conversation header */}
                      <div style={{
                        height: 48, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 20px',
                        background: 'var(--surface-1)',
                        borderBottom: '1px solid var(--border)',
                        gap: 12,
                      }}>
                        <span style={{
                          fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {selectedSessionData.goal}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 11, fontFamily: 'var(--font-mono)',
                            color: selectedSessionData.status === 'active' ? 'var(--accent)' : 'var(--text-muted)',
                            border: `1px solid ${selectedSessionData.status === 'active' ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 4, padding: '2px 7px',
                          }}>
                            {selectedSessionData.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {messages.length} messages
                          </span>
                        </div>
                      </div>

                      {/* Messages area */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                        {loadingMessages ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading messages...</div>
                        ) : messages.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet.</div>
                        ) : (
                          groupByDate(messages).map(group => (
                            <div key={group.date}>
                              <DateSeparator label={group.date} />
                              {group.messages.map(msg => (
                                <MessageBubble key={msg.id} msg={msg} agents={agents} />
                              ))}
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Status bar */}
                      <div style={{
                        height: 36, flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '0 20px',
                        background: 'var(--surface-2)',
                        borderTop: '1px solid var(--border)',
                        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {selectedSessionData.id}
                        </span>
                        <span>·</span>
                        <span>{messages.length} msgs</span>
                        <span>·</span>
                        <span>{elapsedTime(selectedSessionData.started_at, selectedSessionData.ended_at)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', gap: 12,
                    }}>
                      <Bot size={40} style={{ opacity: 0.25 }} />
                      <span style={{ fontSize: 14 }}>Select a session to view the conversation</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="roster"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
              >
                {/* Left panel — agent roster */}
                <div style={{
                  width: 240, flexShrink: 0,
                  background: 'var(--surface-2)',
                  borderRight: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  {/* NEW AGENT trigger */}
                  <button onClick={() => setShowCreateForm(v => !v)}
                    style={{
                      width: '100%', height: 32, background: 'none',
                      border: `1px dashed ${showCreateForm ? 'var(--border-active)' : 'var(--border)'}`,
                      borderRadius: 0, cursor: 'pointer',
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.12em',
                      color: showCreateForm ? 'var(--text-primary)' : 'var(--text-muted)',
                      textTransform: 'uppercase', transition: 'all 0.15s', flexShrink: 0,
                    }}>
                    + NEW AGENT
                  </button>

                  {/* Inline create form */}
                  <AnimatePresence>
                    {showCreateForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
                        <div style={{ borderTop: `3px solid ${createColor}` }} />
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input placeholder="name" value={createName} onChange={e => setCreateName(e.target.value)}
                            style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 2, padding: '6px 8px', fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }} />
                          <input placeholder="role" value={createRole} onChange={e => setCreateRole(e.target.value)}
                            style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 2, padding: '6px 8px', fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }} />
                          <textarea placeholder="system_prompt" value={createPrompt} onChange={e => setCreatePrompt(e.target.value)} rows={4}
                            style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 2, padding: '6px 8px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {PRESET_COLORS.map(c => (
                              <button key={c} onClick={() => setCreateColor(c)}
                                style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                                  outline: createColor === c ? '2px solid var(--text-primary)' : 'none', outlineOffset: 2 }} />
                            ))}
                          </div>
                          <button onClick={handleCreateAgent} disabled={!createName.trim()}
                            style={{ background: createColor, border: 'none', borderRadius: 2, padding: '6px',
                              color: '#fff', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em',
                              cursor: createName.trim() ? 'pointer' : 'not-allowed',
                              opacity: createName.trim() ? 1 : 0.5, textTransform: 'uppercase' as const }}>
                            CREATE
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {agents.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)' }}>
                        No agents registered.
                      </div>
                    ) : (
                      agents.map(a => (
                        <AgentRosterItem
                          key={a.id}
                          agent={a}
                          selected={a.id === selectedAgent}
                          onClick={() => setSelectedAgent(a.id)}
                          onDelete={handleDeleteAgent}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Right panel — agent detail */}
                <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
                  {selectedAgentData ? (
                    <AgentDetail
                      agent={selectedAgentData}
                      onSave={updated => setAgents(prev => prev.map(x => x.id === updated.id ? updated : x))}
                    />
                  ) : (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', gap: 12,
                    }}>
                      <Bot size={40} style={{ opacity: 0.25 }} />
                      <span style={{ fontSize: 14 }}>Select an agent to view details</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  )
}
