"use client"

import { memo } from "react"

import type { Project } from "./projects-kanban"
import { ProjectCard } from "./project-card"
import { cn } from "@/lib/utils"
import { useDroppable } from '@dnd-kit/core'

interface KanbanColumnProps {
  title: string
  status: Project["status"]
  projects: Project[]
  onProjectClick?: (project: Project) => void
}

export const KanbanColumn = memo(function KanbanColumn({
  title,
  status,
  projects,
  onProjectClick,
}: KanbanColumnProps) {
  // dnd-kit droppable - the column accepts dragged cards
  const { isOver, setNodeRef } = useDroppable({
    id: status, // Use status as the droppable ID
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/50 transition-all",
        isOver && "ring-2 ring-primary/50 bg-primary/5",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {projects.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onClick={onProjectClick}
          />
        ))}
        {projects.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No projects
          </div>
        )}
      </div>
    </div>
  )
})
