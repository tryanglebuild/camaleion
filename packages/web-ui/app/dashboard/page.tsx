'use client'
import { useState, useCallback, useRef } from 'react'
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
import { SectionGraph }  from '@/components/sections/SectionGraph'

const SECTIONS = [
  SectionDashboard,
  SectionEntries,
  SectionSearch,
  SectionProjects,
  SectionCompanies,
  SectionPeople,
  SectionTasks,
  SectionRules,
  SectionAnalyze,
  SectionPlan,
  SectionGenerate,
  SectionGraph,
]

export default function DashboardPage() {
  const [current, setCurrent]           = useState(0)
  const [direction, setDirection]       = useState<'up' | 'down'>('down')
  const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined)
  const throttleRef = useRef(false)

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
    </div>
  )
}
