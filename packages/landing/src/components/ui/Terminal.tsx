'use client'

import { useRef, useEffect, forwardRef } from 'react'

interface TerminalProps {
  title?: string
  lines?: string[]
  className?: string
  showCursor?: boolean
  children?: React.ReactNode
}

export const Terminal = forwardRef<HTMLDivElement, TerminalProps>(
  ({ title = 'terminal', lines = [], className = '', showCursor = true, children }, ref) => {
    const cursorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
      if (!showCursor || !cursorRef.current) return
      let visible = true
      const interval = setInterval(() => {
        visible = !visible
        if (cursorRef.current) {
          cursorRef.current.style.opacity = visible ? '1' : '0'
        }
      }, 530)
      return () => clearInterval(interval)
    }, [showCursor])

    return (
      <div
        ref={ref}
        className={`bg-[#0A0A12] border border-[rgba(255,255,255,0.06)] font-mono text-sm relative ${className}`}
        style={{ borderRadius: 0 }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[#52525B] text-xs tracking-widest uppercase">{title}</span>
        </div>
        {/* Body */}
        <div className="p-4 space-y-1 text-[#A1A1AA]">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[var(--accent)] select-none">{'>'}</span>
              <span className="text-[#FAFAFA]">{line}</span>
            </div>
          ))}
          {children}
          {showCursor && (
            <div className="flex gap-2 mt-1">
              <span className="text-[var(--accent)] select-none">{'>'}</span>
              <span ref={cursorRef} className="inline-block w-2 h-4 bg-[var(--accent)] align-middle" />
            </div>
          )}
        </div>
      </div>
    )
  },
)

Terminal.displayName = 'Terminal'
