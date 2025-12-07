/**
 * Animation configurations and variants for Framer Motion
 * Following Linear-style physics-based motion
 */

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

// Framer Motion variants for staggered animations
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransitions.springMicro,
  },
}

// Additional utility variants
export const fadeInVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const slideUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

// Legacy exports for backward compatibility
export const buttonHover = { scale: 1.02 }
export const buttonTap = { scale: 0.98 }
export const cardHover = { scale: 1.02, y: -2 }
export const cardTap = { scale: 0.98 }

// Metro-style animations (Windows Phone inspired)
export const metroSlideVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

// Metro stagger (faster than default)
export const metroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Faster stagger for Metro feel
      delayChildren: 0.05
    }
  }
}

export const metroItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

// Tile flip animation
export const tileFlipVariants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 }
}

// Tile hover lift (Metro tiles lift on hover)
export const metroTileHover = { 
  y: -4, 
  transition: { duration: 0.15 } 
}

export const metroTileTap = { 
  scale: 0.98,
  transition: { duration: 0.1 }
}
