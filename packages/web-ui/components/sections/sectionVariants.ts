import type { Variants } from 'framer-motion'

// ── Section reveal: clipPath from left ────────────────────────────
// The entire section viewport reveals left→right on enter,
// collapses right→left on exit
export const sectionRevealVariants: Variants = {
  initial: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
  },
  animate: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: {
      clipPath: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
  exit: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
    transition: {
      clipPath: { duration: 0.32, ease: [0.55, 0, 0.78, 0], delay: 0.22 },
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

// ── Panel reveal: individual section panels ────────────────────────
export const panelRevealVariants: Variants = {
  initial: { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
  animate: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: {
      clipPath: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
      staggerChildren: 0.05,
      delayChildren: 0.22,
    },
  },
  exit: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
    transition: {
      clipPath: { duration: 0.22, ease: [0.55, 0, 0.78, 0] },
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
}

// ── Content item: fade + slide up ─────────────────────────────────
export const contentItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  exit: {
    opacity: 0, y: -6,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
}

// ── Row item: slide from left ──────────────────────────────────────
export const rowItemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0, x: 10,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
}

// ── Card item: fade + scale ────────────────────────────────────────
export const cardItemVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0, scale: 0.97, y: -4,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
}

// ── List wrapper: staggers rows ────────────────────────────────────
export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
}

// ── Grid wrapper: staggers cards ──────────────────────────────────
export const gridContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

// Legacy export — keep for backward compat in components not yet updated
export const sectionVariants = sectionRevealVariants
