'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, ChevronDown, ChevronRight, X } from 'lucide-react'
import { getClientConfig } from '@/lib/supabase'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import type { SectionProps } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToolCall {
  id: string
  name: string
  params: Record<string, unknown>
  status: 'running' | 'done' | 'error'
  result?: string
  executionTimeMs?: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCallPhase: ToolCall[]
  timestamp: Date
  isStreaming?: boolean
  isInToolPhase: boolean
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  last_message_at: string | null
  message_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tryPrettyJson(str: string | undefined): string {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function buildToolSummary(toolCall: ToolCall): string {
  const entries = Object.entries(toolCall.params)
  if (entries.length === 0) return `${toolCall.name}()`

  const preferred = entries.find(([k]) =>
    /query|search|id|name|title|key|text|content/i.test(k)
  ) ?? entries[0]

  const [key, val] = preferred
  const valStr = typeof val === 'string'
    ? val.slice(0, 30)
    : JSON.stringify(val).slice(0, 30)

  return `${toolCall.name}(${key}: '${valStr}')`
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function uid(): string {
  return Math.random().toString(36).slice(2)
}

// ── Markdown components (chat-specific) ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdComponents: Record<string, React.ComponentType<any>> = {
  p: ({ children, ...props }) => (
    <p {...props} style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10, marginTop: 0, fontSize: 14, fontFamily: 'var(--font-space-grotesk)' }}>{children}</p>
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
            borderRadius: 2,
            fontFamily: 'var(--font-jetbrains-mono)',
            marginBottom: 8,
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
          fontFamily: 'var(--font-jetbrains-mono)',
          background: 'var(--surface-3)',
          padding: '2px 5px',
          border: '1px solid var(--border)',
          fontSize: 12,
          borderRadius: 2,
        }}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre {...props} style={{ margin: '0 0 8px', padding: 0, background: 'none' }}>{children}</pre>
  ),
  a: ({ children, href, ...props }) => (
    <a {...props} href={href} style={{ color: 'var(--chat-amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>{children}</a>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} style={{ paddingLeft: 16, marginBottom: 10, marginTop: 0 }}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} style={{ paddingLeft: 16, marginBottom: 10, marginTop: 0 }}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 14, marginBottom: 2, fontFamily: 'var(--font-space-grotesk)' }}>{children}</li>
  ),
}

// ── ToolCallCard ──────────────────────────────────────────────────────────────

function ToolCallCard({ toolCall, isCollapsed, onToggle }: { toolCall: ToolCall; isCollapsed: boolean; onToggle: () => void }) {
  const isRunning = toolCall.status === 'running'

  const statusEl = isRunning
    ? <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--accent)' }}>⟳ RUNNING</span>
    : toolCall.status === 'done'
    ? <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--status-done)' }}>✓ EXECUTED</span>
    : <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--status-blocked)' }}>✗ FAILED</span>

  const paramEntries = Object.entries(toolCall.params)

  return (
    <motion.div
      initial={{ scaleY: 0.92, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--chat-amber-border)',
        borderRadius: 2,
        borderLeft: '3px solid var(--chat-amber)',
        marginBottom: 8,
        transformOrigin: 'top',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px',
          height: 32,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {isCollapsed
          ? <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--chat-amber)', textTransform: 'uppercase', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {buildToolSummary(toolCall)}
        </span>
        {statusEl}
        {toolCall.executionTimeMs !== undefined && (
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 10,
            color: '#F59E0B',
            opacity: 0.8,
          }}>
            {toolCall.executionTimeMs}ms
          </span>
        )}
      </div>

      {/* Expanded content */}
      {!isCollapsed && (
        <div style={{ padding: '0 10px 10px 10px' }}>
          {paramEntries.length > 0 && (
            <div style={{ marginBottom: toolCall.result ? 6 : 0 }}>
              {paramEntries.map(([k, v]) => (
                <div key={k} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {typeof v === 'object' && v !== null ? (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                      <code style={{
                        background: 'var(--surface-3)',
                        padding: '4px 6px',
                        display: 'block',
                        marginTop: 2,
                        whiteSpace: 'pre-wrap',
                        maxHeight: 120,
                        overflowY: 'auto',
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}>
                        {JSON.stringify(v, null, 2)}
                      </code>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>{k}:</span> {String(v)}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {toolCall.result && (
            <div style={{
              maxHeight: 384,
              overflowY: 'auto',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginTop: 6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border) transparent',
            }}>
              {tryPrettyJson(toolCall.result)}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── StreamingIndicator ────────────────────────────────────────────────────────

function StreamingIndicator() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="module-label" style={{ color: 'var(--chat-amber)' }}>CE</span>
      </div>
      <div style={{
        background: 'var(--surface-1)',
        borderLeft: '2px solid var(--chat-amber)',
        borderRadius: '0 2px 2px 0',
        border: '1px solid var(--border)',
        borderLeftColor: 'var(--chat-amber)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span className="streaming-dot" style={{ animationDelay: '0ms' }}>░</span>
        <span className="streaming-dot" style={{ animationDelay: '200ms' }}>░</span>
        <span className="streaming-dot" style={{ animationDelay: '400ms' }}>░</span>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>computing</span>
        <span className="cursor-blink" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: 'var(--chat-amber)', marginLeft: 2 }}>▊</span>
      </div>
    </div>
  )
}

// ── UserMessage ───────────────────────────────────────────────────────────────

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      layout
      initial={{ x: -8, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', marginLeft: 48 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="module-label" style={{ color: 'var(--chat-amber)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>YOU</span>
        <span className="module-label" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9 }}>{formatTime(message.timestamp)}</span>
      </div>
      <div style={{
        marginLeft: 0,
        borderLeft: '3px solid var(--chat-amber)',
        background: 'var(--chat-amber-glow)',
        padding: '10px 14px',
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: 13,
        color: 'var(--text-primary)',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </motion.div>
  )
}

// ── AiMessage ─────────────────────────────────────────────────────────────────

function AiMessage({ message, collapsedTools, onToggleTool }: { message: ChatMessage; collapsedTools: Set<string>; onToggleTool: (msgId: string, toolId: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="module-label" style={{ color: 'var(--chat-amber)' }}>CE</span>
        <span className="module-label" style={{ color: 'var(--text-muted)' }}>{formatTime(message.timestamp)}</span>
      </div>

      {/* Tools zone — rendered before the text bubble */}
      {message.toolCallPhase.length > 0 && (
        <div style={{
          borderLeft: '2px solid rgba(245,158,11,0.35)',
          paddingLeft: 12,
          marginBottom: message.content ? 10 : 0,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 9,
            color: 'rgba(245,158,11,0.6)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            TOOLS EXECUTED
          </div>
          {message.toolCallPhase.map((tc) => (
            <motion.div
              key={tc.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <ToolCallCard
                toolCall={tc}
                isCollapsed={collapsedTools.has(tc.id)}
                onToggle={() => onToggleTool(message.id, tc.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Text bubble — only when content exists or tool phase is complete */}
      {(!message.isInToolPhase || message.content) && (
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderLeft: '2px solid var(--chat-amber)',
          borderRadius: '0 2px 2px 0',
          padding: '10px 14px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}

// ── BootSequence ──────────────────────────────────────────────────────────────

function BootSequence({ onCommand }: { onCommand: (cmd: string) => void }) {
  const lines = [
    '> CONTEXT ENGINE v2.1 — INITIALIZING',
    '> memory index loaded',
    '> agent registry online',
    '> tools registered: 12',
    '> ready for input',
  ]
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [showPrompts, setShowPrompts] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleLines(i)
      if (i >= lines.length) {
        clearInterval(interval)
        setTimeout(() => setShowPrompts(true), 200)
      }
    }, 80)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: '40px 24px', fontFamily: 'var(--font-jetbrains-mono)' }}>
      {lines.slice(0, visibleLines).map((line, i) => (
        <div key={i} style={{ fontSize: 12, color: i === 0 ? 'var(--chat-amber)' : 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em' }}>
          {line}
        </div>
      ))}
      {showPrompts && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { cmd: 'search memory', label: '> search memory' },
            { cmd: 'show recent projects', label: '> show recent projects' },
            { cmd: 'list active tasks', label: '> list active tasks' },
          ].map(({ cmd, label }) => (
            <button
              key={cmd}
              onClick={() => onCommand(cmd)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 0',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 12,
                color: 'var(--chat-amber)',
                opacity: 0.7,
                borderRadius: 0,
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0.7' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ConversationItem ──────────────────────────────────────────────────────────

function ConversationItem({ session, isActive, onClick, onDelete }: { session: ChatSession; isActive: boolean; onClick: () => void; onDelete: (id: string) => void }) {
  return (
    <div
      className="group"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: isActive ? 'var(--surface-2)' : 'transparent',
        borderRight: isActive ? '3px solid var(--chat-amber)' : '3px solid transparent',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        textAlign: 'left',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        borderTop: 'none',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-1)' }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {session.title}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onDelete(session.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, transition: 'opacity 0.15s, color 0.15s', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {session.last_message_at
            ? new Date(session.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(session.updated_at ?? session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {session.message_count > 0 && (
          <span style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
            {session.message_count}
          </span>
        )}
      </div>
    </div>
  )
}

// ── SectionChat ───────────────────────────────────────────────────────────────

export function SectionChat({ direction }: SectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [tokenCount, setTokenCount] = useState(0)
  const [prefixFocused, setPrefixFocused] = useState(false)
  const [collapsedTools, setCollapsedTools] = useState<Set<string>>(new Set())

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const finalContentRef = useRef('')
  const finalToolCallsRef = useRef<ToolCall[]>([])
  const skipNextSessionLoad = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  // Load sessions on mount
  useEffect(() => {
    async function loadSessions() {
      setSessionsLoading(true)
      try {
        const res = await fetch('/api/chat-sessions')
        if (res.ok) {
          const data = await res.json()
          setSessions(data)
        }
      } finally {
        setSessionsLoading(false)
      }
    }
    loadSessions()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return
    if (skipNextSessionLoad.current) {
      skipNextSessionLoad.current = false
      return
    }
    async function loadMessages() {
      const res = await fetch(`/api/chat-sessions/${activeSessionId}`)
      if (res.ok) {
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCallPhase: m.tool_calls ?? [],
          timestamp: new Date(m.created_at),
          isInToolPhase: false,
        })))
      }
    }
    loadMessages()
  }, [activeSessionId])

  const createSession = useCallback(async (): Promise<string | null> => {
    const res = await fetch('/api/chat-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New conversation' }),
    })
    if (!res.ok) return null
    const session = await res.json()
    setSessions(prev => [session, ...prev])
    setActiveSessionId(session.id)
    setMessages([])
    return session.id
  }, [])

  const handleDeleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
      setMessages([])
    }
    await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' })
  }, [activeSessionId])

  const toggleToolCall = useCallback((_msgId: string, toolId: string) => {
    setCollapsedTools(prev => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
      } else {
        next.add(toolId)
      }
      return next
    })
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')

    const isFirstMessage = messages.length === 0

    // Get or create session inline (without clearing existing messages)
    let sessionId: string | null = activeSessionId
    if (!sessionId) {
      try {
        const res = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New conversation' }),
        })
        if (res.ok) {
          const session = await res.json()
          sessionId = session.id
          setSessions(prev => [session, ...prev])
          skipNextSessionLoad.current = true
          setActiveSessionId(session.id)
        }
      } catch { /* continue without persistence */ }
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
      toolCallPhase: [],
      timestamp: new Date(),
      isInToolPhase: false,
    }

    const aiMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      toolCallPhase: [],
      timestamp: new Date(),
      isStreaming: true,
      isInToolPhase: true,
    }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setIsLoading(true)

    // Persist user message (fire and forget)
    if (sessionId) {
      fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: trimmed }),
      }).catch(() => {})
    }

    // Reset accumulators for this response
    finalContentRef.current = ''
    finalToolCallsRef.current = []

    try {
      const { supabaseUrl, supabaseAnonKey } = getClientConfig()

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase not configured')
      }

      // Filter out messages with empty content (tool-only responses) to avoid confusing the LLM
      const apiMessages = messages
        .filter(m => m.content.trim() !== '')
        .map(m => ({ role: m.role, content: m.content }))
      apiMessages.push({ role: 'user', content: trimmed })

      const res = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${errText ? ': ' + errText.slice(0, 200) : ''}`)
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let totalChars = 0
      const startTimes = new Map<string, number>()
      let streamDone = false
      let streamError = false

      while (true) {
        const { done, value } = await reader.read()
        if (done || streamError) break

        const chunk = dec.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            streamDone = true
            setMessages(prev => prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, isStreaming: false } : m
            ))
            continue
          }

          try {
            const json = JSON.parse(data)

            if (json.error) {
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, content: `⚠ ${json.error}`, isStreaming: false, isInToolPhase: false }
                  : m
              ))
              streamError = true
              break
            }

            if (json.token) {
              totalChars += json.token.length
              setTokenCount(Math.round(totalChars / 4))
              finalContentRef.current += json.token
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, content: m.content + json.token, isInToolPhase: false }
                  : m
              ))
            }

            if (json.tool_call) {
              startTimes.set(json.tool_call.id, Date.now())
              const tc: ToolCall = {
                id: json.tool_call.id,
                name: json.tool_call.name,
                params: json.tool_call.params ?? {},
                status: 'running',
              }
              finalToolCallsRef.current.push(tc)
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, toolCallPhase: [...m.toolCallPhase, tc] }
                  : m
              ))
            }

            if (json.tool_result) {
              const { id, status, result } = json.tool_result
              const executionTimeMs = startTimes.has(id)
                ? Date.now() - startTimes.get(id)!
                : undefined
              finalToolCallsRef.current = finalToolCallsRef.current.map(tc =>
                tc.id === id ? { ...tc, status, result, executionTimeMs } : tc
              )
              setMessages(prev => prev.map((m, i) => {
                if (i !== prev.length - 1) return m
                return {
                  ...m,
                  toolCallPhase: m.toolCallPhase.map(tc =>
                    tc.id === id ? { ...tc, status, result, executionTimeMs } : tc
                  ),
                }
              }))
              setCollapsedTools(prev => {
                const next = new Set(prev)
                next.add(id)
                return next
              })
            }
          } catch {
            // skip malformed
          }
        }
      }

      // Persist assistant message after stream completes
      if (sessionId && streamDone && (finalContentRef.current || finalToolCallsRef.current.length > 0)) {
        fetch(`/api/chat-sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: finalContentRef.current,
            tool_calls: finalToolCallsRef.current,
          }),
        }).catch(() => {})

        // Update session metadata in list
        setSessions(prev => prev.map(s =>
          s.id === sessionId
            ? { ...s, message_count: s.message_count + 2, last_message_at: new Date().toISOString() }
            : s
        ))

        // Auto-title for first message — generate via AI
        if (isFirstMessage) {
          fetch(`/api/chat-sessions/${sessionId}/generate-title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: trimmed,
              assistantMessage: finalContentRef.current,
            }),
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data?.title) {
                setSessions(prev => prev.map(s =>
                  s.id === sessionId ? { ...s, title: data.title } : s
                ))
              }
            })
            .catch(() => {})

          // Optimistic title while AI generates
          const optimisticTitle = trimmed.slice(0, 50)
          setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: optimisticTitle } : s
          ))
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { ...m, content: `⚠ Error: ${errMsg}`, isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, activeSessionId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
    if (e.key === 'Escape') {
      setInput('')
    }
  }, [input, sendMessage])

  const handleClear = useCallback(() => {
    setMessages([])
    setTokenCount(0)
    setActiveSessionId(null)
  }, [])

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <SectionWrapper direction={direction}>
      {/* Inline CSS for streaming animations */}
      <style>{`
        @keyframes streaming-pulse {
          0%, 100% { opacity: 0.2 }
          50% { opacity: 1 }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
        @keyframes prefix-blink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
        .streaming-dot {
          font-family: var(--font-jetbrains-mono);
          font-size: 13px;
          color: var(--chat-amber);
          animation: streaming-pulse 600ms ease-in-out infinite;
          display: inline-block;
        }
        .cursor-blink {
          animation: cursor-blink 530ms step-end infinite;
        }
        .prefix-underscore {
          animation: prefix-blink 530ms step-end infinite;
        }
      `}</style>

      {/* Full-width header */}
      <SectionHeader
        title="CE.CHAT"
        accent="var(--chat-amber)"
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {tokenCount > 0 && (
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                {tokenCount} tokens
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-space-grotesk)', fontSize: 11, color: 'var(--text-muted)',
                  padding: 0, transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--status-blocked)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
              >✕ CLEAR</button>
            )}
            <button
              onClick={createSession}
              title="New conversation"
              style={{
                width: 24, height: 24, borderRadius: 0,
                border: '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 16,
                color: 'var(--text-muted)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--chat-amber)'; e.currentTarget.style.borderColor = 'var(--chat-amber)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >+</button>
          </div>
        }
      />

      {/* Body: chat panel + sessions sidebar (right) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* Chat panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ChatFeed */}
          <div
            ref={feedRef}
            style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', minHeight: 0 }}
          >
            <div style={{ maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && !isLoading && (
                <BootSequence onCommand={sendMessage} />
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return <UserMessage key={msg.id} message={msg} />
                  }
                  if (msg.isStreaming && msg.isInToolPhase && msg.toolCallPhase.length === 0) {
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StreamingIndicator />
                      </motion.div>
                    )
                  }
                  return (
                    <AiMessage key={msg.id} message={msg} collapsedTools={collapsedTools} onToggleTool={toggleToolCall} />
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* InputBar */}
          <div style={{
            flexShrink: 0,
            height: 56,
            background: 'var(--surface-1)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          }}>
            <div style={{
              width: '100%',
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {/* Prefix "> CE" */}
              <div style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--chat-amber)',
                width: 52,
                flexShrink: 0,
                userSelect: 'none',
              }}>
                {'> CE'}
                {!prefixFocused && (
                  <span className="prefix-underscore" style={{ color: 'var(--chat-amber)' }}>_</span>
                )}
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setPrefixFocused(true)}
                onBlur={() => setPrefixFocused(false)}
                placeholder="Ask anything…"
                disabled={isLoading}
                style={{
                  flex: 1,
                  height: 36,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 2,
                  padding: '0 12px',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocusCapture={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--chat-amber)'
                  el.style.boxShadow = '0 0 0 2px var(--chat-amber-glow)'
                }}
                onBlurCapture={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--border)'
                  el.style.boxShadow = 'none'
                }}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: 2,
                  border: 'none',
                  background: canSend ? 'var(--chat-amber)' : 'var(--surface-3)',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <ArrowRight size={14} style={{ color: canSend ? '#fff' : 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Sessions sidebar (right) */}
        <div style={{
          width: 240,
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Scrollable session list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessionsLoading ? (
              <div style={{ padding: '16px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                loading...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '16px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                no conversations yet
              </div>
            ) : (
              sessions.map(session => (
                <ConversationItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onClick={() => setActiveSessionId(session.id)}
                  onDelete={handleDeleteSession}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

