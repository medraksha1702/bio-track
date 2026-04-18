import type { Variants } from 'framer-motion'

// Fade in with slight upward motion
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// Fade in only
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

// Scale in with fade
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// Stagger container for children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

// Stagger item (child)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
}

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
}

// Table row animation
export const tableRow: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
}

// Chart animation (for Recharts)
export const chartAnimation = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
}

// Button hover animation
export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 }
}

export const buttonTap = {
  scale: 0.98
}

// Card hover animation
export const cardHover = {
  y: -2,
  transition: { duration: 0.2 }
}

// Icon hover animation
export const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: { duration: 0.2 }
}
