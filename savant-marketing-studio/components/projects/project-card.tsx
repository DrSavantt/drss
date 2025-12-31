"use client"

import { memo, useCallback, useMemo } from "react"
import type React from "react"

import type { Project } from "./projects-kanban"
import { Calendar, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
  onDragStart: (project: Project) => void
  onDragEnd: () => void
  onClick?: (project: Project) => void
}

const priorityConfig = {
  low: { label: "Low", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export const ProjectCard = memo(function ProjectCard({ project, onDragStart, onDragEnd, onClick }: ProjectCardProps) {
  // PERFORMANCE OPTIMIZATION: Memoize expensive date calculations
  // Previously: New Date objects created on every render (6,000/sec during drag)
  // Now: Only recalculated when dueDate or status changes
  const { priority, dueDate, isOverdue, isDueSoon } = useMemo(() => {
    const calculatedPriority = priorityConfig[project.priority] || priorityConfig.medium
    const calculatedDueDate = new Date(project.dueDate)
    const today = new Date()
    const calculatedIsOverdue = calculatedDueDate < today && project.status !== "done"
    const calculatedIsDueSoon = !calculatedIsOverdue && calculatedDueDate.getTime() - today.getTime() < 2 * 24 * 60 * 60 * 1000
    
    return {
      priority: calculatedPriority,
      dueDate: calculatedDueDate,
      isOverdue: calculatedIsOverdue,
      isDueSoon: calculatedIsDueSoon
    }
  }, [project.priority, project.dueDate, project.status])

  // PERFORMANCE OPTIMIZATION: Memoize event handlers
  // Previously: New function created on every render
  // Now: Function reference stable unless dependencies change
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    onDragStart(project)
  }, [onDragStart, project])

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(project)
    }
  }, [onClick, project])

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-card-foreground">{project.title}</p>
          <p className="text-sm text-muted-foreground">{project.client}</p>
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : isDueSoon ? "text-warning" : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
              {isOverdue ? "Overdue" : dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <Badge variant="outline" className={cn("text-xs", priority.className)}>
              {priority.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
})
