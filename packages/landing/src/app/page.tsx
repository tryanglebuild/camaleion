'use client'

import { useEffect } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { SolutionSection } from '@/components/sections/SolutionSection'
import { MechanismSection } from '@/components/sections/MechanismSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { DemoSection } from '@/components/sections/DemoSection'
import { InstallSection } from '@/components/sections/InstallSection'
import { SignalSection } from '@/components/sections/SignalSection'
import { CTASection } from '@/components/sections/CTASection'
import { SectionTransition } from '@/components/ui/SectionTransition'
import { useChromaticShift } from '@/components/animations/useChromaticShift'
import { generateNoiseDataURL } from '@/lib/generate-noise'

export default function Home() {
  useChromaticShift()

  useEffect(() => {
    // Apply noise grain
    const noise = generateNoiseDataURL(200, 0.025)
    if (noise) {
      document.body.style.setProperty('--noise-url', `url(${noise})`)
    }
    import('@/lib/gsap-setup').catch(() => {})
  }, [])

  return (
    <main className="relative bg-[#050508]">
      <NavBar />

      <HeroSection />

      <SectionTransition from="§1" to="§2" label="Origin → The Forgetting" />
      <ProblemSection />

      <SectionTransition from="§2" to="§3" label="The Forgetting → The Remembering" />
      <SolutionSection />

      <SectionTransition from="§3" to="§4" label="The Remembering → The Mechanism" />
      <MechanismSection />

      <SectionTransition from="§4" to="§5" label="The Mechanism → The Spectrum" />
      <FeaturesSection />

      <SectionTransition from="§5" to="§6" label="The Spectrum → The Proof" />
      <DemoSection />

      <SectionTransition from="§6" to="§7" label="The Proof → Install" />
      <InstallSection />

      <SectionTransition from="§7" to="§8" label="Install → The Signal" />
      <SignalSection />

      <SectionTransition from="§8" to="§9" label="The Signal → The Closing" />
      <CTASection />
    </main>
  )
}
