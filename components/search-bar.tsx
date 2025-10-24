'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  type: 'client' | 'project' | 'content'
  subtitle?: string
  url: string
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    
    // Simulate search with timeout (replace with actual API call later)
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
        setIsOpen(true)
        setLoading(false)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  function handleResultClick() {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const typeColors = {
    client: 'bg-purple-100 text-purple-800',
    project: 'bg-blue-100 text-blue-800',
    content: 'bg-green-100 text-green-800',
  }

  const typeLabels = {
    client: 'Client',
    project: 'Project',
    content: 'Content',
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 px-2 py-1 text-xs font-medium rounded-full ${
                        typeColors[result.type]
                      }`}
                    >
                      {typeLabels[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
