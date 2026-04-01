'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Database, Search,
  FolderOpen, Users, Menu, X,
  ShieldCheck, BarChart2, ListChecks, Sparkles, Building2,
  Sun, Moon,
} from 'lucide-react'

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored === 'dark'
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

const navItems = [
  { href: '/dashboard',             label: 'DASHBOARD', icon: LayoutDashboard, mod: '00' },
  { href: '/dashboard/entries',     label: 'ENTRIES',   icon: Database,        mod: '01' },
  { href: '/dashboard/search',      label: 'SEARCH',    icon: Search,          mod: '02' },
  { href: '/dashboard/projects',    label: 'PROJECTS',  icon: FolderOpen,      mod: '03' },
  { href: '/dashboard/companies',   label: 'COMPANIES', icon: Building2,       mod: '04' },
  { href: '/dashboard/people',      label: 'PEOPLE',    icon: Users,           mod: '05' },
  { href: '/dashboard/rules',       label: 'RULES',     icon: ShieldCheck,     mod: '06' },
  { href: '/dashboard/analyze',     label: 'ANALYZE',   icon: BarChart2,       mod: '07' },
  { href: '/dashboard/plan',        label: 'PLAN',      icon: ListChecks,      mod: '08' },
  { href: '/dashboard/generate',    label: 'GENERATE',  icon: Sparkles,        mod: '09' },
]

const navListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const navItemVariants: Variants = {
  hidden:   { opacity: 0, x: -10 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

function SidebarContent({ onNav, dark, onToggleTheme }: { onNav?: () => void; dark: boolean; onToggleTheme: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-space-grotesk)', fontSize: 8, fontWeight: 700,
            color: '#fff', letterSpacing: '0.02em', flexShrink: 0,
          }}>CA</div>
          <span
            className="text-[13px] font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.01em' }}
          >
            Camaleon
          </span>
        </div>
        <p
          className="text-[9px] text-[var(--text-muted)] mt-1 pl-[30px]"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          v2.0.0
        </p>
      </div>

      {/* Nav */}
      <motion.nav
        variants={navListVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 py-3 flex flex-col gap-0.5 px-2"
      >
        {navItems.map(({ href, label, icon: Icon, mod }) => {
          const active = pathname === href
          return (
            <motion.div
              key={href}
              variants={navItemVariants}
              whileHover={{ x: 1 }}
              transition={{ duration: 0.12 }}
            >
              <Link
                href={href}
                onClick={onNav}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] tracking-[0.08em] transition-all relative group select-none',
                  active
                    ? 'nav-active'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                <span className={`text-[9px] w-4 text-right shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                  {mod}
                </span>
                <Icon size={13} className="shrink-0" />
                {label}
                {!active && (
                  <motion.span
                    className="absolute left-0 top-0 h-full w-[2px] bg-[var(--accent)] rounded-r"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{ transformOrigin: 'center' }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-done)] shrink-0" />
          <span
            className="text-[9px] text-[var(--text-muted)] tracking-[0.12em] flex-1"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            SYSTEM ONLINE
          </span>
          <motion.button
            onClick={onToggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            {dark ? <Sun size={11} /> : <Moon size={11} />}
          </motion.button>
        </div>
        <p
          className="text-[9px] text-[var(--text-muted)] pl-3.5"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          MCP // STDIO
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dark, toggle } = useTheme()

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[var(--surface-1)] border-r border-[var(--border)] min-h-screen sticky top-0">
        <SidebarContent dark={dark} onToggleTheme={toggle} />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-secondary)]"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed left-0 top-0 h-full w-60 bg-[var(--surface-1)] border-r border-[var(--border)] z-50 md:hidden"
            >
              <button
                className="absolute top-3 right-3 text-[var(--text-secondary)]"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
              <SidebarContent onNav={() => setMobileOpen(false)} dark={dark} onToggleTheme={toggle} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
