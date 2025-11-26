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
  result = result.replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>')
  result = result.replace(/#(\w+)/g, '<span class="text-purple-600 font-semibold">#$1</span>')
  return result
}

