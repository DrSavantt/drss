import { getArchivedClients } from '@/app/actions/clients'
import { getArchivedProjects } from '@/app/actions/projects'
import { getArchivedContent } from '@/app/actions/content'
import { getArchivedFrameworks } from '@/app/actions/frameworks'
import { getArchivedJournalEntries } from '@/app/actions/journal'
import { getArchivedConversations } from '@/app/actions/chat'
import { ArchiveList } from '@/components/archive/archive-list'

export default async function ArchivePage() {
  const [clients, projects, content, frameworks, journalEntries, aiChats] = await Promise.all([
    getArchivedClients(),
    getArchivedProjects(),
    getArchivedContent(),
    getArchivedFrameworks(),
    getArchivedJournalEntries(),
    getArchivedConversations(),
  ])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Archive</h1>
        <p className="text-muted-foreground mt-1">
          Deleted items are kept here for 30 days before permanent deletion.
        </p>
      </div>
      
      <ArchiveList 
        clients={clients}
        projects={projects}
        content={content}
        frameworks={frameworks}
        journalEntries={journalEntries}
        aiChats={aiChats}
      />
    </div>
  )
}
