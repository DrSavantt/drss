'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { updateProjectStatus } from '@/app/actions/projects'
import { ProjectCard } from './project-card'
import { DroppableColumn } from './droppable-column'
import { LoadingSpinner } from '@/components/loading-spinner'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  position: number
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

  // Only render drag & drop after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'in_review', title: 'In Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
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
              <div className={`${column.color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{column.title}</h2>
                  <span className="text-sm font-medium text-gray-600">
                    {columnProjects.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-b-lg p-4 space-y-3 min-h-[500px]">
                {columnProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    No projects
                  </div>
                ) : (
                  columnProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {project.clients?.name || 'Unknown Client'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
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
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {isUpdating && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <LoadingSpinner size="sm" />
          <span>Updating...</span>
        </div>
      )}
      
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
              color={column.color}
              count={columnProjects.length}
            >
              <SortableContext
                items={columnProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    No projects
                  </div>
                ) : (
                  columnProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-lg opacity-90">
            <h3 className="font-semibold text-gray-900">{activeProject.name}</h3>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  )
}
