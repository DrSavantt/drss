'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SaveToLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { title: string; projectId: string | null }) => Promise<void>
  clientId: string | null
  defaultTitle: string
}

export function SaveToLibraryDialog({
  open,
  onOpenChange,
  onSave,
  clientId,
  defaultTitle,
}: SaveToLibraryDialogProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Fetch projects for this client
  useEffect(() => {
    if (!open || !clientId) {
      setProjects([])
      setIsFetching(false)
      return
    }

    const fetchProjects = async () => {
      setIsFetching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('name')

      setProjects(data || [])
      setIsFetching(false)
    }

    fetchProjects()
  }, [open, clientId])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle)
      setProjectId(null)
    }
  }, [open, defaultTitle])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave({ title, projectId })
      onOpenChange(false)
    } catch {
      // Error is handled by the parent component
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Content Library</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Save AI-generated content to your library with a title and optional project</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (optional)</Label>
            {!clientId ? (
              <p className="text-sm text-muted-foreground">
                No client associated with this conversation
              </p>
            ) : (
              <Select
                value={projectId || 'none'}
                onValueChange={(v) => setProjectId(v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isFetching ? 'Loading projects...' : 'Select a project...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
