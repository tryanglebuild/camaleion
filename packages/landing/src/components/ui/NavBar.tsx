'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap-setup'
import { ScrollTrigger } from '@/lib/gsap-setup'

export function NavBar() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    gsap.set(nav, { opacity: 0, y: -10 })

    const heroEl = document.getElementById('section-1')
    if (!heroEl) return

    ScrollTrigger.create({
      trigger: heroEl,
      start: 'bottom top',
      onEnter: () => gsap.to(nav, { opacity: 1, y: 0, duration: 0.3 }),
      onLeaveBack: () => gsap.to(nav, { opacity: 0, y: -10, duration: 0.2 }),
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === heroEl) t.kill()
      })
    }
  }, [])

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,8,0.8)] backdrop-blur-md"
      style={{ opacity: 0 }}
    >
      <div className="navbar-brand flex items-center gap-3">
        <div
          className="w-6 h-6 bg-[var(--accent)] opacity-80"
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
        />
        <span className="font-display font-bold text-lg text-[#FAFAFA] tracking-tight">
          CAMELEON
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 font-mono text-xs tracking-widest text-[#52525B] uppercase">
        {['Features', 'Demo', 'Install', 'Docs'].map(item => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="hover:text-[var(--accent)] transition-colors duration-200"
          >
            {item}
          </a>
        ))}
      </div>

      <a
        href="https://github.com/tryangle/cameleon"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex items-center gap-2 px-4 py-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-widest uppercase hover:bg-[var(--accent-glow)] transition-colors duration-200"
        style={{ borderRadius: '2px' }}
      >
        ★ GitHub
      </a>
    </nav>
  )
}
