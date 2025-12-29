'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className="rounded-lg p-2 hover:bg-dark-gray transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-pure-white" />
      ) : (
        <Moon className="h-5 w-5 text-pure-black" />
      )}
    </button>
  )
}
