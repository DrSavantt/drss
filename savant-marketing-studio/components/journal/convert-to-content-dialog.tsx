'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FileText } from 'lucide-react'
import { convertEntryToContent, bulkConvertToContent } from '@/app/actions/journal'
import { getClients } from '@/app/actions/clients'

interface ConvertToContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryIds: string[]
  entryContent?: string  // For single entry, to pre-fill title
  onSuccess: () => void
}

export function ConvertToContentDialog({
  open,
  onOpenChange,
  entryIds,
  entryContent,
  onSuccess
}: ConvertToContentDialogProps) {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('none')
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)

  const isBulk = entryIds.length > 1

  // Load clients
  useEffect(() => {
    async function loadClients() {
      setLoading(true)
      try {
        const clientsData = await getClients()
        // Filter out any clients with empty IDs
        setClients(clientsData.filter(c => c.id))
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }
    if (open) {
      loadClients()
    }
  }, [open])

  // Load projects when client is selected
  useEffect(() => {
    async function loadProjects() {
      if (!clientId) {
        setProjects([])
        return
      }
      
      try {
        const res = await fetch(`/api/projects?clientId=${clientId}`)
        const projectsData = await res.json()
        // Filter out any projects with empty IDs
        setProjects(projectsData.filter((p: any) => p.id).map((p: any) => ({ id: p.id, name: p.name })))
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        setProjects([])
      }
    }
    loadProjects()
  }, [clientId])

  // Pre-fill title from entry content (for single entry)
  useEffect(() => {
    if (open && !isBulk && entryContent) {
      const truncated = entryContent.substring(0, 100).trim()
      setTitle(truncated)
    } else if (open && isBulk) {
      setTitle(`${entryIds.length} Journal Captures - ${new Date().toLocaleDateString()}`)
    }
  }, [open, isBulk, entryContent, entryIds.length])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setClientId('')
      setProjectId('none')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clientId) {
      alert('Please select a client')
      return
    }
    
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    
    setConverting(true)
    
    try {
      // Convert "none" to null for project ID
      const actualProjectId = projectId === 'none' ? null : projectId
      
      if (isBulk) {
        const result = await bulkConvertToContent(entryIds, clientId, actualProjectId)
        
        if (result.success) {
          alert(`Successfully converted ${result.converted} ${result.converted === 1 ? 'entry' : 'entries'} to content${result.failed > 0 ? ` (${result.failed} failed)` : ''}`)
          onSuccess()
          onOpenChange(false)
        } else {
          alert('Failed to convert entries to content')
        }
      } else {
        const result = await convertEntryToContent(entryIds[0], clientId, title, actualProjectId)
        
        if (result.error) {
          alert(result.error)
        } else {
          alert('Successfully converted entry to content!')
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error('Failed to convert:', error)
      alert('Failed to convert entry to content')
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Convert to Content
          </DialogTitle>
          <DialogDescription>
            {isBulk 
              ? `Convert ${entryIds.length} journal entries into content assets.` 
              : 'Convert this journal entry into a content asset.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          {!isBulk && (
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title..."
                required
                disabled={converting}
              />
            </div>
          )}
          
          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={loading || converting}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => c.id).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Project (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="project">Project (Optional)</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!clientId || converting}>
              <SelectTrigger id="project">
                <SelectValue placeholder={clientId ? "Select a project..." : "Select client first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.filter(p => p.id).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bulk Note */}
          {isBulk && (
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              Each entry will be created as a separate content asset with an auto-generated title.
            </p>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={converting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={converting || !clientId}
              className="bg-green-500 hover:bg-green-600"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Convert {isBulk ? `${entryIds.length}` : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

