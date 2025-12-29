'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClient } from '@/app/actions/clients'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface DeleteClientDialogProps {
  client: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  relatedCounts?: {
    projects: number
    content: number
    captures: number
  }
}

export function DeleteClientDialog({ 
  client, 
  open, 
  onOpenChange,
  relatedCounts 
}: DeleteClientDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deleteOption, setDeleteOption] = useState<'preserve' | 'delete_all'>('preserve')

  const handleDelete = async () => {
    setIsLoading(true)
    
    try {
      const result = await deleteClient(client.id, deleteOption, client.name)
      
      if (result?.error) {
        alert(result.error)
        setIsLoading(false)
        onOpenChange(false)
      } else {
        // Success - soft deleted, navigate to clients page
        router.push('/dashboard/clients')
        router.refresh()
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Failed to delete client:', err)
      alert('Failed to delete client')
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const totalRelated = (relatedCounts?.projects || 0) + 
                       (relatedCounts?.content || 0) + 
                       (relatedCounts?.captures || 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive "{client.name}"?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>The client will be moved to the Archive where it can be restored later.</p>
              
              {totalRelated > 0 && (
                <>
                  <p className="font-medium text-foreground">
                    This client has related data:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {relatedCounts?.projects ? (
                      <li>{relatedCounts.projects} project(s)</li>
                    ) : null}
                    {relatedCounts?.content ? (
                      <li>{relatedCounts.content} content piece(s)</li>
                    ) : null}
                    {relatedCounts?.captures ? (
                      <li>{relatedCounts.captures} journal capture(s)</li>
                    ) : null}
                  </ul>
                  
                  <RadioGroup 
                    value={deleteOption} 
                    onValueChange={(v) => setDeleteOption(v as 'preserve' | 'delete_all')}
                    className="mt-4"
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="preserve" id="preserve" />
                      <Label htmlFor="preserve" className="font-normal cursor-pointer">
                        <span className="font-medium">Preserve data</span>
                        <br />
                        <span className="text-sm text-muted-foreground">
                          Unlink projects and content from this client (keeps the data)
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2 mt-2">
                      <RadioGroupItem value="delete_all" id="delete_all" />
                      <Label htmlFor="delete_all" className="font-normal cursor-pointer">
                        <span className="font-medium text-red-500">Archive everything</span>
                        <br />
                        <span className="text-sm text-muted-foreground">
                          Archive all related projects, content, and captures (can be restored)
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? 'Archiving...' : 'Archive Client'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

