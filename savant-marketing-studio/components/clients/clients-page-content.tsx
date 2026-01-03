'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ClientCard } from "./client-card"
import { NewClientDialog } from "./new-client-dialog"
import { deleteClient } from "@/app/actions/clients"

// ============================================================================
// TYPES
// ============================================================================

interface Client {
  id: string
  name: string
  email: string
  status: "onboarded" | "onboarding" | "new"
  projectCount: number
  contentCount: number
  aiSpend: number
  industry: string
}

interface ClientsPageContentProps {
  initialClients: Client[]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClientsPageContent({ initialClients }: ClientsPageContentProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Callback to refresh clients after dialog closes (for optimistic updates)
  const handleDialogChange = async (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Refetch clients when dialog closes (new client created)
      try {
        const res = await fetch('/api/clients')
        const data = await res.json()
        if (Array.isArray(data)) {
          setClients(data)
        }
      } catch (error) {
        console.error('Failed to refresh clients:', error)
      }
    }
  }

  // Handle edit - navigate to client page with edit mode
  const handleEdit = (id: string) => {
    router.push(`/dashboard/clients/${id}`)
  }

  // Handle delete - show confirmation dialog
  const handleDelete = (id: string) => {
    const client = clients.find(c => c.id === id)
    if (client) {
      setDeletingClient({ id, name: client.name })
      setShowDeleteDialog(true)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingClient) return
    
    setIsDeleting(true)
    try {
      const result = await deleteClient(deletingClient.id, 'delete_all', deletingClient.name)
      
      if (result?.error) {
        console.error('Failed to delete client:', result.error)
        return
      }
      
      // Optimistically remove from list
      setClients(prev => prev.filter(c => c.id !== deletingClient.id))
      setShowDeleteDialog(false)
      setDeletingClient(null)
      
      // Refresh to ensure data consistency
      router.refresh()
    } catch (error) {
      console.error('Failed to delete client:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Memoized filtered and sorted clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const matchesSearch =
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || client.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name)
          case "projects":
            return b.projectCount - a.projectCount
          case "content":
            return b.contentCount - a.contentCount
          case "spend":
            return b.aiSpend - a.aiSpend
          default:
            return 0
        }
      })
  }, [clients, searchQuery, statusFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client portfolio</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="onboarded">Onboarded</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="projects">Most Projects</SelectItem>
              <SelectItem value="content">Most Content</SelectItem>
              <SelectItem value="spend">AI Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-muted-foreground">No clients found</p>
          <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
            Add your first client
          </Button>
        </div>
      )}

      <NewClientDialog open={dialogOpen} onOpenChange={handleDialogChange} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingClient?.name}</strong> and all associated projects, content, and questionnaire data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

