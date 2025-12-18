/**
 * Animation configurations and variants for Framer Motion
 * Following Linear-style physics-based motion
 */

import type { Variants, Easing } from 'framer-motion'

// Spring transition configs
export const springTransitions = {
  // Micro interactions (buttons, toggles)
  springMicro: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 1,
  },
  
  // Medium interactions (modals, panels)
  springMedium: {
    type: "spring" as const,
    stiffness: 350,
    damping: 35,
    mass: 1,
  },
  
  // Slow interactions (page transitions)
  springSlow: {
    type: "spring" as const,
    stiffness: 250,
    damping: 30,
    mass: 1,
  },
}

// Framer Motion variants for staggered animations - smooth, no flicker
export const containerVariants = {
  hidden: { opacity: 1 }, // Start visible to prevent flash
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0.8, y: 6 }, // Start mostly visible
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Additional utility variants - smoother
export const fadeInVariant = {
  hidden: { opacity: 0.9 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  },
}

export const slideUpVariant = {
  hidden: { opacity: 0.8, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
  },
}

export const scaleInVariant = {
  hidden: { opacity: 0.9, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  },
}

// Legacy exports - scale animations removed for mobile performance
export const buttonHover = {}
export const buttonTap = {}
export const cardHover = {}
export const cardTap = {}

// Premium smooth easing - feels luxurious on mobile
const smoothEase: Easing = [0.25, 0.1, 0.25, 1] // Smooth cubic bezier

export const metroSlideVariants: Variants = {
  hidden: { opacity: 0.8, x: -8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: smoothEase
    }
  }
}

// Container with NO initial opacity change to prevent flicker
export const metroContainerVariants: Variants = {
  hidden: { opacity: 1 }, // Start visible to prevent flash
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Slower, smoother stagger
      delayChildren: 0
    }
  }
}

// Items fade in smoothly from nearly-visible state
export const metroItemVariants: Variants = {
  hidden: { opacity: 0.7, y: 8 }, // Start mostly visible, slight offset
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35, // Slower, smoother
      ease: smoothEase
    }
  }
}

// Tile flip animation
export const tileFlipVariants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 }
}

// Tile hover lift - smooth and subtle
export const metroTileHover = { 
  y: -2, // Subtle lift
  transition: { duration: 0.25, ease: smoothEase } 
}

export const metroTileTap = { 
  transition: { duration: 0.15, ease: smoothEase }
}
