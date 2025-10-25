'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { updateProjectStatus } from '@/app/actions/projects'
import { ProjectCard } from './project-card'
import { DroppableColumn } from './droppable-column'
import { ProjectModal } from './project-modal'
import { LoadingSpinner } from '@/components/loading-spinner'

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

interface KanbanBoardProps {
  initialProjects: Project[]
}

export function KanbanBoard({ initialProjects }: KanbanBoardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Only render drag & drop after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'in_review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ]

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Find the project being dragged
    const activeProject = projects.find(p => p.id === activeId)
    if (!activeProject) {
      setActiveId(null)
      return
    }

    // Determine the new status (column id is the status)
    let newStatus = activeProject.status
    
    // Check if we dropped on a column
    const isOverColumn = columns.some(col => col.id === overId)
    if (isOverColumn) {
      newStatus = overId
    } else {
      // Dropped on another card - get that card's status
      const overProject = projects.find(p => p.id === overId)
      if (overProject) {
        newStatus = overProject.status
      }
    }

    // Get all projects in the target column
    const targetProjects = projects.filter(p => 
      p.id === activeId ? newStatus : p.status === newStatus
    )

    // Calculate new position
    let newPosition = 0
    if (!isOverColumn && overId !== activeId) {
      const overIndex = targetProjects.findIndex(p => p.id === overId)
      newPosition = overIndex >= 0 ? overIndex : targetProjects.length
    } else {
      newPosition = targetProjects.length
    }

    // Optimistic update with visual feedback
    setIsUpdating(true)
    
    setProjects(prevProjects => {
      const updated = prevProjects.map(project => {
        if (project.id === activeId) {
          return { ...project, status: newStatus, position: newPosition }
        }
        return project
      })
      return updated
    })

    // Update database
    try {
      await updateProjectStatus(activeId, newStatus, newPosition)
    } catch (error) {
      console.error('Failed to update project:', error)
      // Revert on error
      setProjects(initialProjects)
    } finally {
      setIsUpdating(false)
    }
    
    setActiveId(null)
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const getProjectsByStatus = (status: string) => {
    return projects
      .filter(p => p.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null

  // Show static board while mounting to prevent hydration errors
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnProjects = getProjectsByStatus(column.id)
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className="bg-[#111111] border border-gray-800 rounded-t-lg px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">{column.title}</h2>
                  <span className="text-xs font-medium text-gray-500">
                    {columnProjects.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-[#111111] rounded-b-lg p-4 space-y-3 min-h-[500px]">
                {columnProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    Drop projects here
                  </div>
                ) : (
                  columnProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-white mb-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                          {project.clients?.name || 'Unknown Client'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="px-2 py-1 rounded font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30">
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
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Helper to get status badge colors
  const getStatusColors = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      backlog: { bg: 'bg-gray-700', text: 'text-gray-300' },
      in_progress: { bg: 'bg-blue-600', text: 'text-white' },
      in_review: { bg: 'bg-yellow-600', text: 'text-white' },
      done: { bg: 'bg-green-600', text: 'text-white' },
    }
    return statusMap[status] || statusMap.backlog
  }

  const getPriorityColors = (priority: string) => {
    const priorityMap: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-500', text: 'text-white' },
      medium: { bg: 'bg-blue-500', text: 'text-white' },
      high: { bg: 'bg-orange-500', text: 'text-white' },
      urgent: { bg: 'bg-red-500', text: 'text-white' },
    }
    return priorityMap[priority] || priorityMap.medium
  }

  return (
    <>
      {isUpdating && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <LoadingSpinner size="sm" />
          <span>Updating...</span>
        </div>
      )}
      
      {/* Desktop: Columns */}
      <div className="hidden lg:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => {
              const columnProjects = getProjectsByStatus(column.id)
              
              return (
                <DroppableColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  count={columnProjects.length}
                >
                  <SortableContext
                    items={columnProjects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnProjects.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                        Drop projects here
                      </div>
                    ) : (
                      columnProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => setSelectedProject(project)}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableColumn>
              )
            })}
          </div>

          <DragOverlay>
            {activeProject ? (
              <div className="bg-[#1a1a1a] border-2 border-[#4ECDC4] rounded-lg p-4 shadow-2xl opacity-80 cursor-grabbing transform rotate-3">
                <h3 className="font-semibold text-white mb-2">
                  {activeProject.name}
                </h3>
                {activeProject.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {activeProject.description}
                  </p>
                )}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                    {activeProject.clients?.name || 'Unknown Client'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="px-2 py-1 rounded font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30">
                    {activeProject.priority}
                  </span>
                  {activeProject.due_date && (
                    <span className="text-gray-400">
                      {new Date(activeProject.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile: Horizontal Scroll Columns */}
      <div className="lg:hidden pb-20">
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-4 min-w-max px-4 py-4">
            {columns.map((column) => {
              const columnProjects = getProjectsByStatus(column.id)
              
              return (
                <div key={column.id} className="w-[85vw] flex-shrink-0">
                  <div className="flex flex-col h-full">
                    {/* Column Header */}
                    <div className="bg-[#111111] border border-gray-800 rounded-t-lg px-4 py-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-white">{column.title}</h2>
                        <span className="text-xs font-medium text-gray-500">{columnProjects.length}</span>
                      </div>
                    </div>
                    
                    {/* Column Content */}
                    <div className="bg-[#111111] border-l border-r border-b border-gray-800 rounded-b-lg p-4 space-y-3 min-h-[400px]">
                      {columnProjects.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                          No projects
                        </div>
                      ) : (
                        columnProjects.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => setSelectedProject(project)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={(updatedProject) => {
            // Update local state immediately
            setProjects(prevProjects =>
              prevProjects.map(p =>
                p.id === updatedProject.id ? { ...p, ...updatedProject } : p
              )
            )
            // Update the selected project so modal shows new data
            setSelectedProject(selectedProject ? { ...selectedProject, ...updatedProject } : updatedProject)
          }}
          onDelete={(projectId) => {
            // Remove project from local state immediately
            setProjects(prevProjects =>
              prevProjects.filter(p => p.id !== projectId)
            )
            // Modal will close automatically via onClose in handleDelete
          }}
        />
      )}
    </>
  )
}
