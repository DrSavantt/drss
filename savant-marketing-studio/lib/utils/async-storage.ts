/**
 * Async wrapper for localStorage to prevent main thread blocking
 * Uses requestIdleCallback when available, falls back to setTimeout
 */

type StorageValue = string | number | boolean | object | null

// Check if we're in browser
const isBrowser = typeof window !== 'undefined'

// Use requestIdleCallback if available, otherwise setTimeout
const scheduleTask = isBrowser && 'requestIdleCallback' in window
  ? (window as any).requestIdleCallback
  : (cb: () => void) => setTimeout(cb, 1)

/**
 * Get item from localStorage (async, non-blocking)
 */
export async function getStorageItem<T = string>(key: string): Promise<T | null> {
  if (!isBrowser) return null
  
  return new Promise((resolve) => {
    scheduleTask(() => {
      try {
        const item = localStorage.getItem(key)
        if (item === null) {
          resolve(null)
          return
        }
        
        // Try to parse as JSON, fall back to string
        try {
          resolve(JSON.parse(item) as T)
        } catch {
          resolve(item as unknown as T)
        }
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error)
        resolve(null)
      }
    })
  })
}

/**
 * Set item in localStorage (async, non-blocking)
 */
export async function setStorageItem(key: string, value: StorageValue): Promise<void> {
  if (!isBrowser) return
  
  return new Promise((resolve) => {
    scheduleTask(() => {
      try {
        const stringValue = typeof value === 'string' 
          ? value 
          : JSON.stringify(value)
        localStorage.setItem(key, stringValue)
        resolve()
      } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error)
        resolve()
      }
    })
  })
}

/**
 * Remove item from localStorage (async, non-blocking)
 */
export async function removeStorageItem(key: string): Promise<void> {
  if (!isBrowser) return
  
  return new Promise((resolve) => {
    scheduleTask(() => {
      try {
        localStorage.removeItem(key)
        resolve()
      } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error)
        resolve()
      }
    })
  })
}

/**
 * Sync versions for cases where you absolutely need immediate access
 * (Use sparingly - these block the main thread)
 */
export function getStorageItemSync<T = string>(key: string): T | null {
  if (!isBrowser) return null
  
  try {
    const item = localStorage.getItem(key)
    if (item === null) return null
    
    try {
      return JSON.parse(item) as T
    } catch {
      return item as unknown as T
    }
  } catch {
    return null
  }
}

export function setStorageItemSync(key: string, value: StorageValue): void {
  if (!isBrowser) return
  
  try {
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value)
    localStorage.setItem(key, stringValue)
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error)
  }
}

