import type { MemoryCardData, MemoryCardType } from '@/lib/types'

const TYPE_COLORS: Record<MemoryCardType, string> = {
  DECISION: '#8B5CF6',
  BUG:      '#F43F5E',
  PERSON:   '#06B6D4',
  TASK:     '#F59E0B',
  NOTE:     '#A1A1AA',
  IDEA:     '#00FF88',
  LOG:      '#52525B',
}

interface MemoryCardProps {
  card: MemoryCardData
  className?: string
  corrupted?: boolean
}

export function MemoryCard({ card, className = '', corrupted = false }: MemoryCardProps) {
  const color = TYPE_COLORS[card.type]

  return (
    <div
      className={`memory-card bg-[#12121F] border border-[rgba(255,255,255,0.06)] p-4 font-mono text-xs ${className}`}
      style={{ borderRadius: 0 }}
      data-card-id={card.id}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] tracking-widest uppercase px-2 py-0.5 border"
          style={{ color, borderColor: color, backgroundColor: `${color}15` }}
        >
          {card.type}
        </span>
        {card.timestamp && (
          <span className="text-[#3F3F46] text-[10px]">{card.timestamp}</span>
        )}
      </div>
      <div className={`text-[#FAFAFA] text-xs font-medium mb-1 leading-tight ${corrupted ? 'opacity-30' : ''}`}>
        {card.title}
      </div>
      <div className={`text-[#A1A1AA] text-[11px] leading-relaxed line-clamp-3 ${corrupted ? 'opacity-20' : ''}`}>
        {card.content}
      </div>
      {card.project && (
        <div className="mt-2 text-[#3F3F46] text-[10px]">
          ◎ {card.project}
        </div>
      )}
    </div>
  )
}
