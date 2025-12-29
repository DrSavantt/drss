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

  // Extract all @mentions from text
  // Match @[words] - captures multiple words including lowercase
  // Stops at punctuation (except parentheses), double space, or newline
  // Examples: @test client, @Maurice M, @Candy Business (IG Reel)
  const mentionRegex = /@([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*(?:\s*\([^)]+\))?)/g
  const mentions = [...text.matchAll(mentionRegex)].map(m => m[1].toLowerCase())

  // Match mentions to clients - find best match (longest matching name)
  mentions.forEach(mentionText => {
    // Try exact match first, then partial match
    let bestMatch: { id: string; name: string } | undefined
    
    // Exact match
    bestMatch = clients.find(c => c.name.toLowerCase() === mentionText)
    
    // If no exact match, find the client whose name is contained in the mention
    if (!bestMatch) {
      bestMatch = clients.find(c => mentionText.startsWith(c.name.toLowerCase()))
    }
    
    // If still no match, check if mention starts with client name
    if (!bestMatch) {
      bestMatch = clients.find(c => c.name.toLowerCase().startsWith(mentionText))
    }
    
    if (bestMatch && !clientMentions.includes(bestMatch.id)) {
      clientMentions.push(bestMatch.id)
    }
  })

  // Match mentions to projects
  if (projects) {
    mentions.forEach(mentionText => {
      let bestMatch: { id: string; name: string } | undefined
      bestMatch = projects.find(p => p.name.toLowerCase() === mentionText)
      if (!bestMatch) {
        bestMatch = projects.find(p => mentionText.startsWith(p.name.toLowerCase()))
      }
      if (!bestMatch) {
        bestMatch = projects.find(p => p.name.toLowerCase().startsWith(mentionText))
      }
      if (bestMatch && !projectMentions.includes(bestMatch.id)) {
        projectMentions.push(bestMatch.id)
      }
    })
  }

  // Match mentions to content
  if (content) {
    mentions.forEach(mentionText => {
      let bestMatch: { id: string; title: string } | undefined
      bestMatch = content.find(c => c.title.toLowerCase() === mentionText)
      if (!bestMatch) {
        bestMatch = content.find(c => mentionText.startsWith(c.title.toLowerCase()))
      }
      if (!bestMatch) {
        bestMatch = content.find(c => c.title.toLowerCase().startsWith(mentionText))
      }
      if (bestMatch && !contentMentions.includes(bestMatch.id)) {
        contentMentions.push(bestMatch.id)
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

export function highlightMentions(text: string, knownNames: string[] = []) {
  let result = text
  
  // Only highlight exact matches of known names
  if (knownNames.length > 0) {
    // Sort by length (longest first) to match longer names before shorter ones
    const sortedNames = [...knownNames].sort((a, b) => b.length - a.length)
    
    sortedNames.forEach(name => {
      // Escape special regex characters in the name
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match @name exactly (case insensitive), followed by word boundary or punctuation
      const nameRegex = new RegExp(`@(${escapedName})(?=\\s|$|[.,!?;:])`, 'gi')
      result = result.replace(nameRegex, '<span class="text-info font-semibold">@$1</span>')
    })
  }
  
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
