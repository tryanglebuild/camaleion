'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LeftNav } from '@/components/dashboard/LeftNav'
import { SectionDashboard } from '@/components/sections/SectionDashboard'
import { SectionEntries }  from '@/components/sections/SectionEntries'
import { SectionSearch }   from '@/components/sections/SectionSearch'
import { SectionProjects } from '@/components/sections/SectionProjects'
import { SectionCompanies } from '@/components/sections/SectionCompanies'
import { SectionPeople }   from '@/components/sections/SectionPeople'
import { SectionTasks }    from '@/components/sections/SectionTasks'
import { SectionRules }    from '@/components/sections/SectionRules'
import { SectionAnalyze }  from '@/components/sections/SectionAnalyze'
import { SectionPlan }     from '@/components/sections/SectionPlan'
import { SectionGenerate } from '@/components/sections/SectionGenerate'
import { SectionGraph }    from '@/components/sections/SectionGraph'
import { SectionSettings }  from '@/components/sections/SectionSettings'
import { SectionTimeline }  from '@/components/sections/SectionTimeline'
import { SectionAgents }   from '@/components/sections/SectionAgents'
import { SectionChat }     from '@/components/sections/SectionChat'
import { AddEntryModal } from '@/components/dashboard/AddEntryModal'
import { CommandPalette } from '@/components/dashboard/CommandPalette'

const SECTIONS = [
  SectionDashboard,   // 0  Overview
  SectionEntries,     // 1  Memory
  SectionSearch,      // 2  Search
  SectionProjects,    // 3  Projects
  SectionCompanies,   // 4  Companies
  SectionPeople,      // 5  People
  SectionChat,        // 6  Chat
  SectionAgents,      // 7  Agents
  SectionAnalyze,     // 8  Analyses
  SectionPlan,        // 9  Plans
  SectionGenerate,    // 10 Content
  SectionGraph,       // 11 Graph
  SectionTimeline,    // 12 Timeline
  SectionTasks,       // 13 Tasks
  SectionRules,       // 14 Rules
  SectionSettings,    // 15 Settings
]

export default function DashboardPage() {
  const [current, setCurrent]           = useState(0)
  const [direction, setDirection]       = useState<'up' | 'down'>('down')
  const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined)
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [newEntryOpen, setNewEntryOpen] = useState(false)
  const throttleRef = useRef(false)
  const refreshRef  = useRef(0) // bump to signal reload to current section

  const navigate = useCallback((next: number) => {
    if (throttleRef.current) return
    if (next < 0 || next >= SECTIONS.length) return
    setDirection(next > current ? 'down' : 'up')
    setCurrent(next)
    throttleRef.current = true
    setTimeout(() => { throttleRef.current = false }, 700)
  }, [current])

  const navigateTo = useCallback((sectionIndex: number, itemId?: string) => {
    if (throttleRef.current) return
    if (sectionIndex < 0 || sectionIndex >= SECTIONS.length) return
    setDirection(sectionIndex > current ? 'down' : 'up')
    setInitialItemId(itemId)
    setCurrent(sectionIndex)
    throttleRef.current = true
    setTimeout(() => { throttleRef.current = false }, 700)
  }, [current])

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement).isContentEditable

      // ⌘K / Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(v => !v)
        return
      }

      if (inInput) return

      // N — new entry
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setNewEntryOpen(true)
        return
      }

      // Esc — close palette
      if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const Section = SECTIONS[current]

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <LeftNav current={current} onNavigate={navigate} />
      <AnimatePresence mode="wait" custom={direction}>
        <Section
          key={current}
          direction={direction}
          initialItemId={initialItemId}
          onNavigateTo={navigateTo}
        />
      </AnimatePresence>

      {/* Global new entry modal (triggered by N key) */}
      <AddEntryModal
        open={newEntryOpen}
        onClose={() => setNewEntryOpen(false)}
        onSuccess={() => { refreshRef.current++ }}
      />

      {/* Command palette (⌘K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
      />
    </div>
  )
}
