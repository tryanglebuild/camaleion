'use client'
import { useState, useEffect } from 'react'

interface TypewriterOptions {
  delay?: number   // seconds to wait before starting
  speed?: number   // ms per character
  enabled?: boolean
}

export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const { delay = 0, speed = 28, enabled = true } = options
  const [displayed, setDisplayed] = useState(enabled ? '' : text)
  const [done, setDone] = useState(!enabled)

  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let timeoutId: ReturnType<typeof setTimeout>
    let intervalId: ReturnType<typeof setInterval>

    timeoutId = setTimeout(() => {
      let i = 0
      intervalId = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(intervalId); setDone(true) }
      }, speed)
    }, delay * 1000)

    return () => { clearTimeout(timeoutId); clearInterval(intervalId) }
  }, [text, delay, speed, enabled])

  return { displayed, done }
}
