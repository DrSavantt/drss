// Optimized animations - only hover/tap interactions, no entrance animations
// Focus on 60fps performance with transform and opacity only

// Subtle hover/tap interactions - optimized for 60fps
export const cardHover = {
  y: -2,  // Reduced from -4 for subtlety
  transition: { duration: 0.15 }  // Faster, feels instant
}

export const cardTap = {
  scale: 0.98,  // Subtle press feedback
  transition: { duration: 0.1 }
}

// Button interactions - minimal and fast
export const buttonHover = {
  scale: 1.02,  // Reduced from 1.05
  transition: { duration: 0.15 }
}

export const buttonTap = {
  scale: 0.98,  // Reduced from 0.95
  transition: { duration: 0.1 }
}

// Optimized drag - no rotation (expensive)
export const dragItem = {
  scale: 1.02,  // Reduced from 1.05
  transition: { duration: 0 }  // Instant feedback
}

