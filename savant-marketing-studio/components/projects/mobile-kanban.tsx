"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MobileProjectCard } from "./mobile-project-card"
import type { Project } from "./projects-kanban"

const columns = [
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
]

interface MobileKanbanProps {
  projects: Project[]
  onStatusChange: (projectId: string, newStatus: Project["status"]) => void
  onProjectClick: (project: Project) => void
}

export function MobileKanban({ projects, onStatusChange, onProjectClick }: MobileKanbanProps) {
  const [activeColumn, setActiveColumn] = useState<string>("backlog")

  const getProjectsForColumn = (columnId: string) =>
    projects.filter((p) => p.status === columnId)

  return (
    <Tabs value={activeColumn} onValueChange={setActiveColumn} className="w-full">
      {/* Tab Navigation - Scrollable on very small screens */}
      <TabsList className="w-full grid grid-cols-4 h-auto p-1 mb-4">
        {columns.map((col) => {
          const count = getProjectsForColumn(col.id).length
          return (
            <TabsTrigger
              key={col.id}
              value={col.id}
              className="flex flex-col gap-0.5 py-2 px-1 text-xs min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="truncate">{col.label}</span>
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] px-1.5 text-[10px] font-medium data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground"
                data-state={activeColumn === col.id ? "active" : "inactive"}
              >
                {count}
              </Badge>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {/* Tab Content - One column at a time */}
      {columns.map((col) => (
        <TabsContent key={col.id} value={col.id} className="mt-0 focus-visible:outline-none">
          <div className="space-y-3">
            {getProjectsForColumn(col.id).map((project) => (
              <MobileProjectCard
                key={project.id}
                project={project}
                onClick={() => onProjectClick(project)}
                onMoveToColumn={(newStatus) => onStatusChange(project.id, newStatus)}
                currentColumn={col.id as Project["status"]}
              />
            ))}
            {getProjectsForColumn(col.id).length === 0 && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-card/30 text-sm text-muted-foreground">
                No projects in {col.label}
              </div>
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
