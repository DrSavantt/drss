'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InteractiveCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function InteractiveCard({ children, className = '', onClick }: InteractiveCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface rounded-xl border border-white/10 overflow-hidden',
        'cursor-pointer hover:shadow-lg hover:border-white/20 transition-all duration-200 active:opacity-90',
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-full">{children}</div>
    </div>
  )
}

