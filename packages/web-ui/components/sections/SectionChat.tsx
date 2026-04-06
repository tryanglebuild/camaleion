'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
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
  collapsed?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  timestamp: Date
  isStreaming?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function ToolCallCard({ toolCall, onToggle }: { toolCall: ToolCall; onToggle: () => void }) {
  const collapsed = toolCall.collapsed !== false // default collapsed when done
  const isRunning = toolCall.status === 'running'

  const statusEl = isRunning
    ? <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--accent)' }}>⟳ RUNNING</span>
    : toolCall.status === 'done'
    ? <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--status-done)' }}>✓ EXECUTED</span>
    : <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--status-blocked)' }}>✗ FAILED</span>

  const paramEntries = Object.entries(toolCall.params).slice(0, 3)

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
        {collapsed
          ? <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--chat-amber)', textTransform: 'uppercase', flex: 1 }}>
          {toolCall.name}
        </span>
        {statusEl}
      </div>

      {/* Expanded content */}
      {!collapsed && (
        <div style={{ padding: '0 10px 10px 10px' }}>
          {paramEntries.length > 0 && (
            <div style={{ marginBottom: toolCall.result ? 6 : 0 }}>
              {paramEntries.map(([k, v]) => (
                <div key={k} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}:</span> {String(v).slice(0, 80)}
                </div>
              ))}
            </div>
          )}
          {toolCall.result && (
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {toolCall.result.slice(0, 200)}{toolCall.result.length > 200 ? '…' : ''}
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
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="module-label" style={{ color: 'var(--text-muted)' }}>{formatTime(message.timestamp)}</span>
        <span className="module-label" style={{ color: 'var(--text-muted)' }}>YOU</span>
      </div>
      <div style={{
        maxWidth: 480,
        background: 'var(--surface-3)',
        border: '1px solid var(--border)',
        borderRadius: 2,
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

function AiMessage({ message, onToggleTool }: { message: ChatMessage; onToggleTool: (msgId: string, toolId: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="module-label" style={{ color: 'var(--chat-amber)' }}>CE</span>
        <span className="module-label" style={{ color: 'var(--text-muted)' }}>{formatTime(message.timestamp)}</span>
      </div>
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderLeft: '2px solid var(--chat-amber)',
        borderRadius: '0 2px 2px 0',
        padding: '10px 14px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Tool calls rendered before text content */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {message.toolCalls.map(tc => (
              <ToolCallCard
                key={tc.id}
                toolCall={tc}
                onToggle={() => onToggleTool(message.id, tc.id)}
              />
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

const QUICK_CHIPS = [
  { type: 'DECISION', text: 'Add a decision',                typeVar: '--type-decision' },
  { type: 'TASK',     text: 'Add a task',                    typeVar: '--type-task' },
  { type: 'QUERY',    text: 'What did I work on this week?', typeVar: '--type-note' },
  { type: 'FIND',     text: 'Find recent entries',           typeVar: '--accent' },
  { type: 'PEOPLE',   text: 'List all people',               typeVar: '--people-rose' },
  { type: 'LOG',      text: 'Log something',                 typeVar: '--type-log' },
]

function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'calc(40% - 80px)', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          CE.CHAT
        </div>
        <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 12, color: 'var(--text-muted)' }}>
          Operate your knowledge system in natural language.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 6, width: '100%', maxWidth: 400 }}>
        {QUICK_CHIPS.map((chip, i) => (
          <motion.button
            key={chip.type}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onChipClick(chip.text)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              padding: '8px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'var(--chat-amber-glow)'
              el.style.borderColor = 'var(--chat-amber-border)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'var(--surface-2)'
              el.style.borderColor = 'var(--border)'
            }}
          >
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: `var(${chip.typeVar})`, flexShrink: 0, textTransform: 'uppercase' }}>
              {chip.type}
            </span>
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 12, color: 'var(--text-secondary)' }}>
              {chip.text}
            </span>
          </motion.button>
        ))}
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

  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const toggleToolCall = useCallback((msgId: string, toolId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      return {
        ...m,
        toolCalls: m.toolCalls?.map(tc =>
          tc.id === toolId ? { ...tc, collapsed: !(tc.collapsed === false) } : tc
        ),
      }
    }))
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const aiMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setIsLoading(true)

    try {
      const { supabaseUrl, supabaseAnonKey } = getClientConfig()

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase not configured')
      }

      const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))
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
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let totalChars = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = dec.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            setMessages(prev => prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, isStreaming: false } : m
            ))
            continue
          }

          try {
            const json = JSON.parse(data)

            if (json.token) {
              totalChars += json.token.length
              setTokenCount(Math.round(totalChars / 4))
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: m.content + json.token } : m
              ))
            }

            if (json.tool_call) {
              const tc: ToolCall = {
                id: json.tool_call.id,
                name: json.tool_call.name,
                params: json.tool_call.params ?? {},
                status: 'running',
                collapsed: false,
              }
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), tc] }
                  : m
              ))
            }

            if (json.tool_result) {
              const { id, status, result } = json.tool_result
              setMessages(prev => prev.map((m, i) => {
                if (i !== prev.length - 1) return m
                return {
                  ...m,
                  toolCalls: m.toolCalls?.map(tc =>
                    tc.id === id ? { ...tc, status, result, collapsed: true } : tc
                  ),
                }
              }))
            }
          } catch {
            // skip malformed
          }
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
  }, [messages, isLoading])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
    if (e.key === 'Escape') {
      setInput('')
    }
  }, [input, sendMessage])

  const handleChipClick = useCallback((text: string) => {
    setInput(text)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleClear = useCallback(() => {
    setMessages([])
    setTokenCount(0)
  }, [])

  const canSend = input.trim().length > 0 && !isLoading

  const rightSlot = (
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
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--status-blocked)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
        >
          ✕ CLEAR
        </button>
      )}
    </div>
  )

  return (
    <SectionWrapper direction={direction} style={{ display: 'flex', flexDirection: 'column' }}>
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

      <SectionHeader
        title="CE.CHAT"
        accent="var(--chat-amber)"
        rightSlot={rightSlot}
      />

      {/* ChatFeed */}
      <div
        ref={feedRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          minHeight: 0,
        }}
      >
        <div style={{ maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && !isLoading && (
            <EmptyState onChipClick={handleChipClick} />
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return <UserMessage key={msg.id} message={msg} />
              }
              if (msg.isStreaming && msg.content === '') {
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <StreamingIndicator />
                  </motion.div>
                )
              }
              return (
                <AiMessage key={msg.id} message={msg} onToggleTool={toggleToolCall} />
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* InputBar */}
      <div style={{
        flexShrink: 0,
        height: 72,
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
              height: 40,
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
              width: 40,
              height: 40,
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
    </SectionWrapper>
  )
}
