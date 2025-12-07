'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { springTransitions } from '@/lib/animations'

interface AnimatedButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function AnimatedButton({ 
  children, 
  variant = 'primary', 
  onClick,
  className = '',
  type = 'button',
  disabled = false
}: AnimatedButtonProps) {
  const baseStyles = 'px-6 h-11 md:h-10 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  
  const variantStyles = {
    primary: 'bg-red-primary text-foreground shadow-premium-sm hover:bg-red-dark',
    secondary: 'bg-surface border border-white/10 text-foreground hover:bg-surface-highlight hover:border-red-primary',
    ghost: 'text-silver hover:text-foreground hover:bg-surface'
  }

  return (
    <motion.button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={springTransitions.springMicro}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}
