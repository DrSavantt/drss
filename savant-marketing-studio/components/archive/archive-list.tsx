'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { restoreClient, permanentlyDeleteClient } from '@/app/actions/clients'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw, Trash2, Building2 } from 'lucide-react'
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

interface ArchivedClient {
  id: string
  name: string
  email?: string | null
  deleted_at: string
}

export function ArchiveList({ clients }: { clients: ArchivedClient[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ArchivedClient | null>(null)

  const handleRestore = async (client: ArchivedClient) => {
    setLoading(client.id)
    const result = await restoreClient(client.id)
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  const handlePermanentDelete = async () => {
    if (!deleteConfirm) return
    setLoading(deleteConfirm.id)
    const result = await permanentlyDeleteClient(deleteConfirm.id)
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(null)
    setDeleteConfirm(null)
  }

  if (clients.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Archive is empty</h3>
          <p className="text-muted-foreground">
            Deleted clients will appear here for recovery.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Deleted Clients ({clients.length})</h2>
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Deleted {formatDistanceToNow(new Date(client.deleted_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(client)}
                  disabled={loading === client.id}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {loading === client.id ? 'Restoring...' : 'Restore'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm(client)}
                  disabled={loading === client.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Forever
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete "{deleteConfirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              and all associated data from the database forever.
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

