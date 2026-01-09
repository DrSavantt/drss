'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // On mount: sync React state with what inline script already set in DOM
  // This prevents the "two clicks required" bug where React state is 'dark'
  // but DOM class is 'light' (set by inline script from localStorage).
  // We read from DOM, not localStorage, because the inline script already handled that.
  useEffect(() => {
    const domTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setThemeState(domTheme)
    setMounted(true)
  }, [])

  // Apply theme class whenever theme changes
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Save to localStorage (direct string, no JSON.stringify)
    try {
      localStorage.setItem('theme', theme)
    } catch (e) {
      console.error('Failed to save theme:', e)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
