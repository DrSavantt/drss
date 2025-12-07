'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  MouseSensor,
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
  filterClient?: string
  filterPriority?: string
  dueDateRange?: string
  sortBy?: string
}

export function KanbanBoard({ 
  initialProjects,
  filterClient = 'all',
  filterPriority = 'all',
  dueDateRange = 'all',
  sortBy = 'position'
}: KanbanBoardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Apply filters and sorting
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Filter by client
    if (filterClient !== 'all') {
      filtered = filtered.filter(p => p.clients?.name === filterClient)
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(p => p.priority === filterPriority)
    }

    // Filter by due date range
    if (dueDateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(p => {
        if (!p.due_date) return dueDateRange === 'none'
        
        const dueDate = new Date(p.due_date)
        switch (dueDateRange) {
          case 'week':
            return dueDate <= new Date(now.setDate(now.getDate() + 7))
          case 'month':
            return dueDate <= new Date(now.setMonth(now.getMonth() + 1))
          case 'overdue':
            return dueDate < new Date()
          default:
            return true
        }
      })
    }

    // Sort projects
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due-date':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'position':
        default:
          return (a.position || 0) - (b.position || 0)
      }
    })
  }, [projects, filterClient, filterPriority, dueDateRange, sortBy])

  // Only render drag & drop after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long-press to drag (prevents scroll conflict)
        tolerance: 5, // 5px tolerance during long-press
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
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
      
      // Haptic feedback on successful drop
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 30])
      }
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
    return filteredAndSortedProjects.filter(p => p.status === status)
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
              {/* Column header styling */}
              <div className="bg-charcoal border border-mid-gray rounded-t-lg px-4 py-3 border-b border-mid-gray">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">{column.title}</h2>
                  <span className="text-xs font-medium text-slate">{columnProjects.length}</span>
                </div>
              </div>
              {/* Column content styling */}
              <div className="bg-dark-gray border border-mid-gray rounded-b-lg p-4 space-y-3 min-h-[500px]">
                {columnProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-slate">
                    Drop projects here
                  </div>
                ) : (
                  columnProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-charcoal border border-mid-gray rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-foreground mb-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-silver mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-info/20 text-info border border-info/30">
                          {project.clients?.name || 'Unknown Client'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="px-2 py-1 rounded font-medium bg-info/20 text-info border border-info/30">
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

  // Status and priority color helpers available for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColors = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      backlog: { bg: 'bg-slate', text: 'text-foreground' },
      in_progress: { bg: 'bg-info', text: 'text-foreground' },
      in_review: { bg: 'bg-warning', text: 'text-foreground' },
      done: { bg: 'bg-success', text: 'text-foreground' },
    }
    return statusMap[status] || statusMap.backlog
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getPriorityColors = (priority: string) => {
    const priorityMap: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-slate', text: 'text-foreground' },
      medium: { bg: 'bg-info', text: 'text-foreground' },
      high: { bg: 'bg-warning', text: 'text-foreground' },
      urgent: { bg: 'bg-red-primary', text: 'text-foreground' },
    }
    return priorityMap[priority] || priorityMap.medium
  }

  return (
    <>
      {isUpdating && (
        <div className="fixed top-4 right-4 bg-info text-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
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
                      <div className="flex items-center justify-center h-32 text-sm text-slate">
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
              <div className="bg-charcoal border-2 border-red-primary rounded-lg p-4 shadow-2xl opacity-80 cursor-grabbing transform rotate-3">
                <h3 className="font-semibold text-foreground mb-2">
                  {activeProject.name}
                </h3>
                {activeProject.description && (
                  <p className="text-sm text-silver mb-3 line-clamp-2">
                    {activeProject.description}
                  </p>
                )}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-info/20 text-info border border-info/30">
                    {activeProject.clients?.name || 'Unknown Client'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="px-2 py-1 rounded font-medium bg-info/20 text-info border border-info/30">
                    {activeProject.priority}
                  </span>
                  {activeProject.due_date && (
                    <span className="text-slate">
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

      {/* Mobile: Horizontal Scroll Columns with Touch Drag */}
      <div className="lg:hidden pb-20">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-4 min-w-max px-4 py-4">
              {columns.map((column) => {
                const columnProjects = getProjectsByStatus(column.id)
                
                return (
                  <div key={column.id} className="w-[85vw] flex-shrink-0">
                    <DroppableColumn
                      id={column.id}
                      title={column.title}
                      count={columnProjects.length}
                    >
                      <SortableContext
                        items={columnProjects.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnProjects.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-sm text-slate">
                            Long-press to drag
                          </div>
                        ) : (
                          columnProjects.map((project) => (
                            <div key={project.id} className="touch-manipulation">
                              <ProjectCard
                                project={project}
                                onClick={() => setSelectedProject(project)}
                              />
                            </div>
                          ))
                        )}
                      </SortableContext>
                    </DroppableColumn>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile Drag Overlay */}
          <DragOverlay>
            {activeProject ? (
              <div className="w-[80vw] bg-charcoal border-2 border-red-primary rounded-lg p-4 shadow-2xl transform scale-105 touch-none">
                <h3 className="font-semibold text-foreground mb-2">
                  {activeProject.name}
                </h3>
                {activeProject.description && (
                  <p className="text-sm text-silver mb-3 line-clamp-2">
                    {activeProject.description}
                  </p>
                )}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-info/20 text-info border border-info/30">
                    {activeProject.clients?.name || 'Unknown Client'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="px-2 py-1 rounded font-medium bg-info/20 text-info border border-info/30">
                    {activeProject.priority}
                  </span>
                  {activeProject.due_date && (
                    <span className="text-slate">
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
