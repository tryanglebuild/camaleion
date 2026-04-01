export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {children}
    </div>
  )
}
