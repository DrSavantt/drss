"use client"

import { useState } from "react"
import { Plus, List, LayoutGrid, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KanbanColumn } from "./kanban-column"
import { NewProjectDialog } from "./new-project-dialog"
import { cn } from "@/lib/utils"

export interface Project {
  id: string
  title: string
  client: string
  clientId: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "backlog" | "in-progress" | "review" | "done"
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Black Friday Campaign",
    client: "Acme Corp",
    clientId: "1",
    dueDate: "2024-12-23",
    priority: "high",
    status: "in-progress",
  },
  {
    id: "2",
    title: "Email Sequence",
    client: "TechStart",
    clientId: "2",
    dueDate: "2024-12-24",
    priority: "medium",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Landing Page Copy",
    client: "NewCo Inc",
    clientId: "3",
    dueDate: "2024-12-20",
    priority: "high",
    status: "review",
  },
  {
    id: "4",
    title: "Social Media Kit",
    client: "Growth Labs",
    clientId: "4",
    dueDate: "2024-12-28",
    priority: "low",
    status: "backlog",
  },
  {
    id: "5",
    title: "Product Launch Copy",
    client: "Acme Corp",
    clientId: "1",
    dueDate: "2024-12-30",
    priority: "medium",
    status: "backlog",
  },
  {
    id: "6",
    title: "Newsletter Template",
    client: "TechStart",
    clientId: "2",
    dueDate: "2025-01-05",
    priority: "low",
    status: "backlog",
  },
  {
    id: "7",
    title: "Brand Guidelines",
    client: "Velocity",
    clientId: "5",
    dueDate: "2024-12-15",
    priority: "high",
    status: "done",
  },
  {
    id: "8",
    title: "Q4 Campaign",
    client: "Growth Labs",
    clientId: "4",
    dueDate: "2024-12-01",
    priority: "medium",
    status: "done",
  },
]

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
]

const clients = [
  { id: "all", name: "All Clients" },
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "TechStart" },
  { id: "3", name: "NewCo Inc" },
  { id: "4", name: "Growth Labs" },
  { id: "5", name: "Velocity" },
]

export function ProjectsKanban() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [clientFilter, setClientFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draggedProject, setDraggedProject] = useState<Project | null>(null)

  const filteredProjects = projects.filter((project) => clientFilter === "all" || project.clientId === clientFilter)

  const handleDragStart = (project: Project) => {
    setDraggedProject(project)
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
  }

  const handleDrop = (status: Project["status"]) => {
    if (!draggedProject) return

    setProjects((prev) => prev.map((p) => (p.id === draggedProject.id ? { ...p, status } : p)))
    setDraggedProject(null)
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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            status={column.id as Project["status"]}
            projects={filteredProjects.filter((p) => p.status === column.id)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={!!draggedProject}
          />
        ))}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
