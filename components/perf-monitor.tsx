'use client'

import { useEffect, useState } from 'react'

// Performance monitor - DEV ONLY
export function PerfMonitor() {
  const [fps, setFps] = useState(60)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    setIsVisible(true)
    
    let lastTime = performance.now()
    let frames = 0
    let animationId: number

    const measureFPS = () => {
      frames++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)))
        frames = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-1 rounded text-sm font-mono z-50 border border-gray-700">
      <span className={fps < 50 ? 'text-red-400' : fps < 55 ? 'text-yellow-400' : 'text-green-400'}>
        {fps} FPS
      </span>
      {fps < 50 && <span className="ml-2">⚠️</span>}
    </div>
  )
}
