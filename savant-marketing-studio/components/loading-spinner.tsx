'use client'

import { motion } from 'framer-motion'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeValues = {
    sm: 16,
    md: 32,
    lg: 48
  }

  const sizeInPx = sizeValues[size]

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="border-4 border-mid-gray border-t-red-primary rounded-full"
        style={{ width: sizeInPx, height: sizeInPx }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-surface rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <div className="h-32" />
    </motion.div>
  )
}
