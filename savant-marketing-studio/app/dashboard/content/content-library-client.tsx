'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getClientName } from '@/lib/supabase/types'
import { BulkActionBar } from '@/components/bulk-action-bar'
import { ConfirmationModal } from '@/components/confirmation-modal'
import { ProjectSelectorModal } from '@/components/project-selector-modal'
import { Toast } from '@/components/toast'
import { bulkDeleteContent, bulkArchiveContent, bulkChangeProject } from '@/app/actions/content'
import { useRouter } from 'next/navigation'

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

interface Project {
  id: string
  name: string
  clients: {
    name: string
  } | null
}

interface ContentLibraryClientProps {
  initialContent: ContentAsset[]
  projects: Project[]
}

export function ContentLibraryClient({ initialContent, projects }: ContentLibraryClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Get unique clients and types
  const uniqueClients = useMemo(() => {
    const clients = initialContent
      .map(c => c.clients?.name)
      .filter((name): name is string => name !== null && name !== undefined)
    return Array.from(new Set(clients)).sort()
  }, [initialContent])

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
    return initialContent.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === 'all' || item.asset_type === selectedType
      const matchesClient = selectedClient === 'all' || item.clients?.name === selectedClient

      return matchesSearch && matchesType && matchesClient
    })
  }, [initialContent, searchQuery, selectedType, selectedClient])

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredContent.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredContent.map(item => item.id))
    }
  }

  const handleSelectItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  // Bulk action handlers
  const handleBulkDelete = async () => {
    setIsLoading(true)
    try {
      const result = await bulkDeleteContent(selectedIds)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: `${result.count} ${result.count === 1 ? 'item' : 'items'} deleted successfully`, type: 'success' })
        setSelectedIds([])
        setShowDeleteModal(false)
        router.refresh()
      }
    } catch (error) {
      setToast({ message: 'Failed to delete items', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkArchive = async () => {
    setIsLoading(true)
    try {
      const result = await bulkArchiveContent(selectedIds)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: `${result.count} ${result.count === 1 ? 'item' : 'items'} archived successfully`, type: 'success' })
        setSelectedIds([])
        setShowArchiveModal(false)
        router.refresh()
      }
    } catch (error) {
      setToast({ message: 'Failed to archive items', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkChangeProject = async (projectId: string | null) => {
    setIsLoading(true)
    try {
      const result = await bulkChangeProject(selectedIds, projectId)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        const projectName = projectId
          ? projects.find(p => p.id === projectId)?.name || 'selected project'
          : 'No Project'
        setToast({
          message: `${result.count} ${result.count === 1 ? 'item' : 'items'} moved to ${projectName}`,
          type: 'success'
        })
        setSelectedIds([])
        setShowProjectModal(false)
        router.refresh()
      }
    } catch (error) {
      setToast({ message: 'Failed to update items', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const isAllSelected = filteredContent.length > 0 && selectedIds.length === filteredContent.length

  return (
    <div className="space-y-6 pb-24">
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

        {/* Results Count and Select All */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate">
            Showing {filteredContent.length} of {initialContent.length} items
          </div>
          {filteredContent.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-red-primary hover:text-red-bright transition-colors"
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-mid-gray bg-dark-gray text-red-primary focus:ring-red-primary focus:ring-offset-0"
              />
              <span>Select All</span>
            </button>
          )}
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
            const isSelected = selectedIds.includes(item.id)

            return (
              <div
                key={item.id}
                className={`relative group bg-charcoal rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-red-primary bg-red-primary/5'
                    : 'border-mid-gray hover:border-red-bright hover:bg-dark-gray'
                }`}
              >
                {/* Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectItem(item.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-mid-gray bg-dark-gray text-red-primary focus:ring-red-primary focus:ring-offset-0 cursor-pointer"
                  />
                </div>

                {/* Content (clickable link) */}
                <Link
                  href={`/dashboard/content/${item.id}`}
                  className="block pl-8"
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
            )
          })}
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onDelete={() => setShowDeleteModal(true)}
        onArchive={() => setShowArchiveModal(true)}
        onChangeProject={() => setShowProjectModal(true)}
        onClear={handleClearSelection}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Items"
        message={`Are you sure you want to delete ${selectedIds.length} ${selectedIds.length === 1 ? 'item' : 'items'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isLoading}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleBulkArchive}
        title="Archive Items"
        message={`Are you sure you want to archive ${selectedIds.length} ${selectedIds.length === 1 ? 'item' : 'items'}? You can view archived items later.`}
        confirmText="Archive"
        confirmVariant="primary"
        isLoading={isLoading}
      />

      {/* Project Selector Modal */}
      <ProjectSelectorModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onConfirm={handleBulkChangeProject}
        projects={projects}
        isLoading={isLoading}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
