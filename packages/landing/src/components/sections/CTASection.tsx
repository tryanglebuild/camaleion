'use client'

import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap-setup'
import { PHASE_ACCENTS } from '@/lib/constants'

const ChameleonEye = dynamic(() => import('@/components/three/ChameleonEye'), { ssr: false })

export function CTASection() {
  const sectionRef   = useRef<HTMLElement>(null)
  const eyeWrapRef   = useRef<HTMLDivElement>(null)
  const contentRef   = useRef<HTMLDivElement>(null)
  const headingRef   = useRef<HTMLHeadingElement>(null)
  const eyelidRef    = useRef<HTMLDivElement>(null)
  const eyeUniforms  = useRef<{ uOpenProgress: { value: number }; uHue: { value: number } } | null>(null)
  const winkDoneRef  = useRef(false)

  const handleEyeReady = (uniforms: { uOpenProgress: { value: number }; uHue: { value: number } }) => {
    eyeUniforms.current = uniforms
    uniforms.uOpenProgress.value = 0.05
  }

  useEffect(() => {
    const section  = sectionRef.current
    const eyeWrap  = eyeWrapRef.current
    const content  = contentRef.current
    const heading  = headingRef.current
    const eyelid   = eyelidRef.current
    if (!section || !eyeWrap || !content || !heading || !eyelid) return

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = []

    // Eye grows from tiny as we scroll into section
    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'center center',
      scrub: 1.2,
      onUpdate(self) {
        const scale = gsap.utils.mapRange(0, 1, 0.06, 1, self.progress)
        gsap.set(eyeWrap, { scale })
        if (eyeUniforms.current) {
          eyeUniforms.current.uOpenProgress.value = gsap.utils.mapRange(0, 1, 0.05, 0.7, self.progress)
        }
      },
    }))

    // Wink + content reveal
    triggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'center center',
      once: true,
      onEnter: () => {
        if (winkDoneRef.current) return
        winkDoneRef.current = true

        // All 5 accent colours flash through
        const accentSeq = gsap.timeline({ delay: 0.3 })
        PHASE_ACCENTS.forEach((phase, i) => {
          accentSeq.call(() => {
            document.documentElement.style.setProperty('--accent', phase.color)
            document.documentElement.style.setProperty('--accent-glow', phase.glow)
          }, [], i * 0.18)
        })

        // Wink
        const winkTl = gsap.timeline({ delay: 0.8 })
        winkTl
          .to(eyelid, { scaleY: 1, duration: 0.14, ease: 'power2.in', transformOrigin: 'top' })
          .to(eyelid, { scaleY: 0.25, duration: 0.18, ease: 'power2.out', transformOrigin: 'top' })
          .to(eyelid, { scaleY: 0, duration: 0.25, ease: 'power1.out', transformOrigin: 'top' })

        if (eyeUniforms.current) {
          gsap.to(eyeUniforms.current.uOpenProgress, { value: 1, duration: 1.5, delay: 1.0, ease: 'iris' })
        }

        // Content entrance — SplitText
        const split = new SplitText(heading, { type: 'lines,words', linesClass: 'clip-line' })
        gsap.set(split.words, { y: '115%', opacity: 0 })

        gsap.to(split.words, {
          y: '0%',
          opacity: 1,
          duration: 0.9,
          stagger: 0.055,
          ease: 'power3.out',
          delay: 1.2,
        })

        const otherEls = content.querySelectorAll<HTMLElement>('p, .cta-row')
        gsap.from(otherEls, {
          opacity: 0,
          y: 28,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power2.out',
          delay: 1.6,
        })
      },
    }))

    return () => triggers.forEach(t => t.kill())
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-9"
      className="relative w-full min-h-screen bg-[#050508] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background eye */}
      <div
        ref={eyeWrapRef}
        className="absolute inset-0"
        style={{ transform: 'scale(0.06)', transformOrigin: 'center', willChange: 'transform' }}
      >
        <ChameleonEye
          particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 120}
          onReady={handleEyeReady}
        />
      </div>

      {/* Eyelid for wink */}
      <div
        ref={eyelidRef}
        className="absolute inset-0 bg-[#050508] pointer-events-none z-20"
        style={{ transform: 'scaleY(0)', transformOrigin: 'top' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.2) 0%, rgba(5,5,8,0.65) 55%, #050508 100%)',
        }}
      />

      {/* Content */}
      <div ref={contentRef} className="relative z-30 text-center px-8">
        <span className="font-mono text-xs tracking-[0.3em] text-[#52525B] uppercase block mb-10">
          §9 — The Closing
        </span>

        <h2
          ref={headingRef}
          className="font-display font-black text-[clamp(40px,8vw,96px)] text-[#FAFAFA] tracking-[-0.03em] leading-none mb-6 overflow-hidden"
        >
          Give Your AI<br />
          <span
            style={{
              background: 'linear-gradient(135deg, #00FF88, #8B5CF6, #F59E0B, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            a Memory.
          </span>
        </h2>

        <p className="text-[#A1A1AA] text-xl max-w-lg mx-auto mb-12 leading-relaxed">
          Join thousands of developers who never lose context again.
        </p>

        <div className="cta-row flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#section-7"
            className="btn-magnetic w-full sm:w-auto px-10 py-5 font-bold text-base tracking-widest uppercase text-[#050508]"
            style={{
              background: 'linear-gradient(135deg, #00FF88, #8B5CF6)',
              borderRadius: '2px',
            }}
          >
            Get Started Free
          </a>
          <a
            href="https://github.com/tryangle/cameleon"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-magnetic w-full sm:w-auto px-10 py-5 border border-[rgba(255,255,255,0.12)] text-[#FAFAFA] font-medium text-base tracking-widest uppercase hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            style={{ borderRadius: '2px' }}
          >
            ★ View on GitHub
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 px-8 py-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              backgroundColor: 'var(--accent)',
            }}
          />
          <span className="font-display font-bold text-sm text-[#FAFAFA]">CAMELEON</span>
          <span className="text-[#3F3F46] text-xs font-mono">by Tryangle</span>
        </div>
        <nav className="flex items-center gap-6">
          {['Docs', 'GitHub', 'Discord', 'Privacy'].map(item => (
            <a
              key={item}
              href="#"
              className="font-mono text-xs text-[#3F3F46] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
            >
              {item}
            </a>
          ))}
        </nav>
      </footer>

      <style>{`.clip-line { overflow: hidden; display: block; }`}</style>
    </section>
  )
}
