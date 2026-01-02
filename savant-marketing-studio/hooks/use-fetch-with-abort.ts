import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFetchOptions {
  immediate?: boolean
}

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Custom hook for fetch requests with automatic AbortController cleanup.
 * Prevents "state update on unmounted component" errors by aborting
 * in-flight requests when the component unmounts.
 * 
 * @param url - The URL to fetch
 * @param options - Configuration options
 * @returns Object with data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetchWithAbort<Client[]>('/api/clients')
 * ```
 */
export function useFetchWithAbort<T>(
  url: string,
  options: UseFetchOptions = { immediate: true }
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(options.immediate ?? true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url, { signal })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Only update state if not aborted
      if (!signal?.aborted) {
        setData(result)
      }
    } catch (err) {
      // Ignore abort errors - component unmounted
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      // Only set error if not aborted
      if (!signal?.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    } finally {
      // Only update loading if not aborted
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [url])

  useEffect(() => {
    if (!options.immediate) return
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    fetchData(abortController.signal)
    
    // Cleanup: abort on unmount or url change
    return () => {
      abortController.abort()
    }
  }, [fetchData, options.immediate])

  const refetch = useCallback(() => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    fetchData(abortController.signal)
  }, [fetchData])

  return { data, loading, error, refetch }
}

/**
 * Helper to create an AbortController with proper cleanup for use in custom fetch logic.
 * Returns both the controller and a cleanup function.
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   const { signal, cleanup } = createAbortController()
 *   
 *   async function loadData() {
 *     const res = await fetch('/api/data', { signal })
 *     if (!signal.aborted) {
 *       // update state
 *     }
 *   }
 *   
 *   loadData()
 *   return cleanup
 * }, [])
 * ```
 */
export function createAbortController() {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    cleanup: () => controller.abort(),
  }
}

