"use client"

import { memo, useMemo } from "react"
import { Calendar, MoreVertical, ArrowRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Project } from "./projects-kanban"

interface MobileProjectCardProps {
  project: Project
  onClick: () => void
  onMoveToColumn: (newStatus: Project["status"]) => void
  currentColumn: Project["status"]
}

const priorityConfig = {
  low: { label: "Low", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const columnConfig: { id: Project["status"]; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
]

export const MobileProjectCard = memo(function MobileProjectCard({
  project,
  onClick,
  onMoveToColumn,
  currentColumn,
}: MobileProjectCardProps) {
  // Memoize expensive date calculations
  const { priority, dueDate, isOverdue, isDueSoon } = useMemo(() => {
    const calculatedPriority = priorityConfig[project.priority] || priorityConfig.medium
    const calculatedDueDate = new Date(project.dueDate)
    const today = new Date()
    const calculatedIsOverdue = calculatedDueDate < today && project.status !== "done"
    const calculatedIsDueSoon =
      !calculatedIsOverdue && calculatedDueDate.getTime() - today.getTime() < 2 * 24 * 60 * 60 * 1000

    return {
      priority: calculatedPriority,
      dueDate: calculatedDueDate,
      isOverdue: calculatedIsOverdue,
      isDueSoon: calculatedIsDueSoon,
    }
  }, [project.priority, project.dueDate, project.status])

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]">
      <div className="flex items-start gap-3">
        {/* Card Content - Tappable area */}
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <p className="font-medium text-card-foreground leading-tight">{project.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
          <div className="flex items-center justify-between mt-3">
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : isDueSoon ? "text-warning" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              {isOverdue
                ? "Overdue"
                : dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <Badge variant="outline" className={cn("text-xs", priority.className)}>
              {priority.label}
            </Badge>
          </div>
        </div>

        {/* Move-to-column dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 -mr-1 -mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Move project</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Move to column
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columnConfig.map((col) => (
              <DropdownMenuItem
                key={col.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (col.id !== currentColumn) {
                    onMoveToColumn(col.id)
                  }
                }}
                disabled={col.id === currentColumn}
                className={cn(
                  "min-h-[44px]",
                  col.id === currentColumn && "bg-muted text-muted-foreground"
                )}
              >
                {col.id === currentColumn ? (
                  <Check className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {col.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})
