// Efatha Connect Motion System Tokens
// Centralized springs, durations, and variants for motion/react

export const springs = {
  snappy: { type: 'spring' as const, stiffness: 180, damping: 22, mass: 1 },
  gentle: { type: 'spring' as const, stiffness: 160, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 200, damping: 12 },
  drawer: { type: 'spring' as const, stiffness: 180, damping: 24 },
};

export const durations = {
  instant: 0.15,
  fast: 0.3,
  base: 0.4,
  slow: 0.5,
};

export const variants = {
  fadeSlideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
  fadeScaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  backdropFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  modalPanel: {
    initial: { opacity: 0, scale: 0.92, y: 24 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 12 },
  },
  shake: {
    x: [0, -6, 6, -6, 6, -3, 0],
    transition: { duration: 0.5 },
  },
  celebration: {
    initial: { scale: 0, rotate: -45 },
    animate: { scale: 1.2, rotate: 0 },
    exit: { scale: 0, opacity: 0 },
  },
};
