'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { getClientName } from '@/lib/supabase/types'
import { bulkDeleteContent, bulkArchiveContent, bulkChangeProject, getAllProjects } from '@/app/actions/content'
import { BulkActionBar } from '@/app/components/bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { ProjectSelectorModal } from '@/app/components/project-selector-modal'
import { ToastContainer } from '@/app/components/toast'

interface ContentAsset {
  id: string
  title: string
  asset_type: string
  created_at: string
  clients: {
    name: string
  } | null
  projects: {
    name: string
  } | null
}

interface ContentLibraryClientProps {
  initialContent: ContentAsset[]
}

interface Project {
  id: string
  name: string
  clients: {
    name: string
  } | null
}

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function ContentLibraryClient({ initialContent }: ContentLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [content, setContent] = useState<ContentAsset[]>(initialContent)

  // Toast helpers
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Get unique clients and types
  const uniqueClients = useMemo(() => {
    const clients = content
      .map(c => c.clients?.name)
      .filter((name): name is string => name !== null && name !== undefined)
    return Array.from(new Set(clients)).sort()
  }, [content])

  const assetTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'note', label: 'Notes' },
    { value: 'research_pdf', label: 'Research PDFs' },
    { value: 'ad_copy', label: 'Ad Copy' },
    { value: 'email', label: 'Emails' },
    { value: 'blog_post', label: 'Blog Posts' },
    { value: 'landing_page', label: 'Landing Pages' },
  ]

  // Updated badge colors using semantic colors
  const typeColors = {
    note: 'bg-success/20 text-success border border-success/30',
    research_pdf: 'bg-info/20 text-info border border-info/30',
    ad_copy: 'bg-warning/20 text-warning border border-warning/30',
    email: 'bg-info/20 text-info border border-info/30',
    blog_post: 'bg-red-primary/20 text-red-primary border border-red-primary/30',
    landing_page: 'bg-warning/20 text-warning border border-warning/30',
  }

  // Filter content
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === 'all' || item.asset_type === selectedType
      const matchesClient = selectedClient === 'all' || item.clients?.name === selectedClient
      
      return matchesSearch && matchesType && matchesClient
    })
  }, [content, searchQuery, selectedType, selectedClient])

  // Checkbox handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredContent.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredContent.map(item => item.id)))
    }
  }, [selectedIds.size, filteredContent])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Load projects when needed
  const loadProjects = useCallback(async () => {
    const projectsList = await getAllProjects()
    // Transform Supabase array response to single object
    const transformedProjects = projectsList.map((p) => ({
      id: p.id,
      name: p.name,
      clients: Array.isArray(p.clients) && p.clients.length > 0 ? p.clients[0] : null
    }))
    setProjects(transformedProjects)
  }, [])

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await bulkDeleteContent(Array.from(selectedIds))
      if (result.error) {
        addToast(result.error, 'error')
      } else {
        addToast(`${result.count} ${result.count === 1 ? 'item' : 'items'} deleted`, 'success')
        setContent(prev => prev.filter(item => !selectedIds.has(item.id)))
        clearSelection()
      }
    } catch {
      addToast('Failed to delete items', 'error')
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
    }
  }, [selectedIds, addToast, clearSelection])

  // Bulk archive handler
  const handleBulkArchive = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await bulkArchiveContent(Array.from(selectedIds))
      if (result.error) {
        addToast(result.error, 'error')
      } else {
        addToast(`${result.count} ${result.count === 1 ? 'item' : 'items'} archived`, 'success')
        setContent(prev => prev.filter(item => !selectedIds.has(item.id)))
        clearSelection()
      }
    } catch {
      addToast('Failed to archive items', 'error')
    } finally {
      setIsLoading(false)
      setIsArchiveModalOpen(false)
    }
  }, [selectedIds, addToast, clearSelection])

  // Bulk change project handler
  const handleBulkChangeProject = useCallback(async (projectId: string | null) => {
    setIsLoading(true)
    try {
      const result = await bulkChangeProject(Array.from(selectedIds), projectId)
      if (result.error) {
        addToast(result.error, 'error')
      } else {
        const projectName = projects.find(p => p.id === projectId)?.name || 'No Project'
        addToast(`Moved ${result.count} ${result.count === 1 ? 'item' : 'items'} to ${projectName}`, 'success')
        
        // Update local content state
        setContent(prev => prev.map(item => {
          if (selectedIds.has(item.id)) {
            const project = projects.find(p => p.id === projectId)
            return {
              ...item,
              projects: project ? { name: project.name } : null
            }
          }
          return item
        }))
        
        clearSelection()
      }
    } catch {
      addToast('Failed to change project', 'error')
    } finally {
      setIsLoading(false)
      setIsProjectModalOpen(false)
    }
  }, [selectedIds, projects, addToast, clearSelection])

  // Modal open handlers
  const openDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(true)
  }, [])

  const openArchiveModal = useCallback(() => {
    setIsArchiveModalOpen(true)
  }, [])

  const openProjectModal = useCallback(async () => {
    await loadProjects()
    setIsProjectModalOpen(true)
  }, [loadProjects])

  return (
    <div className="space-y-6 pb-24">
      {/* Select All Checkbox */}
      {filteredContent.length > 0 && (
        <div className="flex items-center gap-3 bg-charcoal rounded-lg border border-mid-gray p-4">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedIds.size === filteredContent.length && filteredContent.length > 0}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-mid-gray bg-dark-gray accent-red-primary cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
            Select All ({filteredContent.length} items)
          </label>
        </div>
      )}

      {/* Filters */}
      <div className="bg-charcoal rounded-lg border border-mid-gray p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-silver mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-silver mb-1">
              Content Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              {assetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-silver mb-1">
              Client
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
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
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate">
          Showing {filteredContent.length} of {content.length} items
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-charcoal rounded-lg border border-mid-gray">
          <p className="text-silver">No content matches your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => {
            const isSelected = selectedIds.has(item.id)
            return (
              <div
                key={item.id}
                className={`group bg-charcoal rounded-lg border-2 p-4 transition-all ${
                  isSelected 
                    ? 'border-red-primary bg-red-primary/5' 
                    : 'border-mid-gray hover:border-red-bright hover:bg-dark-gray'
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelection(item.id)
                    }}
                    className="mt-1 w-4 h-4 rounded border-mid-gray bg-dark-gray accent-red-primary cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Link
                    href={`/dashboard/content/${item.id}`}
                    className="flex-1 min-w-0"
                  >
                    {/* Title */}
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-red-primary transition-colors">
                      {item.title}
                    </h3>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          typeColors[item.asset_type as keyof typeof typeColors] || 'bg-slate/20 text-slate border border-slate/30'
                        }`}
                      >
                        {item.asset_type.replace('_', ' ')}
                      </span>
                      {getClientName(item.clients) && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate/20 text-foreground border border-slate/30">
                          {getClientName(item.clients)}
                        </span>
                      )}
                      {item.projects && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-info border border-info/30">
                          {item.projects.name}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-xs text-slate">
                      Created {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={openDeleteModal}
        onArchive={openArchiveModal}
        onChangeProject={openProjectModal}
        onCancel={clearSelection}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Items"
        message={`Are you sure you want to delete ${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isLoading}
        isDanger={true}
      />

      <ConfirmationModal
        isOpen={isArchiveModalOpen}
        title="Archive Items"
        message={`Are you sure you want to archive ${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'}?`}
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={handleBulkArchive}
        onCancel={() => setIsArchiveModalOpen(false)}
        isLoading={isLoading}
        isDanger={false}
      />

      {/* Project Selector Modal */}
      <ProjectSelectorModal
        isOpen={isProjectModalOpen}
        projects={projects}
        onSelect={handleBulkChangeProject}
        onCancel={() => setIsProjectModalOpen(false)}
        isLoading={isLoading}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
