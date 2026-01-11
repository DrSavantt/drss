'use client'

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Mail, Megaphone, FileText, PenTool, Sparkles, Trash2, FolderInput, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { bulkDeleteContent, bulkChangeProject, bulkReassignContentToClient } from "@/app/actions/content"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CreateContentModal } from "./create-content-modal"

// ============================================================================
// TYPES
// ============================================================================

interface ContentItem {
  id: string
  title: string
  type: "email" | "ad" | "landing" | "blog" | "note"
  client: string
  clientId: string
  preview: string
  createdAt: Date
  aiGenerated: boolean
}

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  clientName: string | null
}

interface ContentPageContentProps {
  initialContent: ContentItem[]
  initialClients: Client[]
  initialProjects: Project[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const typeConfig = {
  email: { icon: Mail, label: "Email" },
  ad: { icon: Megaphone, label: "Ad Copy" },
  landing: { icon: FileText, label: "Landing Page" },
  blog: { icon: PenTool, label: "Blog Post" },
  note: { icon: FileText, label: "Note" },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContentPageContent({ initialContent, initialClients, initialProjects }: ContentPageContentProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent)
  const [clients] = useState<Client[]>([{ id: "all", name: "All Clients" }, ...initialClients])
  const [projects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [aiFilter, setAiFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  // Memoized filtered content
  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = clientFilter === "all" || item.clientId === clientFilter
      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesAi =
        aiFilter === "all" || (aiFilter === "yes" && item.aiGenerated) || (aiFilter === "no" && !item.aiGenerated)
      return matchesSearch && matchesClient && matchesType && matchesAi
    })
  }, [content, searchQuery, clientFilter, typeFilter, aiFilter])

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredContent.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} content items?`)) return
    
    setDeleting(true)
    try {
      await bulkDeleteContent(selectedItems)
      // Remove from UI
      setContent(prev => prev.filter(c => !selectedItems.includes(c.id)))
      setSelectedItems([])
      router.refresh()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete content items')
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkMove = async (projectId: string | null) => {
    setMoving(true)
    try {
      const result = await bulkChangeProject(selectedItems, projectId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      const projectName = projectId 
        ? projects.find(p => p.id === projectId)?.name || 'project'
        : 'no project'
      toast.success(`Moved ${selectedItems.length} item(s) to ${projectName}`)
      setSelectedItems([])
      router.refresh()
    } catch (error) {
      console.error('Failed to move:', error)
      toast.error('Failed to move items')
    } finally {
      setMoving(false)
    }
  }

  const handleBulkReassign = async (clientId: string) => {
    setReassigning(true)
    try {
      const result = await bulkReassignContentToClient(selectedItems, clientId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      const clientName = clients.find(c => c.id === clientId)?.name || 'client'
      toast.success(`Reassigned ${selectedItems.length} item(s) to ${clientName}`)
      setSelectedItems([])
      router.refresh()
    } catch (error) {
      console.error('Failed to reassign:', error)
      toast.error('Failed to reassign items')
    } finally {
      setReassigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">All content assets across clients</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ad">Ad Copy</SelectItem>
              <SelectItem value="landing">Landing Page</SelectItem>
              <SelectItem value="blog">Blog Post</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
          <Select value={aiFilter} onValueChange={setAiFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="AI Generated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="yes">AI Generated</SelectItem>
              <SelectItem value="no">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">Select All</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {filteredContent.length} of {content.length}
        </span>
      </div>

      {/* Content List */}
      <div className="space-y-2">
        {filteredContent.map((item) => {
          const TypeIcon = typeConfig[item.type].icon
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50",
                selectedItems.includes(item.id) && "border-primary bg-primary/5",
              )}
            >
              <Checkbox 
                checked={selectedItems.includes(item.id)} 
                onCheckedChange={() => toggleSelect(item.id)}
                onClick={(e) => e.stopPropagation()} 
              />
              <Link 
                href={`/dashboard/content/${item.id}`}
                className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  // Prevent navigation if checkbox was clicked
                  if (selectedItems.includes(item.id)) {
                    e.preventDefault()
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h3 className="font-medium truncate">{item.title}</h3>
                    {item.aiGenerated && (
                      <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.client}</span>
                  <span>•</span>
                  <span>{typeConfig[item.type].label}</span>
                  <span>•</span>
                  <span>
                    {item.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground truncate">"{item.preview}"</p>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-3 shadow-lg">
          <span className="text-sm font-medium">{selectedItems.length} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={moving}>
                <FolderInput className="mr-2 h-4 w-4" />
                {moving ? 'Moving...' : 'Move to...'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Move to project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-muted-foreground"
                onClick={() => handleBulkMove(null)}
                disabled={moving}
              >
                Remove from project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.length === 0 ? (
                <DropdownMenuItem disabled>No projects available</DropdownMenuItem>
              ) : (
                projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleBulkMove(project.id)}
                    disabled={moving}
                  >
                    <span className="truncate">{project.name}</span>
                    {project.clientName && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {project.clientName}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={reassigning}>
                <Users className="mr-2 h-4 w-4" />
                {reassigning ? 'Reassigning...' : 'Change Client...'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Reassign to client</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.filter(c => c.id !== 'all').length === 0 ? (
                <DropdownMenuItem disabled>No clients available</DropdownMenuItem>
              ) : (
                clients.filter(c => c.id !== 'all').map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => handleBulkReassign(client.id)}
                    disabled={reassigning}
                  >
                    {client.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Create Content Modal */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

