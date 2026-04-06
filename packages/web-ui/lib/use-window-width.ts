'use client'
import { useState, useEffect } from 'react'

export function useWindowWidth() {
  const [width, setWidth] = useState<number | undefined>(undefined)
  useEffect(() => {
    setWidth(window.innerWidth)
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

export function useIsMobile() {
  const width = useWindowWidth()
  // Return false until mounted to match SSR output and avoid hydration mismatch
  return width === undefined ? false : width < 768
}
