'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, Plus, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// CLIENT PROJECTS TAB
// All data pre-fetched. No API calls on mount.
// ============================================================================

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority?: string
  due_date?: string
  created_at: string
}

interface ClientProjectsTabProps {
  clientId: string
  clientName: string
  projects: Project[]
  onProjectCreated: (project: Project) => void
  onProjectDeleted: (id: string) => void
  onNewProject: () => void
}

export function ClientProjectsTab({
  clientId,
  clientName,
  projects,
  onProjectCreated,
  onProjectDeleted,
  onNewProject
}: ClientProjectsTabProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>All projects for {clientName}</CardDescription>
          </div>
          <Button size="sm" onClick={onNewProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-base font-medium mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get started by creating your first project for {clientName}
            </p>
            <Button size="sm" onClick={onNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href="/dashboard/projects/board"
                className="block border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        project.status === 'done' && "bg-green-500",
                        project.status === 'in_progress' && "bg-blue-500",
                        project.status === 'in_review' && "bg-yellow-500",
                        project.status === 'backlog' && "bg-gray-400"
                      )} />
                      <h3 className="text-base font-semibold">
                        {project.name}
                      </h3>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {project.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                      project.priority === 'urgent' ? 'destructive' :
                      project.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {project.priority || 'normal'}
                    </Badge>
                    <Badge variant="outline">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

