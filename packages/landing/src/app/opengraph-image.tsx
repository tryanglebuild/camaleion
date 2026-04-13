import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CAMELEON — AI Memory Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#050508',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Diamond eye icon */}
        <div
          style={{
            width: 80,
            height: 80,
            background: '#00FF88',
            transform: 'rotate(45deg)',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(0,255,136,0.4)',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #00FF88, #8B5CF6, #F59E0B, #06B6D4)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          CAMELEON
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#A1A1AA',
            letterSpacing: '0',
          }}
        >
          AI Memory Platform — Persistent. Semantic. Multi-agent.
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #00FF88, #8B5CF6, #F59E0B, #06B6D4)',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
