import { Variants } from 'framer-motion'

// Reusable animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] // Smooth easing
    }
  }
}

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const slideInFromLeft: Variants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  }
}

export const slideInFromRight: Variants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  }
}

// Interactive card states
export const cardHover = {
  scale: 1.02,
  y: -4,
  boxShadow: '0 20px 40px rgba(255, 107, 107, 0.1)',
  transition: { duration: 0.2 }
}

export const cardTap = {
  scale: 0.98,
  y: 0,
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  transition: { duration: 0.1 }
}

// Button states
export const buttonHover = {
  scale: 1.05,
  boxShadow: '0 8px 16px rgba(255, 107, 107, 0.3)',
  transition: { duration: 0.2 }
}

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 }
}

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
}

// Drag animation
export const dragItem = {
  scale: 1.05,
  rotate: 2,
  boxShadow: '0 16px 32px rgba(255, 107, 107, 0.2)',
  transition: { duration: 0.2 }
}

