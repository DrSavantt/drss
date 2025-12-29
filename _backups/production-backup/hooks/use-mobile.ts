'use client'

import { useEffect, useState } from 'react'

export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  // Return false during SSR and initial render to prevent hydration mismatch
  // This ensures server and initial client render are identical
  if (!mounted) {
    return false
  }

  return isMobile
}

// Additional utility exports
export function useScreenSize() {
  const [mounted, setMounted] = useState(false)
  const [screenSize, setScreenSize] = useState({
    width: 1024, // Default to desktop width to prevent layout shift
    height: 768,
  })

  useEffect(() => {
    setMounted(true)
    
    // Set actual size on mount
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Return desktop defaults during SSR to prevent hydration mismatch
  // Most layouts are desktop-first, so this prevents initial layout shift
  if (!mounted) {
    return {
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    }
  }

  return {
    ...screenSize,
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
  }
}
