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

  // Update type colors
  const typeColors = {
    client: 'bg-[#4ECDC4]/20 text-[#4ECDC4]',
    project: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
    content: 'bg-[#FFE66D]/20 text-[#FFE66D]',
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
          className="w-full rounded-lg border border-white/10 bg-[#1a1f2e] px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-[#4ECDC4] focus:outline-none focus:ring-1 focus:ring-[#4ECDC4] transition-all duration-200"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-md bg-[#252d3d] shadow-lg border border-white/10 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-[#1a1f2e] transition-colors"
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
                      <p className="text-sm font-medium text-white truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-400 truncate">
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
