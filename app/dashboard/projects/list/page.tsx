'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, ChevronDown, Search } from 'lucide-react'
import { motion } from 'framer-motion'

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

const statusColors = {
  backlog: { bg: 'bg-gray-700/50', text: 'text-gray-300' },
  in_progress: { bg: 'bg-blue-600/50', text: 'text-blue-300' },
  in_review: { bg: 'bg-yellow-600/50', text: 'text-yellow-300' },
  done: { bg: 'bg-green-600/50', text: 'text-green-300' },
}

const statusLabels = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const priorityColors = {
  low: 'bg-gray-700/50 text-gray-300',
  medium: 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
  high: 'bg-orange-600/20 text-orange-300 border border-orange-600/30',
  urgent: 'bg-red-600/20 text-red-300 border border-red-600/30',
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'priority' | 'due_date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Get unique clients for filter
  const uniqueClients = Array.from(
    new Set(projects.map(p => p.clients?.name).filter(Boolean))
  )

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (filterStatus !== 'all' && project.status !== filterStatus) return false
      if (filterClient !== 'all' && project.clients?.name !== filterClient) return false
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 }
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
                      (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          break
        case 'due_date':
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0
          comparison = dateA - dateB
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ECDC4]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-gray-400">
            Manage all projects across clients
          </p>
        </div>

        {/* View Toggle */}
        <Link
          href="/dashboard/projects/board"
          className="flex items-center gap-2 bg-[#1a1f2e] border border-gray-700/50 text-white px-4 py-2 rounded-lg hover:border-[#4ECDC4]/50 transition-all"
        >
          <LayoutGrid size={18} />
          <span className="hidden sm:inline">Board View</span>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-card rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-input rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-input border border-input rounded-lg px-4 py-2 text-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-input border border-input rounded-lg px-4 py-2 text-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
          >
            <option value="all">All Clients</option>
            {uniqueClients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-center md:justify-start text-muted-foreground text-sm">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card border border-card rounded-lg overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {projects.length === 0
                ? "Create a project from a client's page to get started."
                : "Try adjusting your filters or search query."}
            </p>
            {projects.length === 0 && (
              <Link
                href="/dashboard/clients"
                className="inline-block bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
              >
                Go to Clients
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background/40 border-b border-card">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#4ECDC4] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Project Name
                    {sortBy === 'name' && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#4ECDC4] transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortBy === 'status' && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#4ECDC4] transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-2">
                    Priority
                    {sortBy === 'priority' && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#4ECDC4] transition-colors"
                  onClick={() => handleSort('due_date')}
                >
                  <div className="flex items-center gap-2">
                    Due Date
                    {sortBy === 'due_date' && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card">
              {filteredProjects.map((project) => (
                <motion.tr
                  key={project.id}
                  className="hover:bg-muted/10 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => window.location.href = `/dashboard/projects/board`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-foreground font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                      {project.clients?.name || 'Unknown Client'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                      statusColors[project.status as keyof typeof statusColors].bg
                    } ${statusColors[project.status as keyof typeof statusColors].text}`}>
                      {statusLabels[project.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                      priorityColors[project.priority as keyof typeof priorityColors]
                    }`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {project.due_date
                      ? new Date(project.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="bg-card border border-card rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {projects.length === 0
                ? "Create a project from a client's page to get started."
                : "Try adjusting your filters or search query."}
            </p>
            {projects.length === 0 && (
              <Link
                href="/dashboard/clients"
                className="inline-block bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
              >
                Go to Clients
              </Link>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link
              key={project.id}
              href="/dashboard/projects/board"
              className="block bg-card border border-card rounded-lg p-4 hover:border-[#4ECDC4]/50 transition-all"
            >
              <h3 className="text-foreground font-semibold mb-2">{project.name}</h3>

              {project.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                  {project.clients?.name || 'Unknown Client'}
                </span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  statusColors[project.status as keyof typeof statusColors].bg
                } ${statusColors[project.status as keyof typeof statusColors].text}`}>
                  {statusLabels[project.status as keyof typeof statusLabels]}
                </span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  priorityColors[project.priority as keyof typeof priorityColors]
                }`}>
                  {project.priority}
                </span>
              </div>

              {project.due_date && (
                <div className="text-xs text-muted-foreground">
                  Due: {new Date(project.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
