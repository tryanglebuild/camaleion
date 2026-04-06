// Shared animation variants for Framer Motion (Hero only)
export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const slideFromRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
};

export const slideFromLeft = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
};
