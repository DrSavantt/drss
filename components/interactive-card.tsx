'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover, cardTap } from '@/lib/animations'

interface InteractiveCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function InteractiveCard({ children, className = '', onClick }: InteractiveCardProps) {
  return (
    <motion.div
      className={`
        bg-slate-900 rounded-xl border border-slate-800 
        cursor-pointer hover:shadow-lg transition-shadow duration-150
        ${className}
      `}
      whileHover={cardHover}
      whileTap={cardTap}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

