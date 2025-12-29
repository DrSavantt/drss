import { getArchivedClients } from '@/app/actions/clients'
import { ArchiveList } from '@/components/archive/archive-list'

export default async function ArchivePage() {
  const archivedClients = await getArchivedClients()
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Archive</h1>
        <p className="text-muted-foreground mt-1">
          Deleted items are kept here for 30 days before permanent deletion.
        </p>
      </div>
      
      <ArchiveList clients={archivedClients} />
    </div>
  )
}

