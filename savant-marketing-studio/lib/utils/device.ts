'use client'

import { useState, useEffect } from 'react'

export function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export function isTablet() {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

export function isDesktop() {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}

// Hook version
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setDeviceType('mobile')
      else if (window.innerWidth < 1024) setDeviceType('tablet')
      else setDeviceType('desktop')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceType
}

