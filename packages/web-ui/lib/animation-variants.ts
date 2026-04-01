import type { Variants } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────
// BRAIN — Animation Variants
//
// Philosophy: every container grows from width=0 (scaleX: 0, originX: 0)
// then content inside loads in stagger order.
//
// Usage:
//   <motion.div variants={cardVariants} initial="hidden" animate="visible">
//     <motion.h2 variants={itemVariants}>Title</motion.h2>
//     <motion.p  variants={itemVariants}>Body</motion.p>
//   </motion.div>
// ─────────────────────────────────────────────────────────────────────

// ── Page wrapper — stagger all direct children ────────────────────────
export const pageVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

// ── Section wrapper (top-level sections) ─────────────────────────────
export const sectionContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

// ── Grow from left — CONTAINER ───────────────────────────────────────
// The box expands from 0→full on X axis (left-anchored).
// Children load in stagger after the container is mostly open.
export const growContainerVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.12 },
      staggerChildren: 0.055,
      delayChildren: 0.24,
    },
  },
}

// ── Grow — CARD (individual card in a grid) ──────────────────────────
// Custom index via `custom={i}` to stagger by position.
export const cardVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: (i = 0) => ({
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: { duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: i * 0.055 },
      opacity: { duration: 0.1, delay: i * 0.055 },
      staggerChildren: 0.05,
      delayChildren: 0.18 + i * 0.055,
    },
  }),
}

// ── Grid wrapper — staggers cardVariants children ─────────────────────
export const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.1 },
  },
}

// ── Item inside a container (text, badge, icon) ───────────────────────
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 7 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
}

// ── Stat card grow (with per-index delay) ─────────────────────────────
export const statVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: (i = 0) => ({
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 + i * 0.07 },
      opacity: { duration: 0.1, delay: 0.05 + i * 0.07 },
      staggerChildren: 0.045,
      delayChildren: 0.22 + i * 0.07,
    },
  }),
}

// ── Row in a list (slide from left) ─────────────────────────────────
export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
}

// ── List wrapper (staggers rows) ─────────────────────────────────────
export const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
}

// ── Fade + slide up (generic section header / title) ─────────────────
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
}

// ── Nav item (slide in from left with scale grow) ─────────────────────
export const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -6, scaleX: 0 },
  visible: {
    opacity: 1,
    x: 0,
    scaleX: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
}

// ── Nav container (staggers nav items) ───────────────────────────────
export const navContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.12 },
  },
}

// ── Modal (scale from center + stagger form fields) ──────────────────
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

// ── Backdrop ─────────────────────────────────────────────────────────
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

// ── Slide-over panel (from right) ────────────────────────────────────
export const slideOverVariants: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: 32,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}
