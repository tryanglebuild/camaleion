'use client'
import { ToastProvider } from '@/components/ui/Toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
