'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Database, Search, FolderOpen, Users,
  CheckSquare, ShieldCheck, BarChart2, ListChecks, Sparkles,
  Network, Building2, Sun, Moon, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChameleonLogo } from '@/components/ui/ChameleonLogo'

const NAV_EXPANDED = 220
const NAV_COLLAPSED = 48

// ── Theme ─────────────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark'
    setDark(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '')
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
  }
  return { dark, toggle }
}

// ── Counts ────────────────────────────────────────────────────────
function useNavCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    async function load() {
      const [entries, projects, people, tasks, rules, analyses, plans, posts] = await Promise.all([
        supabase.from('entries').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'task').neq('status', 'done'),
        supabase.from('rules').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'analysis'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'plan'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'post'),
      ])
      setCounts({
        entries: entries.count ?? 0,
        projects: projects.count ?? 0,
        people: people.count ?? 0,
        tasks: tasks.count ?? 0,
        rules: rules.count ?? 0,
        analyses: analyses.count ?? 0,
        plans: plans.count ?? 0,
        posts: posts.count ?? 0,
      })
    }
    load()
  }, [])
  return counts
}

// ── Nav structure ─────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { icon: LayoutDashboard, label: 'Overview',  index: 0,  countKey: null },
      { icon: Database,        label: 'Memory',    index: 1,  countKey: 'entries' },
      { icon: Search,          label: 'Search',    index: 2,  countKey: null },
    ],
  },
  {
    label: 'ENTITIES',
    items: [
      { icon: FolderOpen, label: 'Projects',  index: 3,  countKey: 'projects' },
      { icon: Building2,  label: 'Companies', index: 4,  countKey: null },
      { icon: Users,      label: 'People',    index: 5,  countKey: 'people' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: CheckSquare, label: 'Tasks',    index: 6,  countKey: 'tasks' },
      { icon: ShieldCheck, label: 'Rules',    index: 7,  countKey: 'rules' },
      { icon: BarChart2,   label: 'Analyses', index: 8,  countKey: 'analyses' },
      { icon: ListChecks,  label: 'Plans',    index: 9,  countKey: 'plans' },
      { icon: Sparkles,    label: 'Content',  index: 10, countKey: 'posts' },
      { icon: Network,     label: 'Graph',    index: 11, countKey: null },
    ],
  },
]

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items)

interface LeftNavProps {
  current: number
  onNavigate: (i: number) => void
}

