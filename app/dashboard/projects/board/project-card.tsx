'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Project {
  id: string
  name: string
  description: string | null
  priority: string
  due_date: string | null
  clients: {
    name: string
  } | null
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
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
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      {/* Project Name */}
      <h3 className="font-semibold text-gray-900 mb-2">
        {project.name}
      </h3>

      {/* Description Preview */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Client Badge */}
      <div className="mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          {project.clients?.name || 'Unknown Client'}
        </span>
      </div>

      {/* Priority & Due Date */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-1 rounded-full font-medium ${
            priorityColors[project.priority as keyof typeof priorityColors]
          }`}
        >
          {project.priority}
        </span>
        {project.due_date && (
          <span className="text-gray-500">
            Due: {new Date(project.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}
      </div>
    </div>
  )
}
