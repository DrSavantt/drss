"use client"

import type React from "react"

import type { Project } from "./projects-kanban"
import { ProjectCard } from "./project-card"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  title: string
  status: Project["status"]
  projects: Project[]
  onDragStart: (project: Project) => void
  onDragEnd: () => void
  onDrop: (status: Project["status"]) => void
  isDragging: boolean
}

export function KanbanColumn({
  title,
  status,
  projects,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop(status)
  }

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/50",
        isDragging && "ring-2 ring-primary/20",
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
          <ProjectCard key={project.id} project={project} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        ))}
        {projects.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No projects
          </div>
        )}
      </div>
    </div>
  )
}
