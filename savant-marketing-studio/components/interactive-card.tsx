'use client'

import { useRef, useState, MouseEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface InteractiveCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function InteractiveCard({ children, className = '', onClick }: InteractiveCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative bg-surface rounded-xl border border-white/10 overflow-hidden',
        'cursor-pointer hover:shadow-lg transition-shadow duration-150',
        className
      )}
      whileHover={cardHover}
      whileTap={cardTap}
      onClick={onClick}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  )
}

