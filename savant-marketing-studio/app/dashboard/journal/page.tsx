// Server Component - fetches data at request time for instant loading
import { createClient } from '@/lib/supabase/server'
import { JournalContent } from '@/components/journal/journal-content'
import { 
  getJournalChatsWithEntries, 
  getOrCreateInbox 
} from '@/app/actions/journal'
import { getClients } from '@/app/actions/clients'
import { getAllProjects, getAllContentAssets } from '@/app/actions/content'

export const dynamic = 'force-dynamic'

// Helper: Extract @mentions from content
function extractMentions(content: string): string[] {
  return content.match(/@([^\s#@]+(?:\s+[^\s#@]+)*)/g)?.map((m) => m.slice(1).trim()) || []
}

export default async function JournalPage() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <JournalContent 
        initialChats={[]}
        initialClients={[]}
        initialProjects={[]}
        initialContentItems={[]}
      />
    )
  }

  // Fetch all data in parallel for maximum performance
  const [chatsData, clientsData, projectsData, contentData] = await Promise.all([
    getJournalChatsWithEntries().catch(() => []),
    getClients().catch(() => []),
    getAllProjects().catch(() => []),
    getAllContentAssets().catch(() => [])
  ])

  // If no chats exist, create an Inbox first
  let finalChatsData = chatsData
  if (chatsData.length === 0) {
    try {
      await getOrCreateInbox()
      finalChatsData = await getJournalChatsWithEntries()
    } catch (error) {
      console.error('Failed to create inbox:', error)
      finalChatsData = []
    }
  }

  // Transform chats with entries for the UI
  const transformedChats = finalChatsData.map((chat: any) => ({
    id: chat.id,
    name: chat.name,
    entries: (chat.entries || []).map((e: any) => ({
      id: e.id,
      content: e.content,
      timestamp: new Date(e.created_at),
      tags: e.tags || [],
      mentions: extractMentions(e.content),
      mentionedClientNames: [],
      is_pinned: e.is_pinned || false,
      is_converted: e.is_converted || false,
      converted_to_content_id: e.converted_to_content_id || null,
    }))
  }))

  // Transform clients for mention autocomplete
  const transformedClients = clientsData.map((c: any) => ({ 
    id: c.id, 
    name: c.name 
  }))

  // Transform projects for mention autocomplete
  const transformedProjects = projectsData.map((p: any) => {
    const clientName = Array.isArray(p.clients) && p.clients.length > 0 
      ? (p.clients[0] as any)?.name 
      : undefined
    return {
      id: p.id,
      name: p.name,
      clientName
    }
  })

  // Transform content for mention autocomplete
  const transformedContentItems = contentData.map((c: any) => {
    const clientName = Array.isArray(c.clients) && c.clients.length > 0 
      ? (c.clients[0] as any)?.name 
      : undefined
    return {
      id: c.id,
      title: c.title,
      clientName
    }
  })

  return (
    <JournalContent 
      initialChats={transformedChats}
      initialClients={transformedClients}
      initialProjects={transformedProjects}
      initialContentItems={transformedContentItems}
    />
  )
}
