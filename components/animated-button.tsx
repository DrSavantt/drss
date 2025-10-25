'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { buttonHover, buttonTap } from '@/lib/animations'

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
  const baseStyles = 'px-6 py-3 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-coral text-white shadow-lg shadow-coral/20 hover:bg-coral-dark',
    secondary: 'border-2 border-slate-700 text-white hover:border-coral',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-900'
  }

  return (
    <motion.button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={disabled ? undefined : buttonHover}
      whileTap={disabled ? undefined : buttonTap}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

