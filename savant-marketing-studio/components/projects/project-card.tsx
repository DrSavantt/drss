"use client"

import { memo, useCallback, useMemo } from "react"

import type { Project } from "./projects-kanban"
import { Calendar, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useDraggable } from '@dnd-kit/core'

interface ProjectCardProps {
  project: Project
  onClick?: (project: Project) => void
  isDragOverlay?: boolean
}

const priorityConfig = {
  low: { label: "Low", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export const ProjectCard = memo(function ProjectCard({ project, onClick, isDragOverlay = false }: ProjectCardProps) {
  // dnd-kit draggable hook
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: isDragOverlay, // Disable drag on overlay
  })

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

  const handleClick = useCallback(() => {
    if (onClick && !isDragging) {
      onClick(project)
    }
  }, [onClick, project, isDragging])

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md",
        isDragging && "opacity-50",
        isDragOverlay && "shadow-lg border-primary cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle - always visible on mobile, hover on desktop */}
        <button
          {...listeners}
          {...attributes}
          className={cn(
            "touch-action-none cursor-grab active:cursor-grabbing p-1 -m-1 rounded",
            "min-h-[44px] min-w-[44px] flex items-center justify-center",
            "opacity-40 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-2 cursor-pointer">
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
