'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { setStorageItem, getStorageItemSync } from '@/lib/utils/async-storage'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get initial theme from localStorage or default to dark
    // Use sync version here to prevent flash of wrong theme
    const stored = getStorageItemSync<Theme>('theme')
    const initialTheme = stored || 'dark'
    
    setTheme(initialTheme)
    setMounted(true)
    
    // Apply theme class immediately
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(initialTheme)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Save to localStorage (async, non-blocking)
    setStorageItem('theme', theme)
    
    // Apply theme class
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      return newTheme
    })
  }

  // Prevent flash of unstyled content - show children immediately
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
