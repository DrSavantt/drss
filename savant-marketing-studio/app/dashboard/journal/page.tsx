import { getOrCreateInbox, getJournalChats, getJournalEntries } from '@/app/actions/journal'
import { getClients } from '@/app/actions/clients'
import { getAllProjects } from '@/app/actions/content'
import { JournalPageClient } from './journal-page-client'

export default async function JournalPage() {
  try {
    // Get or create default inbox and fetch all data in parallel
    const [inboxId, chats, clients, projects] = await Promise.all([
      getOrCreateInbox(),
      getJournalChats(),
      getClients(),
      getAllProjects()
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

    return (
      <JournalPageClient
        initialEntries={entries || []}
        chats={chats || []}
        clients={simpleClients}
        projects={simpleProjects}
        defaultChatId={inboxId}
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
