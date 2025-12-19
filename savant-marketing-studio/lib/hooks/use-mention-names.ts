'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to resolve mention UUIDs to actual names
 * Looks up both clients and projects tables
 */
export function useMentionNames(mentionIds: string[] | undefined) {
  const [names, setNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!mentionIds?.length) {
      setNames({})
      return
    }

    // Filter out any non-UUID strings (already names)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const uuidsToLookup = mentionIds.filter(id => uuidPattern.test(id))
    const alreadyNames = mentionIds.filter(id => !uuidPattern.test(id))

    // If no UUIDs to look up, just use the names as-is
    if (uuidsToLookup.length === 0) {
      const nameMap: Record<string, string> = {}
      alreadyNames.forEach(name => nameMap[name] = name)
      setNames(nameMap)
      return
    }

    const fetchNames = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const nameMap: Record<string, string> = {}

        // Add already-names
        alreadyNames.forEach(name => nameMap[name] = name)

        // Try clients first
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', uuidsToLookup)

        clients?.forEach(c => {
          nameMap[c.id] = c.name
        })

        // Try projects for any remaining IDs
        const remainingIds = uuidsToLookup.filter(id => !nameMap[id])
        if (remainingIds.length > 0) {
          const { data: projects } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', remainingIds)

          projects?.forEach(p => {
            nameMap[p.id] = p.name
          })
        }

        setNames(nameMap)
      } catch (error) {
        console.error('Failed to fetch mention names:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentionIds?.join(',')])

  return { names, isLoading }
}

/**
 * Get display name for a mention
 * If it's a UUID and we have a name, use the name
 * Otherwise return the original (might be a name already)
 */
export function getMentionDisplayName(
  mentionId: string, 
  names: Record<string, string>
): string {
  return names[mentionId] || mentionId
}

