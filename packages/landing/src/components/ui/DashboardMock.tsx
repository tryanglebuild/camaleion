export function DashboardMock({ className = '' }: { className?: string }) {
  const entries = [
    { type: 'decision', title: 'Use JWT for auth', project: 'cameleon', color: '#8B5CF6', bg: '#8B5CF615' },
    { type: 'bug',      title: 'Memory leak in stream handler', project: 'cameleon', color: '#F43F5E', bg: '#F43F5E15' },
    { type: 'note',     title: 'bcrypt rounds = 12 for target hardware', project: 'cameleon', color: '#A1A1AA', bg: '#A1A1AA10' },
    { type: 'task',     title: 'Implement semantic search endpoint', project: 'cameleon', color: '#F59E0B', bg: '#F59E0B15' },
    { type: 'idea',     title: 'Multi-agent memory sharing via sessions', project: 'cameleon', color: '#00FF88', bg: '#00FF8815' },
    { type: 'decision', title: 'Supabase RLS for multi-tenant isolation', project: 'cameleon', color: '#8B5CF6', bg: '#8B5CF615' },
  ]

  return (
    <div
      className={`bg-[#0A0A12] border border-[rgba(255,255,255,0.06)] flex flex-col overflow-hidden ${className}`}
      style={{ borderRadius: 0 }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[var(--accent)] font-mono text-xs tracking-widest">◎ CAMELEON</span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
        <span className="text-[#3F3F46] font-mono text-[10px]">v1.4.2</span>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 bg-[#12121F] border border-[rgba(255,255,255,0.06)] px-3 py-1.5">
          <span className="text-[#3F3F46] text-xs">⌕</span>
          <span className="text-[#3F3F46] font-mono text-xs">search memory...</span>
        </div>
      </div>

      {/* Sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-28 border-r border-[rgba(255,255,255,0.06)] p-2 space-y-1 shrink-0">
          {['ENTRIES', 'PROJECTS', 'PEOPLE', 'RULES', 'ANALYZE'].map((item, i) => (
            <div
              key={item}
              className={`font-mono text-[9px] tracking-widest px-2 py-1.5 ${i === 0 ? 'text-[var(--accent)] bg-[var(--accent-glow)]' : 'text-[#52525B]'}`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-hidden p-2 space-y-1">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2 py-1.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            >
              <span
                className="text-[8px] tracking-widest uppercase px-1 py-0.5 shrink-0 mt-0.5"
                style={{ color: entry.color, backgroundColor: entry.bg }}
              >
                {entry.type}
              </span>
              <div className="min-w-0">
                <div className="text-[#FAFAFA] font-mono text-[10px] truncate">{entry.title}</div>
                <div className="text-[#3F3F46] font-mono text-[9px]">◎ {entry.project}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <span className="text-[#3F3F46] font-mono text-[9px]">847 entries · 5 projects</span>
        <span className="text-[var(--accent)] font-mono text-[9px]">● connected</span>
      </div>
    </div>
  )
}