export function LeftNav({ current, onNavigate }: LeftNavProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const throttleRef = useRef(false)
  const { dark, toggle } = useTheme()
  const counts = useNavCounts()

  // Init collapsed from localStorage + set CSS var
  useEffect(() => {
    const saved = localStorage.getItem('nav-collapsed') === '1'
    setCollapsed(saved)
    document.documentElement.style.setProperty('--nav-width', `${saved ? NAV_COLLAPSED : NAV_EXPANDED}px`)
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('nav-collapsed', next ? '1' : '0')
      document.documentElement.style.setProperty('--nav-width', `${next ? NAV_COLLAPSED : NAV_EXPANDED}px`)
      return next
    })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    if (throttleRef.current) return
    throttleRef.current = true
    onNavigate(current + (e.deltaY > 0 ? 1 : -1))
    setTimeout(() => { throttleRef.current = false }, 700)
  }, [current, onNavigate])

  const navWidth = collapsed ? NAV_COLLAPSED : NAV_EXPANDED

  return (
    <motion.div
      onWheel={handleWheel}
      animate={{ width: navWidth }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', left: 0, top: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        zIndex: 100,
        borderRight: '1px solid var(--border)',
        background: 'var(--surface-1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────── */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        padding: collapsed ? '0 12px' : '0 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 9,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChameleonLogo size={18} color="var(--text-primary)" strokeWidth={1.6} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              camaleon
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav groups ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 }}
        className="scrollbar-hide">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 2 }}>
            {/* Group label */}
            <div style={{
              padding: collapsed ? '8px 0 4px' : '8px 16px 4px',
              textAlign: collapsed ? 'center' : 'left',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 8, fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              userSelect: 'none',
              overflow: 'hidden',
            }}>
              {collapsed ? group.label.slice(0, 1) : group.label}
            </div>

            {/* Items */}
            {group.items.map(({ icon: Icon, label, index: i, countKey }) => {
              const isActive = current === i
              const count = countKey ? (counts[countKey] ?? 0) : 0

              return (
                <div key={i} style={{ position: 'relative', padding: collapsed ? '0 6px' : '0 8px', marginBottom: 1 }}>
                  <button
                    onClick={() => onNavigate(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: '100%',
                      height: 34,
                      borderRadius: 7,
                      border: isActive ? '1px solid var(--ui-glow)' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 9,
                      padding: collapsed ? '0' : '0 10px',
                      cursor: 'pointer',
                      position: 'relative',
                      background: isActive ? 'var(--ui-glow)' : 'transparent',
                      color: isActive ? 'var(--ui-fg)' : hovered === i ? 'var(--text-primary)' : 'var(--text-muted)',
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    }}
                    onMouseOver={e => {
                      if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'
                    }}
                    onMouseOut={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Active left bar */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="active-bar"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          style={{
                            position: 'absolute', left: -8, top: '50%', marginTop: -10,
                            width: 3, height: 20,
                            borderRadius: 2, background: 'var(--ui-fg)',
                            originY: 0.5,
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <Icon size={14} strokeWidth={1.6} style={{ flexShrink: 0 }} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 12, fontWeight: isActive ? 500 : 400,
                            flex: 1, textAlign: 'left',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Count badge */}
                    <AnimatePresence>
                      {!collapsed && count > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          style={{
                            fontFamily: 'var(--font-jetbrains-mono)',
                            fontSize: 9, fontWeight: 500,
                            color: isActive ? 'var(--ui-fg)' : 'var(--text-muted)',
                            flexShrink: 0,
                            minWidth: 16,
                            textAlign: 'right',
                          }}
                        >
                          {count}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Tooltip (collapsed only) */}
                  <AnimatePresence>
                    {collapsed && hovered === i && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.12 }}
                        style={{
                          position: 'absolute', left: NAV_COLLAPSED + 4, top: '50%', transform: 'translateY(-50%)',
                          padding: '4px 10px', borderRadius: 6,
                          background: 'var(--surface-1)', border: '1px solid var(--border)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        {label}
                        {count > 0 && (
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                            {count}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px 0 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        {/* Collapse / expand toggle — always visible */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: collapsed ? 30 : 'calc(100% - 28px)',
            height: 28, borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 6, padding: collapsed ? '0' : '0 8px',
            color: 'var(--text-muted)',
            transition: 'color 0.15s, border-color 0.15s, width 0.22s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {collapsed
            ? <ChevronRight size={11} strokeWidth={2} />
            : <>
                <ChevronLeft size={11} strokeWidth={2} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, whiteSpace: 'nowrap' }}>Collapse</span>
              </>
          }
        </button>

        {/* Status + theme row */}
        {collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-done)', animation: 'pulse-live 2.5s ease-in-out infinite' }} />
            </div>
            <button
              onClick={toggle}
              title={dark ? 'Light theme' : 'Dark theme'}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {dark ? <Sun size={11} strokeWidth={1.5} /> : <Moon size={11} strokeWidth={1.5} />}
            </button>
          </>
        ) : (
          <div style={{ width: '100%', padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-done)', animation: 'pulse-live 2.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  ONLINE
                </span>
              </div>
              <button
                onClick={toggle}
                title={dark ? 'Light theme' : 'Dark theme'}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {dark ? <Sun size={11} strokeWidth={1.5} /> : <Moon size={11} strokeWidth={1.5} />}
              </button>
            </div>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', opacity: 0.6, letterSpacing: '0.08em' }}>
              MCP // STDIO
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

