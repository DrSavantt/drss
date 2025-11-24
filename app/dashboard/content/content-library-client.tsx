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

  const typeColors = {
    note: 'bg-green-600/20 text-green-300 border border-green-600/30',
    research_pdf: 'bg-purple-600/20 text-purple-300 border border-purple-600/30',
    ad_copy: 'bg-orange-600/20 text-orange-300 border border-orange-600/30',
    email: 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
    blog_post: 'bg-pink-600/20 text-pink-300 border border-pink-600/30',
    landing_page: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
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
      <div className="bg-card rounded-lg border border-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="block w-full rounded-md bg-input border border-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1">
              Content Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full rounded-md bg-input border border-input px-3 py-2 text-sm text-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
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
            <label htmlFor="client" className="block text-sm font-medium text-muted-foreground mb-1">
              Client
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="block w-full rounded-md bg-input border border-input px-3 py-2 text-sm text-foreground focus:border-[#4ECDC4]/50 focus:outline-none"
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
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredContent.length} of {initialContent.length} items
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-card border border-card rounded-lg">
          <p className="text-muted-foreground">No content matches your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/content/${item.id}`}
              className="group bg-card rounded-lg border border-card p-4 hover:border-[#4ECDC4]/50 transition-all"
            >
              {/* Title */}
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#4ECDC4] transition-colors">
                {item.title}
              </h3>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    typeColors[item.asset_type as keyof typeof typeColors] || 'bg-gray-700/50 text-gray-300'
                  }`}
                >
                  {item.asset_type.replace('_', ' ')}
                </span>
                {getClientName(item.clients) && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                    {getClientName(item.clients)}
                  </span>
                )}
                {item.projects && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-600/20 text-blue-300 border border-blue-600/30">
                    {item.projects.name}
                  </span>
                )}
              </div>

              {/* Date */}
              <p className="text-xs text-muted-foreground">
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
