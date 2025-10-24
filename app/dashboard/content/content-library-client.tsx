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
    note: 'bg-green-100 text-green-800',
    research_pdf: 'bg-purple-100 text-purple-800',
    ad_copy: 'bg-orange-100 text-orange-800',
    email: 'bg-blue-100 text-blue-800',
    blog_post: 'bg-pink-100 text-pink-800',
    landing_page: 'bg-yellow-100 text-yellow-800',
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Content Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredContent.length} of {initialContent.length} items
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No content matches your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/content/${item.id}`}
              className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    typeColors[item.asset_type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.asset_type.replace('_', ' ')}
                </span>
                {getClientName(item.clients) && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {getClientName(item.clients)}
                  </span>
                )}
                {item.projects && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {item.projects.name}
                  </span>
                )}
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500">
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
