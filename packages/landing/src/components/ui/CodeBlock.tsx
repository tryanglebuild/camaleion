interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = 'bash', className = '' }: CodeBlockProps) {
  return (
    <div
      className={`bg-[#0A0A12] border border-[rgba(255,255,255,0.06)] ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[#52525B] font-mono text-[10px] tracking-widest uppercase">{language}</span>
      </div>
      <pre className="p-4 font-mono text-sm text-[#A1A1AA] overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}
