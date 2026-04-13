'use client'

export function ScrollIndicator() {
  return (
    <div className="scroll-indicator flex flex-col items-center gap-2">
      <span className="text-[#3F3F46] font-mono text-[10px] tracking-widest uppercase">scroll</span>
      <div className="w-px h-12 bg-gradient-to-b from-[var(--accent)] to-transparent" />
      <div
        className="w-4 h-4 border border-[var(--accent)] rotate-45"
        style={{
          boxShadow: '0 0 8px var(--accent-glow)',
          animation: 'scrollBounce 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}
