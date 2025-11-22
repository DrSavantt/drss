'use client'

import { useTheme } from '@/lib/theme-provider'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-colors"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" style={{ color: 'var(--accent-yellow)' }} />
      ) : (
        <Moon className="w-5 h-5" style={{ color: 'var(--accent-mint)' }} />
      )}
    </motion.button>
  )
}
