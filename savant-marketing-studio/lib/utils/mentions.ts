export function parseMentions(
  text: string,
  clients: { id: string; name: string }[]
) {
  const clientMentions: string[] = []
  const tags: string[] = []

  // Find @ClientName mentions
  const words = text.split(/\s+/)
  words.forEach(word => {
    if (word.startsWith('@')) {
      const name = word.slice(1).toLowerCase()
      const client = clients.find(c => 
        c.name.toLowerCase().includes(name)
      )
      if (client && !clientMentions.includes(client.id)) {
        clientMentions.push(client.id)
      }
    }
    
    // Find #tags
    if (word.startsWith('#')) {
      const tag = word.slice(1).toLowerCase().replace(/[^a-z0-9]/g, '')
      if (tag && !tags.includes(tag)) {
        tags.push(tag)
      }
    }
  })

  return { mentioned_clients: clientMentions, tags }
}

export function highlightMentions(text: string) {
  let result = text
  // Highlight @mentions in blue/info color (supports spaces, parentheses, etc.)
  result = result.replace(/@([A-Za-z0-9][A-Za-z0-9\s\(\)&\-\.]*?)(?=\s|$|#|[,;!?])/g, '<span class="text-info font-semibold">@$1</span>')
  // Highlight #tags in red/primary color
  result = result.replace(/#(\w+)/g, '<span class="text-red-primary font-semibold">#$1</span>')
  return result
}

// Group entries by date for display
export function groupEntriesByDate<T extends { created_at: string }>(entries: T[]) {
  const groups: { label: string; entries: T[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayEntries: T[] = []
  const yesterdayEntries: T[] = []
  const thisWeekEntries: T[] = []
  const olderEntries: T[] = []

  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at)
    entryDate.setHours(0, 0, 0, 0)

    if (entryDate.getTime() === today.getTime()) {
      todayEntries.push(entry)
    } else if (entryDate.getTime() === yesterday.getTime()) {
      yesterdayEntries.push(entry)
    } else if (entryDate >= weekAgo) {
      thisWeekEntries.push(entry)
    } else {
      olderEntries.push(entry)
    }
  })

  if (todayEntries.length > 0) {
    groups.push({ label: '🕐 Today', entries: todayEntries })
  }
  if (yesterdayEntries.length > 0) {
    groups.push({ label: '🕐 Yesterday', entries: yesterdayEntries })
  }
  if (thisWeekEntries.length > 0) {
    groups.push({ label: '🕐 This Week', entries: thisWeekEntries })
  }
  if (olderEntries.length > 0) {
    groups.push({ label: '🕐 Older', entries: olderEntries })
  }

  return groups
}
