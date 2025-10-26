'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
    low: 'bg-gray-700/50 text-gray-300',
    medium: 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
    high: 'bg-orange-600/20 text-orange-300 border border-orange-600/30',
    urgent: 'bg-red-600/20 text-red-300 border border-red-600/30',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[#1a1f2e] border border-white/10 rounded-lg p-4 hover:border-[#4ECDC4]/50 transition-all duration-200 cursor-grab active:cursor-grabbing"
    >
      {/* Project Name */}
      <h3 className="font-semibold text-white mb-2">
        {project.name}
      </h3>

      {/* Description Preview */}
      {project.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Client Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
          {project.clients?.name || 'Unknown Client'}
        </span>
      </div>

      {/* Priority & Due Date */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`px-2 py-1 rounded font-medium ${
            priorityColors[project.priority as keyof typeof priorityColors]
          }`}
        >
          {project.priority}
        </span>
        {project.due_date && (
          <span className="text-gray-400">
            {new Date(project.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}
      </div>
    </div>
  )
}
