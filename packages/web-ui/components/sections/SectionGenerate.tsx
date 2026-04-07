'use client'
import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { X, Mail, Globe, AtSign, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SectionProps } from './types'
import { supabase } from '@/lib/supabase'
import { listVariants, rowVariants } from '@/lib/animation-variants'
import { SectionWrapper, SectionHeader } from './SectionLayout'

function stripMd(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .trim()
}

interface PostDraft {
  id: string
  title: string
  content?: string
  tags: string[]
  metadata?: { platform?: string }
  created_at: string
}
interface GenProfile {
  id: string
  name: string
  platform: string
  tone?: string
  topics?: string[]
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  linkedin: <Globe size={11} />,
  twitter: <AtSign size={11} />,
  newsletter: <Mail size={11} />,
}
const PLATFORM_COLOR: Record<string, string> = {
  linkedin: '#3B82F6',
  twitter: '#38BDF8',
  newsletter: '#8B5CF6',
}
const PLATFORM_TABS = [
  { id: '', label: 'All' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'newsletter', label: 'Newsletter' },
]

const TERMINAL_STEPS: [string, string][] = [
  ['set_generation_profile', 'configure tone & topics'],
  ['fetch_world_context', 'get recent news'],
  ['generate_posts', 'Claude assembles context'],
  ['save_post', 'persist approved drafts'],
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function SectionGenerate({ direction }: SectionProps) {
  const [posts, setPosts] = useState<PostDraft[]>([])
  const [profiles, setProfiles] = useState<GenProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PostDraft | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!selected?.content) return
    navigator.clipboard.writeText(selected.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: postData }, { data: profileData }] = await Promise.all([
      supabase.from('entries').select('*').eq('type', 'post').order('created_at', { ascending: false }).limit(100),
      supabase.from('generation_profiles').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    setPosts((postData ?? []) as PostDraft[])
    setProfiles((profileData ?? []) as GenProfile[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = posts.filter(p => !filterPlatform || p.metadata?.platform === filterPlatform)

  const selectedPlatform = selected?.metadata?.platform
  const selectedColor = selectedPlatform ? (PLATFORM_COLOR[selectedPlatform] ?? '#71717A') : 'var(--accent)'

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Content" subtitle={loading ? 'Loading…' : `${posts.length} drafts · ${profiles.length} profiles`} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        {/* Platform tab strip */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          padding: '0 28px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-1)',
          flexShrink: 0,
        }}>
          {PLATFORM_TABS.map(tab => {
            const isActive = filterPlatform === tab.id
            const color = tab.id ? (PLATFORM_COLOR[tab.id] ?? 'var(--accent)') : 'var(--accent)'
            return (
              <button
                key={tab.id}
                onClick={() => setFilterPlatform(tab.id)}
                style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontSize: 12, fontFamily: 'var(--font-inter)', fontWeight: isActive ? 600 : 400,
                  color: isActive ? color : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {tab.id && PLATFORM_ICON[tab.id]}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profiles horizontal strip */}
        {profiles.length > 0 && (
          <div style={{
            padding: '8px 28px', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto', display: 'flex', gap: 6, alignItems: 'center',
          }}>
            {profiles.map(p => {
              const color = PLATFORM_COLOR[p.platform] ?? 'var(--text-muted)'
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 20, flexShrink: 0,
                  }}
                >
                  <span style={{ color, display: 'flex' }}>{PLATFORM_ICON[p.platform]}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>{p.name}</span>
                  {p.tone && (
                    <span style={{
                      fontSize: 10, color, fontFamily: 'var(--font-inter)',
                      background: `${color}15`, padding: '1px 6px', borderRadius: 10,
                      border: `1px solid ${color}30`,
                    }}>
                      {p.tone}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '16px 28px', gap: 16 }}>
          {loading ? (
            <>
              <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8, opacity: 1 - i * 0.18 }} />
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 3, borderRadius: 2 }} />
                <div className="skeleton" style={{ height: 26, borderRadius: 6, width: '55%' }} />
                <div className="skeleton" style={{ flex: 1, borderRadius: 8 }} />
              </div>
            </>
          ) : filtered.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>✍️</div>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No drafts yet</p>
              {/* Mini terminal */}
              <div style={{
                background: '#0D0F14', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 9, padding: '14px 18px', width: 340,
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
              }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                </div>
                {TERMINAL_STEPS.map(([cmd, desc], i) => (
                  <div key={i} style={{ marginBottom: i < TERMINAL_STEPS.length - 1 ? 10 : 0 }}>
                    <div>
                      <span style={{ color: '#10B981' }}>$</span>{' '}
                      <span style={{ color: '#93C5FD' }}>{cmd}</span>
                    </div>
                    <div style={{ color: '#4B5563', paddingLeft: 14 }}>→ {desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Posts sidebar */}
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', paddingRight: 4 }}
              >
                {filtered.map(post => {
                  const platform = post.metadata?.platform
                  const color = platform ? (PLATFORM_COLOR[platform] ?? '#71717A') : '#71717A'
                  const isSelected = selected?.id === post.id
                  const isHovered = hoveredId === post.id
                  return (
                    <motion.button
                      key={post.id}
                      variants={rowVariants}
                      onClick={() => setSelected(post)}
                      onMouseEnter={() => setHoveredId(post.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${color}`,
                        background: isSelected || isHovered ? 'var(--surface-2)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        {platform ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 7px', borderRadius: 4, fontSize: 10,
                            fontFamily: 'var(--font-inter)', fontWeight: 500,
                            border: `1px solid ${color}35`, color, background: `${color}12`,
                          }}>
                            {PLATFORM_ICON[platform]}{platform}
                          </span>
                        ) : <span />}
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {fmtDate(post.created_at)}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500,
                        color: 'var(--text-primary)', margin: 0, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {stripMd(post.title)}
                      </p>
                      {post.content && (
                        <p style={{
                          fontFamily: 'var(--font-inter)', fontSize: 11,
                          color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {stripMd(post.content)}
                        </p>
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>

              {/* Detail panel */}
              <div style={{
                flex: 1, minWidth: 0,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {selected ? (
                  <>
                    {/* Top platform color bar */}
                    <div style={{ height: 3, background: selectedColor, borderRadius: '8px 8px 0 0', flexShrink: 0 }} />

                    {/* Header */}
                    <div style={{ padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        {selectedPlatform ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 5, fontSize: 12,
                            fontFamily: 'var(--font-inter)', fontWeight: 600,
                            border: `1px solid ${selectedColor}40`,
                            color: selectedColor, background: `${selectedColor}15`,
                          }}>
                            {PLATFORM_ICON[selectedPlatform]}{selectedPlatform}
                          </span>
                        ) : <span />}
                        <button
                          onClick={() => setSelected(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h2 style={{
                        fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600,
                        color: 'var(--text-primary)', margin: 0, lineHeight: 1.3,
                      }}>
                        {selected.title}
                      </h2>
                      <button
                        onClick={handleCopy}
                        title="Copy content"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 9px', borderRadius: 4, flexShrink: 0,
                          background: copied ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
                          border: `1px solid ${copied ? '#16A34A' : 'var(--border)'}`,
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
                          letterSpacing: '0.1em', color: copied ? '#16A34A' : 'var(--text-muted)',
                        }}
                      >
                        {copied ? <Check size={10} /> : <Copy size={10} />}
                        {copied ? 'COPIED' : 'COPY'}
                      </button>
                      </div>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmtDateTime(selected.created_at)}
                      </span>
                    </div>

                    {/* Scrollable content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{
                        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9,
                        flex: 1,
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selected.content ?? 'No content.'}
                        </ReactMarkdown>
                      </div>
                      {selected.tags && selected.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          {selected.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                padding: '2px 8px', borderRadius: 10,
                                fontSize: 11, fontFamily: 'var(--font-inter)',
                                background: 'var(--surface-2)', color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✍️</div>
                      <p>Select a draft</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
