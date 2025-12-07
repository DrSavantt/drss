'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SpotlightCard } from '@/components/ui/spotlight-card'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  position: number
  created_at: string
  client_id: string
  clients: {
    name: string
  } | null
}

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors = {
    low: 'bg-slate/50 text-light-gray',
    medium: 'bg-info/20 text-info border border-info/30',
    high: 'bg-warning/20 text-warning border border-warning/30',
    urgent: 'bg-red-primary/20 text-red-light border border-red-primary/30',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing"
    >
      <SpotlightCard className="p-4 hover:border-red-bright/50 transition-all duration-200 h-full">
      <h3 className="font-semibold text-foreground mb-2">
        {project.name}
      </h3>

      {project.description && (
        <p className="text-sm text-silver mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-info/10 text-info border border-info/30">
          {project.clients?.name || 'Unknown Client'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`px-2 py-1 rounded font-medium ${
            priorityColors[project.priority as keyof typeof priorityColors]
          }`}
        >
          {project.priority}
        </span>
        {project.due_date && (
          <span className="text-slate">
            {new Date(project.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}
      </div>
      </SpotlightCard>
    </div>
  )
}
