import { useEffect, useRef, useCallback } from 'react'

interface UseIntervalOptions {
  /** Run callback immediately on mount */
  immediate?: boolean
  /** Only run when tab is visible (default: true) */
  pauseWhenHidden?: boolean
}

/**
 * Custom hook for setInterval with visibility awareness and proper cleanup.
 * Pauses the interval when the tab is hidden and optionally resumes immediately
 * when the tab becomes visible again.
 * 
 * This prevents wasted resources from polling in background tabs.
 * 
 * @param callback - Function to call on each interval tick
 * @param delay - Interval delay in milliseconds (null to pause)
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * // Poll for updates every 30 seconds, pause when tab is hidden
 * useIntervalWithVisibility(
 *   () => fetchUpdates(),
 *   30000,
 *   { immediate: true }
 * )
 * ```
 */
export function useIntervalWithVisibility(
  callback: () => void,
  delay: number | null,
  options: UseIntervalOptions = {}
): void {
  const { immediate = false, pauseWhenHidden = true } = options
  const savedCallback = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update ref when callback changes (avoids re-creating interval)
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Clear interval helper
  const clearIntervalSafe = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    // Don't set up interval if delay is null
    if (delay === null) return

    const tick = () => {
      // Only run if tab is visible (when pauseWhenHidden is true)
      if (pauseWhenHidden && document.hidden) {
        return
      }
      savedCallback.current()
    }
    
    // Run immediately if requested
    if (immediate && (!pauseWhenHidden || !document.hidden)) {
      savedCallback.current()
    }
    
    // Set up interval
    intervalRef.current = setInterval(tick, delay)
    
    // Visibility handler - run immediately when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden && pauseWhenHidden) {
        // Tab became visible - run callback immediately
        savedCallback.current()
      }
    }
    
    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibility)
    }
    
    // Cleanup
    return () => {
      clearIntervalSafe()
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }
  }, [delay, immediate, pauseWhenHidden, clearIntervalSafe])
}

/**
 * Custom hook for setTimeout with proper cleanup.
 * Automatically clears the timeout when component unmounts.
 * 
 * @param callback - Function to call after delay
 * @param delay - Delay in milliseconds (null to not schedule)
 * 
 * @example
 * ```tsx
 * // Show toast for 3 seconds
 * useTimeout(() => setShowToast(false), showToast ? 3000 : null)
 * ```
 */
export function useTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    // Don't set up timeout if delay is null
    if (delay === null) return

    timeoutRef.current = setTimeout(() => {
      savedCallback.current()
    }, delay)
    
    // Cleanup: clear timeout on unmount or delay change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [delay])
}

/**
 * Hook that returns a stable reference that tracks mounted state.
 * Use this for async operations that don't support AbortController.
 * 
 * @returns Ref object where .current is true when mounted, false when unmounted
 * 
 * @example
 * ```tsx
 * const isMountedRef = useIsMounted()
 * 
 * async function handleClick() {
 *   const result = await someServerAction()
 *   if (isMountedRef.current) {
 *     setData(result) // Safe - component is still mounted
 *   }
 * }
 * ```
 */
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  return isMountedRef
}

