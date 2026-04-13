'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap-setup'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const isVisible = useRef(false)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px) and (hover: hover)', () => {
      document.body.classList.add('has-custom-cursor')

      // Start hidden
      gsap.set([dot, ring], { opacity: 0 })

      const xRing = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
      const yRing = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })
      const xDot  = gsap.quickTo(dot,  'x', { duration: 0.08, ease: 'none' })
      const yDot  = gsap.quickTo(dot,  'y', { duration: 0.08, ease: 'none' })

      let mx = 0
      let my = 0

      const onMove = (e: MouseEvent) => {
        mx = e.clientX
        my = e.clientY
        xRing(mx); yRing(my)
        xDot(mx);  yDot(my)

        if (!isVisible.current) {
          isVisible.current = true
          gsap.to([dot, ring], { opacity: 1, duration: 0.3 })
        }
      }

      const onLeave = () => {
        isVisible.current = false
        gsap.to([dot, ring], { opacity: 0, duration: 0.3 })
      }

      const onEnter = () => {
        isVisible.current = true
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 })
      }

      // Expand on interactive elements
      const onMouseOver = (e: MouseEvent) => {
        const target = (e.target as Element).closest('a, button, [data-cursor-expand]')
        if (!target) return
        gsap.to(ring, { scale: 2.2, borderColor: 'var(--accent)', duration: 0.35, ease: 'power2.out' })
        gsap.to(dot,  { scale: 0,   duration: 0.2 })
      }

      const onMouseOut = (e: MouseEvent) => {
        const target = (e.target as Element).closest('a, button, [data-cursor-expand]')
        if (!target) return
        gsap.to(ring, { scale: 1, borderColor: 'rgba(255,255,255,0.8)', duration: 0.5, ease: 'elastic.out(1, 0.5)' })
        gsap.to(dot,  { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
      }

      // Squish on press
      const onDown = () => {
        gsap.to(ring, { scale: 0.85, duration: 0.15, ease: 'power2.in' })
        gsap.to(dot,  { scale: 1.5,  duration: 0.15, ease: 'power2.in' })
      }
      const onUp = () => {
        gsap.to(ring, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
        gsap.to(dot,  { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
      }

      window.addEventListener('mousemove',  onMove)
      document.addEventListener('mouseleave', onLeave)
      document.addEventListener('mouseenter', onEnter)
      document.addEventListener('mouseover',  onMouseOver)
      document.addEventListener('mouseout',   onMouseOut)
      window.addEventListener('mousedown',  onDown)
      window.addEventListener('mouseup',    onUp)

      return () => {
        document.body.classList.remove('has-custom-cursor')
        window.removeEventListener('mousemove',  onMove)
        document.removeEventListener('mouseleave', onLeave)
        document.removeEventListener('mouseenter', onEnter)
        document.removeEventListener('mouseover',  onMouseOver)
        document.removeEventListener('mouseout',   onMouseOut)
        window.removeEventListener('mousedown',  onDown)
        window.removeEventListener('mouseup',    onUp)
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <>
      {/* Ring — lagging follower */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          border: '1.5px solid rgba(255,255,255,0.8)',
          borderRadius: '50%',
          willChange: 'transform',
        }}
      />
      {/* Dot — instant */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          willChange: 'transform',
        }}
      />
    </>
  )
}
