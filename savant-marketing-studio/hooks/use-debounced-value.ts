import { useState, useEffect, useRef } from 'react'

/**
 * Hook that debounces a value
 * Returns the debounced value that only updates after delay
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for debounced callbacks
 * The callback only fires after the user stops calling it for `delay` ms
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }) as T
}

/**
 * Hook for form inputs with local state + debounced sync
 * Provides instant UI updates while debouncing the actual onChange
 */
export function useDebouncedInput(
  externalValue: string,
  onExternalChange: (value: string) => void,
  delay: number = 300
) {
  const [localValue, setLocalValue] = useState(externalValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local value when external value changes (e.g., form reset)
  useEffect(() => {
    setLocalValue(externalValue)
  }, [externalValue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = (newValue: string) => {
    // Update local state immediately (instant UI feedback)
    setLocalValue(newValue)

    // Debounce the external onChange
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onExternalChange(newValue)
    }, delay)
  }

  return {
    value: localValue,
    onChange: handleChange,
  }
}

