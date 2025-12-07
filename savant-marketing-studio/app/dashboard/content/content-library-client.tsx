'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getClientName } from '@/lib/supabase/types'
import { bulkDeleteContent, bulkArchiveContent, bulkUnarchiveContent, bulkChangeProject, getAllProjects } from '@/app/actions/content'
import { BulkActionBar } from '@/app/components/bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { ProjectSelectorModal } from '@/app/components/project-selector-modal'
import { ToastContainer } from '@/app/components/toast'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { metroContainerVariants, metroItemVariants } from '@/lib/animations'
import { useScreenSize } from '@/hooks/use-mobile'

interface ContentAsset {
  id: string
  title: string
  asset_type: string
  created_at: string
  is_archived?: boolean
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
  const { isMobile } = useScreenSize()
  
  // Load preferences from localStorage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contentLibrary_selectedType') || 'all'
    }
    return 'all'
  })
  const [selectedClient, setSelectedClient] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contentLibrary_selectedClient') || 'all'
    }
    return 'all'
  })
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contentLibrary_sortBy') || 'newest'
    }
    return 'newest'
  })
  const [dateRange, setDateRange] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contentLibrary_dateRange') || 'all'
    }
    return 'all'
  })
  const [showArchived, setShowArchived] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contentLibrary_showArchived') === 'true'
    }
    return false
  })
  
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [content, setContent] = useState<ContentAsset[]>(initialContent)

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('contentLibrary_selectedType', selectedType)
  }, [selectedType])

  useEffect(() => {
    localStorage.setItem('contentLibrary_selectedClient', selectedClient)
  }, [selectedClient])

  useEffect(() => {
    localStorage.setItem('contentLibrary_sortBy', sortBy)
  }, [sortBy])

  useEffect(() => {
    localStorage.setItem('contentLibrary_dateRange', dateRange)
  }, [dateRange])

  useEffect(() => {
    localStorage.setItem('contentLibrary_showArchived', showArchived.toString())
  }, [showArchived])

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

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedType('all')
    setSelectedClient('all')
    setSortBy('newest')
    setDateRange('all')
    setShowArchived(false)
    localStorage.removeItem('contentLibrary_selectedType')
    localStorage.removeItem('contentLibrary_selectedClient')
    localStorage.removeItem('contentLibrary_sortBy')
    localStorage.removeItem('contentLibrary_dateRange')
    localStorage.removeItem('contentLibrary_showArchived')
    addToast('All filters cleared', 'info')
  }, [addToast])

  // Calculate date range
  const getDateRangeFilter = useCallback((dateRangeValue: string) => {
    const now = new Date()
    switch (dateRangeValue) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7))
      case 'month':
        return new Date(now.setDate(now.getDate() - 30))
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3))
      default:
        return null
    }
  }, [])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedType !== 'all') count++
    if (selectedClient !== 'all') count++
    if (dateRange !== 'all') count++
    if (showArchived) count++
    return count
  }, [selectedType, selectedClient, dateRange, showArchived])

  // Filter and sort content
  const filteredAndSortedContent = useMemo(() => {
    // First, filter
    const filtered = content.filter(item => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Type filter
      const matchesType = selectedType === 'all' || item.asset_type === selectedType
      
      // Client filter
      const matchesClient = selectedClient === 'all' || item.clients?.name === selectedClient
      
      // Date range filter
      const dateRangeStart = getDateRangeFilter(dateRange)
      const matchesDateRange = !dateRangeStart || new Date(item.created_at) >= dateRangeStart
      
      // Archived filter - when toggle is OFF, hide archived items; when ON, show all
      const matchesArchived = showArchived || !item.is_archived
      
      return matchesSearch && matchesType && matchesClient && matchesDateRange && matchesArchived
    })

    // Then, sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'client':
          return (a.clients?.name || '').localeCompare(b.clients?.name || '')
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [content, searchQuery, selectedType, selectedClient, dateRange, showArchived, sortBy, getDateRangeFilter])

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
    if (selectedIds.size === filteredAndSortedContent.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedContent.map(item => item.id)))
    }
  }, [selectedIds.size, filteredAndSortedContent])

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
        // Update local state to mark items as archived
        setContent(prev => prev.map(item => 
          selectedIds.has(item.id) ? { ...item, is_archived: true } : item
        ))
        clearSelection()
      }
    } catch {
      addToast('Failed to archive items', 'error')
    } finally {
      setIsLoading(false)
      setIsArchiveModalOpen(false)
    }
  }, [selectedIds, addToast, clearSelection])

  // Bulk unarchive handler
  const handleBulkUnarchive = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await bulkUnarchiveContent(Array.from(selectedIds))
      if (result.error) {
        addToast(result.error, 'error')
      } else {
        addToast(`${result.count} ${result.count === 1 ? 'item' : 'items'} unarchived`, 'success')
        // Update local state to mark items as not archived
        setContent(prev => prev.map(item => 
          selectedIds.has(item.id) ? { ...item, is_archived: false } : item
        ))
        clearSelection()
      }
    } catch {
      addToast('Failed to unarchive items', 'error')
    } finally {
      setIsLoading(false)
      setIsUnarchiveModalOpen(false)
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

  // Check if any selected items are archived
  const hasArchivedItems = useMemo(() => {
    return Array.from(selectedIds).some(id => {
      const item = content.find(c => c.id === id)
      return item?.is_archived === true
    })
  }, [selectedIds, content])

  // Modal open handlers
  const openDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(true)
  }, [])

  const openArchiveModal = useCallback(() => {
    setIsArchiveModalOpen(true)
  }, [])

  const openUnarchiveModal = useCallback(() => {
    setIsUnarchiveModalOpen(true)
  }, [])

  const openProjectModal = useCallback(async () => {
    await loadProjects()
    setIsProjectModalOpen(true)
  }, [loadProjects])

  // Remove individual filter badges
  const removeFilter = useCallback((filterType: string) => {
    switch (filterType) {
      case 'type':
        setSelectedType('all')
        break
      case 'client':
        setSelectedClient('all')
        break
      case 'dateRange':
        setDateRange('all')
        break
      case 'archived':
        setShowArchived(false)
        break
    }
  }, [])

  return (
    <div className="space-y-6 pb-24">
      {/* Filter Status & Clear Button */}
      {activeFiltersCount > 0 && (
        <div className="bg-charcoal rounded-lg border border-red-primary p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active:
              </span>
              {selectedType !== 'all' && (
                <button
                  onClick={() => removeFilter('type')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Type: {assetTypes.find(t => t.value === selectedType)?.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {selectedClient !== 'all' && (
                <button
                  onClick={() => removeFilter('client')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Client: {selectedClient}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {dateRange !== 'all' && (
                <button
                  onClick={() => removeFilter('dateRange')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Date: {dateRange === 'week' ? 'Last 7 days' : dateRange === 'month' ? 'Last 30 days' : 'Last 3 months'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showArchived && (
                <button
                  onClick={() => removeFilter('archived')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 transition-colors"
                >
                  Show Archived
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

      {/* Select All Checkbox */}
      {filteredAndSortedContent.length > 0 && (
        <div className="flex items-center gap-3 bg-charcoal rounded-lg border border-mid-gray p-4">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedIds.size === filteredAndSortedContent.length && filteredAndSortedContent.length > 0}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-mid-gray bg-dark-gray accent-red-primary cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
            Select All ({filteredAndSortedContent.length} items)
          </label>
        </div>
      )}

      {/* Filters */}
      <div className="bg-charcoal rounded-lg border border-mid-gray p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Sort By */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-silver mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="client">Client Name</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-silver mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-sm text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>

          {/* Show Archived Toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-mid-gray bg-dark-gray accent-red-primary cursor-pointer"
              />
              <span className="text-sm font-medium text-foreground">Show Archived</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate">
          Showing {filteredAndSortedContent.length} of {content.length} items
        </div>
      </div>

      {/* Content Grid */}
      {filteredAndSortedContent.length === 0 ? (
        <div className="text-center py-12 bg-charcoal rounded-lg border border-mid-gray">
          <p className="text-silver">No content matches your filters</p>
        </div>
      ) : (
        <motion.div
          className={`grid gap-4 ${
            isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
          variants={metroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredAndSortedContent.map((item) => {
            const isSelected = selectedIds.has(item.id)
            return (
              <motion.div key={item.id} variants={metroItemVariants}>
                <SpotlightCard
                  className={`group p-4 transition-all h-full min-h-[44px] ${
                    isSelected 
                      ? 'border-2 border-red-primary bg-red-primary/5' 
                      : 'hover:border-red-bright/60'
                  }`}
                >
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
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-red-primary transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            typeColors[item.asset_type as keyof typeof typeColors] || 'bg-surface-highlight text-foreground border border-white/10'
                          }`}
                        >
                          {item.asset_type.replace('_', ' ')}
                        </span>
                        {item.is_archived && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning border border-warning/30">
                            Archived
                          </span>
                        )}
                        {getClientName(item.clients) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-surface-highlight text-foreground border border-white/10">
                            {getClientName(item.clients)}
                          </span>
                        )}
                        {item.projects && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-info border border-info/30">
                            {item.projects.name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate">
                        Created {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </Link>
                  </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={openDeleteModal}
        onArchive={openArchiveModal}
        onUnarchive={openUnarchiveModal}
        onChangeProject={openProjectModal}
        onCancel={clearSelection}
        hasArchivedItems={hasArchivedItems}
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

      <ConfirmationModal
        isOpen={isUnarchiveModalOpen}
        title="Unarchive Items"
        message={`Are you sure you want to unarchive ${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'}?`}
        confirmText="Unarchive"
        cancelText="Cancel"
        onConfirm={handleBulkUnarchive}
        onCancel={() => setIsUnarchiveModalOpen(false)}
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
