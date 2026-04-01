'use client'

import { useState, useEffect } from 'react'

export type LayoutMode = 'grid' | 'split'

export function useLayoutMode() {
  const [mode, setMode] = useState<LayoutMode>('grid')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ctx-layout-mode') as LayoutMode | null
    if (saved === 'grid' || saved === 'split') setMode(saved)
    setMounted(true)
  }, [])

  function toggle() {
    setMode(prev => {
      const next = prev === 'grid' ? 'split' : 'grid'
      localStorage.setItem('ctx-layout-mode', next)
      return next
    })
  }

  return { mode, toggle, mounted }
}
