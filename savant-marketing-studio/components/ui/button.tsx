'use client'

import { forwardRef } from 'react'
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
      focus-visible:ring-2 focus-visible:ring-red-primary/50 
      focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:pointer-events-none
      h-11 md:h-10 px-4 py-2
      active:opacity-80
    `

    const variants = {
      primary: 'bg-red-primary text-foreground shadow-premium-sm hover:bg-red-dark',
      secondary: 'bg-surface text-foreground border border-white/10 hover:bg-surface-highlight',
      ghost: 'hover:bg-surface text-silver hover:text-foreground',
      outline: 'border border-white/20 text-foreground hover:bg-surface',
    }

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
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
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
