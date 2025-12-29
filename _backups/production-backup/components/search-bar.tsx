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

  // Update type colors to use semantic colors
  const typeColors = {
    client: 'bg-info/20 text-info',
    project: 'bg-warning/20 text-warning',
    content: 'bg-success/20 text-success',
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
          className="w-full rounded-lg border border-mid-gray bg-dark-gray px-3 py-1.5 text-sm text-foreground placeholder-slate focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary transition-all duration-200"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-md bg-charcoal shadow-lg border border-mid-gray max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-dark-gray transition-colors"
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
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-silver truncate">
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
