'use client'
import { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/Toaster'
import { syncConfigFromServer } from '@/lib/supabase'

function SupabaseInitializer() {
  useEffect(() => {
    syncConfigFromServer()
  }, [])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SupabaseInitializer />
      {children}
    </ToastProvider>
  )
}
