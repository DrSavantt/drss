'use client'

import { useState, useEffect } from 'react'
import { getAIBarContext, type AIBarContext } from '@/app/actions/context'

/**
 * Hook to fetch AI bar context data using the centralized server action.
 * Ensures consistent filtering (deleted items excluded) across all components.
 */
export function useAIBarContext() {
  const [context, setContext] = useState<AIBarContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAIBarContext()
      .then(setContext)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return {
    ...context,
    loading,
    error,
    // Provide empty arrays as fallbacks when loading
    clients: context?.clients || [],
    projects: context?.projects || [],
    contentAssets: context?.contentAssets || [],
    journalEntries: context?.journalEntries || [],
    writingFrameworks: context?.writingFrameworks || [],
    models: context?.models || [],
  }
}
