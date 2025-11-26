'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              type === 'success'
                ? 'bg-emerald-900/90 border-emerald-700 backdrop-blur-sm'
                : 'bg-red-900/90 border-red-700 backdrop-blur-sm'
            }`}
          >
            <div className="flex-shrink-0">
              {type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-sm font-medium text-white flex-1">{message}</p>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
