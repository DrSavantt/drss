'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  RotateCcw, 
  Trash2, 
  Users, 
  FolderKanban, 
  FileText, 
  BookOpen, 
  PenLine,
  Building2,
  Archive
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

import { restoreClient, permanentlyDeleteClient } from '@/app/actions/clients'
import { restoreProject, permanentlyDeleteProject } from '@/app/actions/projects'
import { restoreContentAsset, permanentlyDeleteContentAsset } from '@/app/actions/content'
import { restoreFramework, permanentlyDeleteFramework } from '@/app/actions/frameworks'
import { restoreJournalEntry, permanentlyDeleteJournalEntry } from '@/app/actions/journal'

interface ArchivedClient {
  id: string
  name: string
  email?: string | null
  website?: string | null
  deleted_at: string
}

interface ArchivedProject {
  id: string
  name: string
  status?: string | null
  deleted_at: string
  clients?: { id: string; name: string } | null
}

interface ArchivedContent {
  id: string
  title: string
  asset_type?: string | null
  deleted_at: string
  clients?: { id: string; name: string } | null
}

interface ArchivedFramework {
  id: string
  name: string
  category?: string | null
  description?: string | null
  deleted_at: string
}

interface ArchivedJournalEntry {
  id: string
  content: string
  deleted_at: string
}

interface ArchiveListProps {
  clients: ArchivedClient[]
  projects: ArchivedProject[]
  content: ArchivedContent[]
  frameworks: ArchivedFramework[]
  journalEntries: ArchivedJournalEntry[]
}

type EntityType = 'client' | 'project' | 'content' | 'framework' | 'journal'

interface DeleteConfirmState {
  id: string
  name: string
  type: EntityType
}

export function ArchiveList({ 
  clients, 
  projects, 
  content, 
  frameworks, 
  journalEntries 
}: ArchiveListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null)

  const totalCount = clients.length + projects.length + content.length + frameworks.length + journalEntries.length

  const handleRestore = async (id: string, type: EntityType) => {
    setLoading(id)
    try {
      let result
      switch (type) {
        case 'client':
          result = await restoreClient(id)
          break
        case 'project':
          result = await restoreProject(id)
          break
        case 'content':
          result = await restoreContentAsset(id)
          break
        case 'framework':
          result = await restoreFramework(id)
          break
        case 'journal':
          result = await restoreJournalEntry(id)
          break
      }
      
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Item restored successfully')
        router.refresh()
      }
    } catch {
      toast.error('Failed to restore item')
    }
    setLoading(null)
  }

  const handlePermanentDelete = async () => {
    if (!deleteConfirm) return
    
    setLoading(deleteConfirm.id)
    try {
      let result
      switch (deleteConfirm.type) {
        case 'client':
          result = await permanentlyDeleteClient(deleteConfirm.id)
          break
        case 'project':
          result = await permanentlyDeleteProject(deleteConfirm.id)
          break
        case 'content':
          result = await permanentlyDeleteContentAsset(deleteConfirm.id)
          break
        case 'framework':
          result = await permanentlyDeleteFramework(deleteConfirm.id)
          break
        case 'journal':
          result = await permanentlyDeleteJournalEntry(deleteConfirm.id)
          break
      }
      
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Item permanently deleted')
        router.refresh()
      }
    } catch {
      toast.error('Failed to delete item')
    }
    setLoading(null)
    setDeleteConfirm(null)
  }

  if (totalCount === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Archive is empty</h3>
          <p className="text-muted-foreground">
            Deleted items will appear here for recovery.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="clients" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clients</span>
            <span className="text-xs text-muted-foreground">({clients.length})</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2 py-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
            <span className="text-xs text-muted-foreground">({projects.length})</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
            <span className="text-xs text-muted-foreground">({content.length})</span>
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="flex items-center gap-2 py-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Frameworks</span>
            <span className="text-xs text-muted-foreground">({frameworks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2 py-2">
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Journal</span>
            <span className="text-xs text-muted-foreground">({journalEntries.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <EntityList
            items={clients}
            type="client"
            icon={Building2}
            getTitle={(item) => item.name}
            getMetadata={(item) => item.email ? [item.email] : []}
            loading={loading}
            onRestore={handleRestore}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <EntityList
            items={projects}
            type="project"
            icon={FolderKanban}
            getTitle={(item) => item.name}
            getMetadata={(item) => {
              const meta = []
              if (item.clients?.name) meta.push(`Client: ${item.clients.name}`)
              if (item.status) meta.push(`Status: ${item.status}`)
              return meta
            }}
            loading={loading}
            onRestore={handleRestore}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <EntityList
            items={content}
            type="content"
            icon={FileText}
            getTitle={(item) => item.title}
            getMetadata={(item) => {
              const meta = []
              if (item.clients?.name) meta.push(`Client: ${item.clients.name}`)
              if (item.asset_type) meta.push(`Type: ${item.asset_type}`)
              return meta
            }}
            loading={loading}
            onRestore={handleRestore}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="frameworks" className="mt-4">
          <EntityList
            items={frameworks}
            type="framework"
            icon={BookOpen}
            getTitle={(item) => item.name}
            getMetadata={(item) => {
              const meta = []
              if (item.category) meta.push(`Category: ${item.category}`)
              return meta
            }}
            loading={loading}
            onRestore={handleRestore}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <EntityList
            items={journalEntries}
            type="journal"
            icon={PenLine}
            getTitle={(item) => item.content.slice(0, 100) + (item.content.length > 100 ? '...' : '')}
            getMetadata={() => []}
            loading={loading}
            onRestore={handleRestore}
            onDelete={setDeleteConfirm}
            getDisplayName={() => 'Journal Entry'}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this {deleteConfirm?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteConfirm?.type}
              {deleteConfirm?.type === 'client' && ' and all associated data'} from the database forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Trash2 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
      <p>No deleted {type}</p>
    </div>
  )
}

interface EntityListProps<T extends { id: string; deleted_at: string }> {
  items: T[]
  type: EntityType
  icon: React.ComponentType<{ className?: string }>
  getTitle: (item: T) => string
  getMetadata: (item: T) => string[]
  loading: string | null
  onRestore: (id: string, type: EntityType) => void
  onDelete: (state: DeleteConfirmState) => void
  getDisplayName?: (item: T) => string
}

function EntityList<T extends { id: string; deleted_at: string }>({
  items,
  type,
  icon: Icon,
  getTitle,
  getMetadata,
  loading,
  onRestore,
  onDelete,
  getDisplayName,
}: EntityListProps<T>) {
  if (items.length === 0) {
    return <EmptyState type={`${type}s`} />
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const title = getTitle(item)
        const metadata = getMetadata(item)
        const displayName = getDisplayName ? getDisplayName(item) : title
        
        return (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                  </p>
                  {metadata.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {metadata.join(' - ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(item.id, type)}
                  disabled={loading === item.id}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {loading === item.id ? 'Restoring...' : 'Restore'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete({ id: item.id, name: displayName, type })}
                  disabled={loading === item.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Forever
                </Button>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
