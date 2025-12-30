'use client'

import { cn } from '@/lib/utils'

interface PulsingDotProps {
  color?: 'red' | 'green' | 'blue' | 'yellow'
  size?: 'sm' | 'md'
}

export function PulsingDot({ color = 'red', size = 'sm' }: PulsingDotProps) {
  const colorClass = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
  }[color]

  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'

  return (
    <span className={cn('relative flex', sizeClass)}>
      <span
        className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          colorClass
        )}
      />
      <span className={cn('relative inline-flex rounded-full', sizeClass, colorClass)} />
    </span>
  )
}

