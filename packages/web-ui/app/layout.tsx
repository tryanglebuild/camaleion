import type { Metadata } from 'next'
import { inter, spaceGrotesk, jetbrainsMono } from '@/lib/fonts'
import { AOSInit } from '@/lib/aos-init'
import './globals.css'

export const metadata: Metadata = {
  title: 'Camaleon',
  description: 'Persistent memory and semantic search for AI tools',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <body className="min-h-screen antialiased">
        <AOSInit />
        {children}
      </body>
    </html>
  )
}
