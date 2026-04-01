'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'loading' | 'success' | 'error'

const STEPS = [
  { label: 'Connecting to memory…', progress: 25 },
  { label: 'Loading context…',      progress: 55 },
  { label: 'Syncing vectors…',      progress: 80 },
  { label: 'Almost there…',         progress: 95 },
]

const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
}

export default function BootPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [step, setStep]   = useState(0)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [retrying, setRetrying] = useState(false)

  const runBoot = async () => {
    setPhase('loading')
    setStep(0)
    setProgress(0)
    setErrorMsg('')

    setProgress(STEPS[0].progress)
    await delay(350)

    setStep(1)
    setProgress(STEPS[1].progress)

    let result: { supabase?: { ok: boolean }; mcp?: { ok: boolean } } | null = null
    try {
      const res = await fetch('/api/health')
      result = await res.json()
    } catch { result = null }

    await delay(280)
    setStep(2)
    setProgress(STEPS[2].progress)
    await delay(280)

    const ok = result?.supabase?.ok && result?.mcp?.ok

    if (!ok) {
      const reasons = []
      if (!result?.supabase?.ok) reasons.push('Database unreachable')
      if (!result?.mcp?.ok)      reasons.push('MCP server not found')
      setErrorMsg(reasons.join(' · ') || 'Connection failed')
      setProgress(60)
      setPhase('error')
      return
    }

    setStep(3)
    setProgress(100)
    setPhase('success')
    await delay(600)
    router.push('/dashboard')
  }

  useEffect(() => { runBoot() }, [])

  const handleRetry = async () => { setRetrying(true); await runBoot(); setRetrying(false) }

  const stepLabel = phase === 'error' ? errorMsg : (STEPS[step]?.label ?? 'Loading…')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.18 } } }}
        initial="hidden"
        animate="show"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%', maxWidth: 300, padding: '0 24px', gap: 0,
        }}
      >
        {/* Logo mark */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.85 },
            show:   { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } },
          }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 13,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-space-grotesk)', fontSize: 15, fontWeight: 700,
            color: '#fff', letterSpacing: '0.02em',
            boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
          }}>CA</div>
        </motion.div>

        {/* Name */}
        <motion.h1
          variants={item}
          transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
          style={{
            fontFamily: 'var(--font-space-grotesk)', fontSize: 22, fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
            margin: '0 0 4px', textAlign: 'center',
          }}
        >
          Camaleon
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={item}
          transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
          style={{
            fontFamily: 'var(--font-inter)', fontSize: 13,
            color: 'var(--text-muted)', margin: '0 0 40px',
            textAlign: 'center', lineHeight: 1.5,
          }}
        >
          Your AI second brain
        </motion.p>

        {/* Progress bar */}
        <motion.div
          variants={item}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', marginBottom: 14 }}
        >
          <div style={{
            width: '100%', height: 3,
            background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
              style={{
                height: '100%', borderRadius: 2,
                background: phase === 'error' ? 'var(--status-blocked)' : 'var(--accent)',
              }}
            />
          </div>
        </motion.div>

        {/* Status text */}
        <motion.div
          variants={item}
          transition={{ duration: 0.3 }}
          style={{ height: 18, display: 'flex', alignItems: 'center' }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={stepLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: 'var(--font-inter)', fontSize: 12,
                color: phase === 'error' ? 'var(--status-blocked)' : 'var(--text-muted)',
                margin: 0, textAlign: 'center',
              }}
            >
              {stepLabel}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Error retry */}
        <AnimatePresence>
          {phase === 'error' && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              onClick={handleRetry}
              disabled={retrying}
              style={{
                marginTop: 24,
                fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500,
                padding: '8px 20px', borderRadius: 8,
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)', background: 'var(--surface-1)',
                cursor: retrying ? 'not-allowed' : 'pointer',
                opacity: retrying ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!retrying) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-1)' }}
            >
              {retrying ? 'Retrying…' : 'Try again'}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
