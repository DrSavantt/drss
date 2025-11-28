'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { KanbanBoard } from './kanban-board'

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

interface ProjectsBoardClientProps {
  initialProjects: Project[]
}

export function ProjectsBoardClient({ initialProjects }: ProjectsBoardClientProps) {
  // Load filter preferences from localStorage
  const [filterClient, setFilterClient] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projectsBoard_filterClient') || 'all'
    }
    return 'all'
  })
  const [filterPriority, setFilterPriority] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projectsBoard_filterPriority') || 'all'
    }
    return 'all'
  })
  const [dueDateRange, setDueDateRange] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projectsBoard_dueDateRange') || 'all'
    }
    return 'all'
  })
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projectsBoard_sortBy') || 'position'
    }
    return 'position'
  })

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('projectsBoard_filterClient', filterClient)
  }, [filterClient])

  useEffect(() => {
    localStorage.setItem('projectsBoard_filterPriority', filterPriority)
  }, [filterPriority])

  useEffect(() => {
    localStorage.setItem('projectsBoard_dueDateRange', dueDateRange)
  }, [dueDateRange])

  useEffect(() => {
    localStorage.setItem('projectsBoard_sortBy', sortBy)
  }, [sortBy])

  // Get unique clients
  const uniqueClients = useMemo(() => {
    const clients = initialProjects
      .map(p => p.clients?.name)
      .filter((name): name is string => name !== null && name !== undefined)
    return Array.from(new Set(clients)).sort()
  }, [initialProjects])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterClient !== 'all') count++
    if (filterPriority !== 'all') count++
    if (dueDateRange !== 'all') count++
    return count
  }, [filterClient, filterPriority, dueDateRange])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilterClient('all')
    setFilterPriority('all')
    setDueDateRange('all')
    setSortBy('position')
    localStorage.removeItem('projectsBoard_filterClient')
    localStorage.removeItem('projectsBoard_filterPriority')
    localStorage.removeItem('projectsBoard_dueDateRange')
    localStorage.removeItem('projectsBoard_sortBy')
  }, [])

  // Remove individual filter
  const removeFilter = useCallback((filterType: string) => {
    switch (filterType) {
      case 'client':
        setFilterClient('all')
        break
      case 'priority':
        setFilterPriority('all')
        break
      case 'dueDate':
        setDueDateRange('all')
        break
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Filter Status & Clear Button */}
      {activeFiltersCount > 0 && (
        <div className="bg-charcoal rounded-lg border border-red-primary p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active:
              </span>
              {filterClient !== 'all' && (
                <button
                  onClick={() => removeFilter('client')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Client: {filterClient}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {filterPriority !== 'all' && (
                <button
                  onClick={() => removeFilter('priority')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Priority: {filterPriority}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {dueDateRange !== 'all' && (
                <button
                  onClick={() => removeFilter('dueDate')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Due: {dueDateRange === 'week' ? 'Next 7 days' : dueDateRange === 'month' ? 'Next 30 days' : dueDateRange === 'overdue' ? 'Overdue' : 'No due date'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-red-primary hover:text-red-bright transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-charcoal rounded-lg border border-mid-gray p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Client Filter */}
          <div>
            <label htmlFor="client-filter" className="block text-sm font-medium text-silver mb-1">
              Filter by Client
            </label>
            <select
              id="client-filter"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-silver mb-1">
              Filter by Priority
            </label>
            <select
              id="priority-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Due Date Filter */}
          <div>
            <label htmlFor="due-date-filter" className="block text-sm font-medium text-silver mb-1">
              Filter by Due Date
            </label>
            <select
              id="due-date-filter"
              value={dueDateRange}
              onChange={(e) => setDueDateRange(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="all">All Dates</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
              <option value="overdue">Overdue</option>
              <option value="none">No Due Date</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-silver mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="position">Manual Order</option>
              <option value="due-date">Due Date (Soonest First)</option>
              <option value="priority">Priority</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        initialProjects={initialProjects}
        filterClient={filterClient}
        filterPriority={filterPriority}
        dueDateRange={dueDateRange}
        sortBy={sortBy}
      />
    </div>
  )
}
