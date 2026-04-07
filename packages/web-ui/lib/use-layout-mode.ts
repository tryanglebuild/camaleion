'use client'

import { useState, useEffect } from 'react'

export type LayoutMode = 'list' | 'split'

export function useLayoutMode() {
  const [mode, setMode] = useState<LayoutMode>('list')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ctx-layout-mode') as LayoutMode | null
    if (saved === 'list' || saved === 'split') setMode(saved)
    setMounted(true)
  }, [])

  function toggle() {
    setMode(prev => {
      const next = prev === 'list' ? 'split' : 'list'
      localStorage.setItem('ctx-layout-mode', next)
      return next
    })
  }

  return { mode, toggle, mounted }
}
