import { getOrCreateInbox, getJournalChats, getJournalEntries } from '@/app/actions/journal'
import { getClients } from '@/app/actions/clients'
import { getAllProjects, getAllContentAssets } from '@/app/actions/content'
import { getJournalFolders, getUnifiedJournalTimeline, getJournalCounts } from '@/app/actions/journal-folders'
import { JournalPageClient } from './journal-page-client'

export default async function JournalPage() {
  try {
    // Get or create default inbox and fetch all data in parallel
    const [inboxId, chats, clients, projects, content, folders, timeline, counts] = await Promise.all([
      getOrCreateInbox(),
      getJournalChats(),
      getClients(),
      getAllProjects(),
      getAllContentAssets(),
      getJournalFolders().catch(() => []), // Folders might not exist yet
      getUnifiedJournalTimeline().catch(() => []), // Timeline
      getJournalCounts().catch(() => ({ totalChats: 0, totalEntries: 0 }))
    ])
    
    // Get entries for the inbox by default
    const entries = await getJournalEntries(inboxId)

    // Transform projects to simple format
    const simpleProjects = projects.map(p => ({
      id: p.id,
      name: p.name
    }))

    // Transform clients to simple format
    const simpleClients = clients.map(c => ({
      id: c.id,
      name: c.name
    }))

    // Transform content to simple format (include file_url and asset_type for distinction)
    const simpleContent = content.map(c => ({
      id: c.id,
      title: c.title,
      file_url: c.file_url,
      asset_type: c.asset_type
    }))

    return (
      <JournalPageClient
        initialEntries={entries || []}
        chats={chats || []}
        clients={simpleClients}
        projects={simpleProjects}
        content={simpleContent}
        defaultChatId={inboxId}
        initialFolders={folders}
        initialTimeline={timeline}
        initialCounts={counts}
      />
    )
  } catch (error) {
    console.error('Journal page error:', error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Journal</h1>
        <p className="text-silver">Error loading journal. Please check your database connection.</p>
      </div>
    )
  }
}
