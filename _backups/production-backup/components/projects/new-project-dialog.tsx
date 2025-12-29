"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProject } from "@/app/actions/projects"
import { useRouter } from "next/navigation"

// ============================================================================
// EXACT v0 CODE - Only form submission wired to real server action
// ============================================================================

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [priority, setPriority] = useState("medium")
  const router = useRouter()

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients')
        const data = await res.json()
        setClients(data.map((c: any) => ({ id: c.id, name: c.name })))
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      }
    }
    if (open) {
      fetchClients()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedClient) {
      alert('Please select a client')
      return
    }
    
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      // Map v0 field names to database field names
      formData.set('name', formData.get('title') as string)
      formData.set('due_date', formData.get('due') as string)
      formData.set('priority', priority)
      
      const result = await createProject(selectedClient, formData)
      
      if (result.error) {
        alert(result.error)
      } else {
        onOpenChange(false)
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setSelectedClient("")
        setPriority("medium")
        // Trigger refetch
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new project to track your client work.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" name="title" placeholder="e.g., Black Friday Campaign" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of the project..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="due">Due Date</Label>
                <Input id="due" name="due" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
