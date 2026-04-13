import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CAMELEON — AI Memory Platform',
  description: 'Give your AI coding assistant persistent memory, semantic search, and multi-agent orchestration. Works with Claude Code, GitHub Copilot, and any MCP client.',
  keywords: ['AI', 'memory', 'MCP', 'Claude Code', 'GitHub Copilot', 'semantic search', 'multi-agent'],
  openGraph: {
    title: 'CAMELEON — AI Memory Platform',
    description: 'Give your AI persistent memory.',
    url: 'https://cameleon.dev',
    siteName: 'CAMELEON',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAMELEON — AI Memory Platform',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#050508] text-[#FAFAFA] antialiased overflow-x-hidden">
        <Providers>
          {/* Scroll progress bar */}
          <div id="scroll-progress" style={{ width: '100%' }} />
          {children}
        </Providers>
      </body>
    </html>
  )
}
