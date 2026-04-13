export const COLORS = {
  void: '#050508',
  surface1: '#0A0A12',
  surface2: '#12121F',
  surface3: '#1A1A2E',
  border: 'rgba(255,255,255,0.06)',
  borderHov: 'rgba(255,255,255,0.12)',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  textMuted: '#3F3F46',
} as const

export const PHASE_ACCENTS = [
  { hue: 150, color: '#00FF88', glow: 'rgba(0,255,136,0.15)', name: 'emerald' },
  { hue: 260, color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)', name: 'violet' },
  { hue: 38,  color: '#F59E0B', glow: 'rgba(245,158,11,0.15)',  name: 'amber' },
  { hue: 192, color: '#06B6D4', glow: 'rgba(6,182,212,0.15)',   name: 'cyan' },
  { hue: 350, color: '#F43F5E', glow: 'rgba(244,63,94,0.15)',   name: 'rose' },
] as const

export type PhaseName = (typeof PHASE_ACCENTS)[number]['name']

export const CHROMATIC_GRADIENT = 'linear-gradient(135deg, #00FF88, #8B5CF6, #F59E0B, #06B6D4)'

export const BREAKPOINTS = {
  mobile: 767,
  tablet: 1023,
  desktop: 1024,
} as const

export const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const
