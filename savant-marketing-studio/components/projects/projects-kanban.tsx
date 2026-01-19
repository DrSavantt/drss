"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, List, LayoutGrid, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KanbanColumn } from "./kanban-column"
import { MobileKanban } from "./mobile-kanban"
import { NewProjectDialog } from "./new-project-dialog"
import { updateProjectStatus } from "@/app/actions/projects"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import { ProjectCard } from "./project-card"

// ============================================================================
// EXACT v0 CODE - Only data fetching added, UI unchanged
// ============================================================================

export interface Project {
  id: string
  title: string
  client: string
  clientId: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "backlog" | "in-progress" | "review" | "done"
}

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
]

export function ProjectsKanban() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([{ id: "all", name: "All Clients" }])
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [clientFilter, setClientFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // Configure sensors with touch support for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold to start drag (prevents scroll conflict)
        tolerance: 5, // 5px movement allowed during delay
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Fetch projects and clients - OPTIMIZED: Parallel fetches with AbortController
  useEffect(() => {
    const abortController = new AbortController()
    
    async function fetchData() {
      try {
        // OPTIMIZED: Parallel fetches instead of sequential waterfall
        // Previously: projects fetched THEN clients - sequential
        // Now: Both fetch simultaneously - parallel
        const [projectsRes, clientsRes] = await Promise.all([
          fetch('/api/projects', { signal: abortController.signal }),
          fetch('/api/clients', { signal: abortController.signal })
        ])
        
        // Check if aborted before processing responses
        if (abortController.signal.aborted) return
        
        const [projectsData, clientsData] = await Promise.all([
          projectsRes.json(),
          clientsRes.json()
        ])
        
        // Check if aborted before updating state
        if (abortController.signal.aborted) return
        
        // Defensive check: API may return { error: "..." } on failure instead of array
        // Handle both non-ok responses and non-array data
        if (!projectsRes.ok || !Array.isArray(projectsData)) {
          console.error('Projects API error:', projectsData?.error || 'Invalid response format')
          setProjects([])
        } else {
          // Transform to v0 Project format
          const transformedProjects: Project[] = projectsData.map((p: any) => ({
            id: p.id,
            title: p.name,
            client: p.client_name || 'Unknown',
            clientId: p.client_id || '',
            dueDate: p.due_date || '',
            priority: (p.priority || 'medium') as "low" | "medium" | "high",
            status: mapStatus(p.status),
          }))
          setProjects(transformedProjects)
        }
        
        // Defensive check: API may return { error: "..." } on failure instead of array
        if (!clientsRes.ok || !Array.isArray(clientsData)) {
          console.error('Clients API error:', clientsData?.error || 'Invalid response format')
          setClients([{ id: "all", name: "All Clients" }])
        } else {
          const clientOptions = [
            { id: "all", name: "All Clients" },
            ...clientsData.map((c: any) => ({ id: c.id, name: c.name }))
          ]
          setClients(clientOptions)
        }
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
    
    // Cleanup: abort on unmount or dialogOpen change
    return () => {
      abortController.abort()
    }
  }, [dialogOpen]) // Refetch when dialog closes

  const filteredProjects = projects.filter((project) => clientFilter === "all" || project.clientId === clientFilter)

  // PERFORMANCE OPTIMIZATION: Pre-filter projects by column with stable references
  // Previously: .filter() created new array on every render (broke memoization)
  // Now: Only recalculates when filteredProjects changes
  // Impact: Prevents unnecessary re-renders of KanbanColumn components
  const columnProjects = useMemo(() => {
    return columns.map(column => ({
      id: column.id,
      title: column.title,
      projects: filteredProjects.filter((p) => p.status === column.id)
    }))
  }, [filteredProjects])

  // dnd-kit drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const project = filteredProjects.find(p => p.id === active.id)
    if (project) {
      setActiveProject(project)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)
    
    if (!over) return
    
    // The over.id is the column status (backlog, in-progress, review, done)
    const newStatus = over.id as Project["status"]
    const projectId = active.id as string
    const project = projects.find(p => p.id === projectId)
    
    if (!project || project.status === newStatus) return

    // Optimistic update
    const oldStatus = project.status
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)))

    // Update in database
    try {
      const dbStatus = mapStatusToDb(newStatus)
      await updateProjectStatus(projectId, dbStatus, 0) // Position 0 for now (sorting not implemented)
    } catch (error) {
      console.error('Failed to update project status:', error)
      // Revert on error
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: oldStatus } : p)))
    }
  }

  const handleProjectClick = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`)
  }

  // Shared status change handler for both mobile and desktop views
  const handleStatusChange = async (projectId: string, newStatus: Project["status"]) => {
    const project = projects.find(p => p.id === projectId)
    if (!project || project.status === newStatus) return

    // Optimistic update
    const oldStatus = project.status
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)))

    // Update in database
    try {
      const dbStatus = mapStatusToDb(newStatus)
      await updateProjectStatus(projectId, dbStatus, 0)
    } catch (error) {
      console.error('Failed to update project status:', error)
      // Revert on error
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: oldStatus } : p)))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Track and manage your client projects</p>
          </div>
        </div>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`skeleton-column-${i}`} className="w-72 h-96 rounded-xl border border-border bg-card/50 animate-pulse" />
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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Track and manage your client projects</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by client" />
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
        <div className="flex items-center rounded-lg border border-border p-1">
          <button
            onClick={() => setViewMode("board")}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              viewMode === "board"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile: Tabbed single-column view */}
      <div className="md:hidden">
        <MobileKanban
          projects={filteredProjects}
          onStatusChange={handleStatusChange}
          onProjectClick={handleProjectClick}
        />
      </div>

      {/* Desktop: Full 4-column kanban board with dnd-kit */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columnProjects.map((column) => (
              <KanbanColumn
                key={column.id}
                title={column.title}
                status={column.id as Project["status"]}
                projects={column.projects}
                onProjectClick={handleProjectClick}
              />
            ))}
          </div>
          
          {/* Drag overlay shows the card being dragged */}
          <DragOverlay>
            {activeProject ? (
              <div className="opacity-80">
                <ProjectCard
                  project={activeProject}
                  onClick={() => {}}
                  isDragOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

// Helper functions to map between v0 and database status formats
function mapStatus(dbStatus: string): Project["status"] {
  const statusMap: Record<string, Project["status"]> = {
    'backlog': 'backlog',
    'in_progress': 'in-progress',
    'in_review': 'review',
    'done': 'done',
  }
  return statusMap[dbStatus] || 'backlog'
}

function mapStatusToDb(v0Status: Project["status"]): string {
  const statusMap: Record<Project["status"], string> = {
    'backlog': 'backlog',
    'in-progress': 'in_progress',
    'review': 'in_review',
    'done': 'done',
  }
  return statusMap[v0Status]
}
