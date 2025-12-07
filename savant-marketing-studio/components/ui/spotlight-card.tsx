'use client'

import { useRef, useState, MouseEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const SpotlightCard = ({ children, className = '', onClick }: SpotlightCardProps) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = () => {
    setOpacity(1)
  }

  const handleBlur = () => {
    setOpacity(0)
  }

  const handleMouseEnter = () => {
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border border-white/10 bg-surface overflow-hidden',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, var(--spotlight-color-start), var(--spotlight-color-mid), var(--spotlight-color-end) 40%)`,
          boxShadow: 'var(--spotlight-shadow)',
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
