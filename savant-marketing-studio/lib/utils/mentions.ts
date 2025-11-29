export function parseMentions(
  text: string,
  clients: { id: string; name: string }[],
  projects?: { id: string; name: string }[],
  content?: { id: string; title: string }[]
) {
  const clientMentions: string[] = []
  const projectMentions: string[] = []
  const contentMentions: string[] = []
  const tags: string[] = []

  // Extract all @mentions from text using the same regex as highlighting
  const mentionRegex = /@([A-Za-z0-9][A-Za-z0-9\s\(\)&\-\.]*[A-Za-z0-9\)])/g
  const mentions = [...text.matchAll(mentionRegex)].map(m => m[1].toLowerCase())

  // Match mentions to clients
  mentions.forEach(mentionText => {
    const client = clients.find(c => 
      c.name.toLowerCase() === mentionText || 
      c.name.toLowerCase().includes(mentionText)
    )
    if (client && !clientMentions.includes(client.id)) {
      clientMentions.push(client.id)
    }
  })

  // Match mentions to projects
  if (projects) {
    mentions.forEach(mentionText => {
      const project = projects.find(p => 
        p.name.toLowerCase() === mentionText || 
        p.name.toLowerCase().includes(mentionText)
      )
      if (project && !projectMentions.includes(project.id)) {
        projectMentions.push(project.id)
      }
    })
  }

  // Match mentions to content
  if (content) {
    mentions.forEach(mentionText => {
      const contentItem = content.find(c => 
        c.title.toLowerCase() === mentionText || 
        c.title.toLowerCase().includes(mentionText)
      )
      if (contentItem && !contentMentions.includes(contentItem.id)) {
        contentMentions.push(contentItem.id)
      }
    })
  }
    
  // Find #tags
  const words = text.split(/\s+/)
  words.forEach(word => {
    if (word.startsWith('#')) {
      const tag = word.slice(1).toLowerCase().replace(/[^a-z0-9]/g, '')
      if (tag && !tags.includes(tag)) {
        tags.push(tag)
      }
    }
  })

  return { 
    mentioned_clients: clientMentions, 
    mentioned_projects: projectMentions,
    mentioned_content: contentMentions,
    tags 
  }
}

export function highlightMentions(text: string) {
  let result = text
  
  // Highlight @mentions in blue/info color
  // Match @[first word][optional additional CAPITALIZED words][optional parentheses content]
  // This stops at lowercase words (which are likely the continuation of the sentence)
  // Examples:
  // - @Greg → highlights "Greg"
  // - @Greg yo → highlights "Greg" (yo is lowercase, not part of mention)
  // - @Candy Business (IG Reel Content) yo → highlights "Candy Business (IG Reel Content)"
  result = result.replace(/@([A-Za-z0-9]+(?:\s+[A-Z0-9][A-Za-z0-9]*)*(?:\s*\([^)]+\))?)/g, '<span class="text-info font-semibold">@$1</span>')
  
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
