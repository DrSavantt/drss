"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Mail, Megaphone, FileText, PenTool, Sparkles, Trash2, FolderInput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { bulkDeleteContent, bulkChangeProject, getAllProjects } from "@/app/actions/content"
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
// EXACT v0 CODE - Only data fetching added, UI unchanged
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

const typeConfig = {
  email: { icon: Mail, label: "Email" },
  ad: { icon: Megaphone, label: "Ad Copy" },
  landing: { icon: FileText, label: "Landing Page" },
  blog: { icon: PenTool, label: "Blog Post" },
  note: { icon: FileText, label: "Note" },
}

export function ContentLibrary() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([{ id: "all", name: "All Clients" }])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [aiFilter, setAiFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: string; name: string; clientName: string | null }>>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  // Fetch content, clients, and projects - OPTIMIZED: Parallel fetches with AbortController
  useEffect(() => {
    const abortController = new AbortController()
    
    async function fetchData() {
      try {
        // OPTIMIZED: Parallel fetches instead of sequential waterfall
        // All fetch simultaneously - parallel
        const [contentRes, clientsRes, projectsData] = await Promise.all([
          fetch('/api/content', { signal: abortController.signal }),
          fetch('/api/clients', { signal: abortController.signal }),
          getAllProjects()
        ])
        
        // Check if aborted before processing
        if (abortController.signal.aborted) return
        
        const [contentData, clientsData] = await Promise.all([
          contentRes.json(),
          clientsRes.json()
        ])
        
        // Check if aborted before updating state
        if (abortController.signal.aborted) return
        
        // Transform to v0 format
        const transformedContent: ContentItem[] = contentData.map((c: any) => ({
          id: c.id,
          title: c.title,
          type: mapContentType(c.asset_type),
          client: c.client_name || 'Unknown',
          clientId: c.client_id || '',
          preview: extractPreview(c),
          createdAt: new Date(c.created_at),
          aiGenerated: !!c.metadata?.ai_generated || false,
        }))
        
        setContent(transformedContent)
        
        const clientOptions = [
          { id: "all", name: "All Clients" },
          ...clientsData.map((c: any) => ({ id: c.id, name: c.name }))
        ]
        
        setClients(clientOptions)
        
        // Transform projects for Move To dropdown
        const transformedProjects = (projectsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          clientName: p.clients?.name || null,
        }))
        setProjects(transformedProjects)
      } catch (error) {
        // Ignore abort errors - component unmounted
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch data:', error)
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }
    fetchData()
    
    // Cleanup: abort on unmount
    return () => {
      abortController.abort()
    }
  }, [])

  // PERFORMANCE OPTIMIZATION: Memoize filtered content
  // Prevents recalculation on every render - only recalculates when dependencies change
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
            <p className="text-muted-foreground">All content assets across clients</p>
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={`skeleton-content-${i}`} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
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
          <Button variant="outline" size="sm">
            Export
          </Button>
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

// Helper: Map database asset_type to v0 type
function mapContentType(assetType: string): "email" | "ad" | "landing" | "blog" | "note" {
  const typeMap: Record<string, "email" | "ad" | "landing" | "blog" | "note"> = {
    'email': 'email',
    'ad_copy': 'ad',
    'landing_page': 'landing',
    'blog_post': 'blog',
    'note': 'note',
    'research_pdf': 'note',
    'research_report': 'note',
    'other': 'note',
  }
  return typeMap[assetType] || 'note'
}

// Helper: Extract preview text from content
function extractPreview(content: any): string {
  try {
    const contentJson = content.content_json
    
    // If content_json is null/undefined
    if (!contentJson) {
      return content.title || 'No preview available'
    }
    
    // If content_json is a string directly
    if (typeof contentJson === 'string') {
      return contentJson.substring(0, 100)
    }
    
    // If content_json is an object
    if (typeof contentJson === 'object') {
      // Check for .text property (string)
      if (typeof contentJson.text === 'string') {
        return contentJson.text.substring(0, 100)
      }
      
      // Check for .content property (could be string or Tiptap structure)
      if (contentJson.content) {
        // If .content is a string
        if (typeof contentJson.content === 'string') {
          return contentJson.content.substring(0, 100)
        }
        
        // If .content is Tiptap JSON (array of nodes), extract text from first paragraph
        if (Array.isArray(contentJson.content)) {
          const firstTextNode = contentJson.content.find(
            (node: any) => node.type === 'paragraph' && node.content
          )
          if (firstTextNode?.content?.[0]?.text) {
            return String(firstTextNode.content[0].text).substring(0, 100)
          }
        }
      }
      
      // Try to stringify and extract (last resort)
      const stringified = JSON.stringify(contentJson)
      if (stringified.length > 2) { // More than just "{}"
        return stringified.substring(0, 100)
      }
    }
    
    // Fallback to title
    return content.title || 'No preview available'
  } catch (error) {
    console.error('Error extracting preview:', error)
    return content.title || 'No preview available'
  }
}

