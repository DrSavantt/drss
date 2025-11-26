'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getClientName } from '@/lib/supabase/types'

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

export function ContentLibraryClient({ initialContent }: ContentLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')

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

  return (
    <div className="space-y-6">
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
          Showing {filteredContent.length} of {initialContent.length} items
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-charcoal rounded-lg border border-mid-gray">
          <p className="text-silver">No content matches your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/content/${item.id}`}
              className="group bg-charcoal rounded-lg border border-mid-gray p-4 hover:border-red-bright hover:bg-dark-gray transition-all"
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
          ))}
        </div>
      )}
    </div>
  )
}
