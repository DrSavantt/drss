'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  isLoading?: boolean
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', isLoading = false, className, disabled, type = 'button', onClick }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center rounded-md text-sm font-medium 
      transition-colors focus-visible:outline-none 
      focus-visible:ring-2 focus-visible:ring-rose-500/50 
      focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10]
      disabled:opacity-50 disabled:pointer-events-none
      h-9 px-4 py-2
    `

    const variants = {
      primary: 'bg-[#E11D48] text-white shadow-premium-sm hover:bg-[#BE123C]',
      secondary: 'bg-surface text-white border border-white/10 hover:bg-surface-highlight',
      ghost: 'hover:bg-white/5 text-slate-300 hover:text-white',
      outline: 'border border-white/20 text-white hover:bg-white/5',
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        disabled={isLoading || disabled}
        className={cn(baseStyles, variants[variant], className)}
      >
        {isLoading ? (
          <>
            {/* Preserve width while loading */}
            <span className="opacity-0">{children}</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
