'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Zap, CornerDownLeft } from 'lucide-react'
import type { Entry } from '@context-engine/shared'
import { EntryCard } from '@/components/dashboard/EntryCard'

interface SearchResult { entry: Entry; score: number }

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(''); setSearched(false)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 8 }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setResults(await res.json())
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <motion.div variants={fadeVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Semantic Search
        </h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          Natural language retrieval over your memory
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.form variants={fadeVariants} onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="What did we decide about the API? / Show blocked tasks…"
            className="ctrl-input pl-10 pr-36 py-4 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="cmd-btn absolute right-2 top-1/2 -translate-y-1/2 !py-1.5 !px-3 flex items-center gap-1.5 disabled:opacity-30"
          >
            {loading
              ? <span className="w-3 h-3 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
              : <><Zap size={10} /> EXECUTE</>
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
          <CornerDownLeft size={9} /> ENTER to search
        </p>
      </motion.form>

      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-5 p-3 border border-red-500/25 bg-red-500/5 rounded text-[11px] text-red-400"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          ERR: {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {searched && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p
              className="module-label mb-5"
              style={{ color: results.length ? 'var(--text-mono-dim)' : 'var(--text-muted)' }}
            >
              &gt; {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOUND
            </p>

            {results.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="module-label mb-2">&gt; NO MATCHES_</p>
                <p className="text-xs text-[var(--text-muted)]">Try a different query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(({ entry, score }, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    {/* Score chip */}
                    <div
                      className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded text-[9px] bg-[var(--accent)] text-white"
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {Math.round(score * 100)}%
                    </div>
                    <EntryCard entry={entry} index={i} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
