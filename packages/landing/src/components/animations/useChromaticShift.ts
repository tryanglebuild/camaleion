'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap-setup'
import { ScrollTrigger } from '@/lib/gsap-setup'
import { PHASE_ACCENTS } from '@/lib/constants'

export function useChromaticShift() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const root = document.documentElement

    function setPhase(index: number) {
      const phase = PHASE_ACCENTS[index]
      if (!phase) return
      gsap.to(root, {
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate() {
          // done via direct set for CSS var
        },
      })
      root.style.setProperty('--accent', phase.color)
      root.style.setProperty('--accent-glow', phase.glow)
      root.style.setProperty('--page-hue', String(phase.hue))
    }

    // Map sections to phases
    const sectionPhaseMap: Record<string, number> = {
      'section-1': 0,
      'section-2': 0,
      'section-3': 0,
      'section-4': 0,
      'section-5-1': 0,
      'section-5-2': 1,
      'section-5-3': 2,
      'section-5-4': 3,
      'section-5-5': 4,
      'section-6': 4,
      'section-7': 3,
      'section-8': 2,
      'section-9': 0,
    }

    Object.entries(sectionPhaseMap).forEach(([id, phaseIdx]) => {
      const el = document.getElementById(id)
      if (!el) return
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setPhase(phaseIdx),
        onEnterBack: () => setPhase(phaseIdx),
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])
}
