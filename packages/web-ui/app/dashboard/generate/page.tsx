'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Sparkles, FileText, Mail, Globe, AtSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PostDraft {
  id: string
  title: string
  content?: string
  tags: string[]
  metadata?: {
    platform?: string
    status?: string
  }
  created_at: string
}

interface GenerationProfile {
  id: string
  name: string
  platform: string
  tone?: string
  topics?: string[]
  language?: string
  created_at: string
}

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin:   <Globe size={12} />,
  twitter:    <AtSign size={12} />,
  newsletter: <Mail size={12} />,
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin:   'text-blue-400 border-blue-400/40 bg-blue-400/10',
  twitter:    'text-sky-400 border-sky-400/40 bg-sky-400/10',
  newsletter: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-36 animate-pulse bg-[var(--surface-2)]" />
      ))}
    </div>
  )
}

export default function GeneratePage() {
  const [posts, setPosts] = useState<PostDraft[]>([])
  const [profiles, setProfiles] = useState<GenerationProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PostDraft | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: postData }, { data: profileData }] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .eq('type', 'post')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('generation_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setPosts((postData ?? []) as PostDraft[])
    setProfiles((profileData ?? []) as GenerationProfile[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const platforms = Array.from(new Set(posts.map(p => p.metadata?.platform).filter(Boolean))) as string[]
  const filtered = posts.filter(p => !filterPlatform || p.metadata?.platform === filterPlatform)

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      {/* Header */}
      <motion.div variants={fadeVariants} className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Content Generation
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          {loading ? 'LOADING…' : `${posts.length} DRAFTS // ${profiles.length} PROFILES`}
        </p>
      </motion.div>

      {/* Info */}
      <motion.div variants={fadeVariants} className="card p-3 mb-5 flex items-center gap-3 border-[var(--accent)]/30">
        <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
        <p className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          Set a generation profile, ask Claude to <span className="text-[var(--accent)]">generate_posts</span> based on your memory context, then approve and save with <span className="text-[var(--accent)]">save_post</span>.
        </p>
      </motion.div>

      {/* Profiles section */}
      {profiles.length > 0 && (
        <motion.div variants={fadeVariants} className="mb-6">
          <h2 className="module-label mb-3">&gt; GENERATION PROFILES</h2>
          <div className="flex gap-2 flex-wrap">
            {profiles.map(profile => {
              const platform = profile.platform as string
              return (
                <div key={profile.id} className="card p-3 flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] tracking-[0.06em] border ${PLATFORM_COLORS[platform] ?? 'text-[var(--text-muted)] border-[var(--border)]'}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {PLATFORM_ICONS[platform]}
                    {platform?.toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    {profile.name}
                  </span>
                  {profile.tone && (
                    <span className="text-[9px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                      // {profile.tone}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Platform filter */}
      {platforms.length > 0 && (
        <motion.div variants={fadeVariants} className="flex gap-1 flex-wrap mb-5">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setFilterPlatform(v => v === p ? '' : p)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] tracking-[0.06em] border transition-all ${
                filterPlatform === p
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
              }`}
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {PLATFORM_ICONS[p]}
              {p.toUpperCase()}
            </button>
          ))}
        </motion.div>
      )}

      {/* Posts grid */}
      <motion.div variants={fadeVariants}>
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="module-label mb-2">&gt; NO DRAFTS FOUND_</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Ask Claude: &quot;Fetch world context and generate posts for LinkedIn&quot;
            </p>
            <div className="text-[10px] text-[var(--text-muted)] space-y-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              <p>1. <span className="text-[var(--accent)]">set_generation_profile</span> — configure tone, platform, topics</p>
              <p>2. <span className="text-[var(--accent)]">fetch_world_context</span> — get recent news</p>
              <p>3. <span className="text-[var(--accent)]">generate_posts</span> — Claude assembles context prompt</p>
              <p>4. <span className="text-[var(--accent)]">save_post</span> — persist approved drafts</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-22rem)]">
            {/* List */}
            <div className="w-72 xl:w-80 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map((post, i) => {
                  const platform = post.metadata?.platform
                  return (
                    <motion.button
                      key={post.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelected(post)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        selected?.id === post.id
                          ? 'border-[var(--accent)] bg-[var(--accent-glow)] glow-border'
                          : 'card hover:border-[rgba(59,130,246,0.4)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {platform && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] tracking-[0.06em] border ${PLATFORM_COLORS[platform] ?? 'text-[var(--text-muted)] border-[var(--border)]'}`} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                            {PLATFORM_ICONS[platform]}
                            {platform.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[8px] text-[var(--text-muted)] ml-auto" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {post.title}
                      </p>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Detail */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="card p-5 h-full overflow-y-auto"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h2 className="text-base font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {selected.title}
                      </h2>
                      <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] shrink-0">
                        <FileText size={13} />
                      </button>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {selected.content ?? 'No content.'}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-4" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-full card flex items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="module-label mb-2">&gt; SELECT A DRAFT_</p>
                      <p className="text-xs text-[var(--text-muted)]">Click any draft on the left to preview</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
