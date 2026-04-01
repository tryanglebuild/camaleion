export function ChameleonLogo({
  size = 26,
  color = 'currentColor',
  strokeWidth = 1.8,
}: {
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Curled tail */}
      <path
        d="M5 22 C2 20 1 25 4 27 C7 29 10 26 8 23 C7 21 5 21 5 22"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Body */}
      <path
        d="M8 21 C9 15 30 15 32 21 C34 27 26 33 17 33 C10 33 7 28 8 21 Z"
        stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round"
      />
      {/* Dorsal bumps */}
      <path
        d="M16 15 C17 12 19 12 20 15 M22 15 C23 12 25 12 26 15"
        stroke={color} strokeWidth={strokeWidth - 0.2} strokeLinecap="round" fill="none"
      />
      {/* Neck */}
      <path
        d="M30 18 C33 14 34 11 32 8"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none"
      />
      {/* Head */}
      <circle cx="30" cy="7" r="5.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
      {/* Eye ring + pupil */}
      <circle cx="32" cy="5" r="2" stroke={color} strokeWidth={strokeWidth - 0.4} fill="none" />
      <circle cx="32.5" cy="4.5" r="0.8" fill={color} />
      {/* Front legs */}
      <path d="M20 33 L17 39" stroke={color} strokeWidth={strokeWidth - 0.2} strokeLinecap="round" />
      <path d="M25 33 L27 39" stroke={color} strokeWidth={strokeWidth - 0.2} strokeLinecap="round" />
      {/* Back leg */}
      <path d="M12 31 L9 37" stroke={color} strokeWidth={strokeWidth - 0.2} strokeLinecap="round" />
    </svg>
  )
}
