'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

// Stripped spotlight effect - now just a plain card wrapper
export const SpotlightCard = ({ children, className = '', onClick }: SpotlightCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-white/10 bg-surface',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
