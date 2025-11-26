'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, FolderKanban, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  title: string
  type: 'client' | 'project' | 'content'
  subtitle?: string
  url: string
}

interface GroupedResults {
  clients: SearchResult[]
  projects: SearchResult[]
  content: SearchResult[]
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Group results by type
  const groupedResults: GroupedResults = {
    clients: results.filter(r => r.type === 'client').slice(0, 5),
    projects: results.filter(r => r.type === 'project').slice(0, 5),
    content: results.filter(r => r.type === 'content').slice(0, 5),
  }

  const totalResults = groupedResults.clients.length + groupedResults.projects.length + groupedResults.content.length
  const allResults = [...groupedResults.clients, ...groupedResults.projects, ...groupedResults.content]

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
        setQuery('')
        setResults([])
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Navigate to selected result
  const navigateToSelected = useCallback(() => {
    if (allResults[selectedIndex]) {
      const result = allResults[selectedIndex]
      router.push(result.url)
      setIsOpen(false)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [selectedIndex, allResults, router])

  // Handle keyboard navigation within the palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (totalResults === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % totalResults)
      scrollToSelected((selectedIndex + 1) % totalResults)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults)
      scrollToSelected((selectedIndex - 1 + totalResults) % totalResults)
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      navigateToSelected()
    }
  }

  // Scroll selected item into view
  const scrollToSelected = (index: number) => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[index] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }

  // Handle result click
  const handleResultClick = (index: number) => {
    setSelectedIndex(index)
    navigateToSelected()
  }

  // Get icon for result type
  const getIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="w-4 h-4" />
      case 'project':
        return <FolderKanban className="w-4 h-4" />
      case 'content':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-500/20 text-blue-400'
      case 'project':
        return 'bg-amber-500/20 text-amber-400'
      case 'content':
        return 'bg-emerald-500/20 text-emerald-400'
      default:
        return 'bg-slate/20 text-slate'
    }
  }

  // Highlight search term in text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-red-primary/30 text-foreground font-semibold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    )
  }

  // Render results section
  const renderSection = (title: string, items: SearchResult[], startIndex: number) => {
    if (items.length === 0) return null

    return (
      <div className="mb-4 last:mb-0">
        <div className="px-4 py-2 text-xs font-semibold text-silver uppercase tracking-wider">
          {title}
        </div>
        {items.map((result, index) => {
          const globalIndex = startIndex + index
          const isSelected = globalIndex === selectedIndex

          return (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(globalIndex)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                isSelected
                  ? 'bg-red-primary/20 border-l-2 border-red-primary'
                  : 'hover:bg-dark-gray border-l-2 border-transparent'
              }`}
            >
              <div className={`flex-shrink-0 ${isSelected ? 'text-red-bright' : 'text-silver'}`}>
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                  {highlightText(result.title, query)}
                </p>
                {result.subtitle && (
                  <p className="text-xs text-silver truncate">
                    {result.subtitle}
                  </p>
                )}
              </div>
              <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(result.type)}`}>
                {result.type}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm px-4"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-rich-black border border-mid-gray rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="relative border-b border-mid-gray">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-silver" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search clients, projects, content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full pl-12 pr-12 py-4 bg-transparent text-foreground placeholder-silver focus:outline-none text-base"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setResults([])
                  inputRef.current?.focus()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-silver hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] lg:max-h-[500px] overflow-y-auto" ref={resultsRef}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-sm text-silver">Searching...</p>
              </div>
            ) : query.length < 2 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-silver/50 mb-3" />
                <p className="text-sm text-silver">Type at least 2 characters to search</p>
                <div className="mt-6 space-y-2 text-xs text-slate">
                  <p className="flex items-center justify-center gap-2">
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">⌘K</kbd>
                    <span>or</span>
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">Ctrl+K</kbd>
                    <span>to open</span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">↑</kbd>
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">↓</kbd>
                    <span>to navigate</span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">Enter</kbd>
                    <span>to select</span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <kbd className="px-2 py-1 bg-dark-gray rounded border border-mid-gray">Esc</kbd>
                    <span>to close</span>
                  </p>
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-silver/50 mb-3" />
                <p className="text-sm text-silver">No results found for &quot;{query}&quot;</p>
                <p className="mt-2 text-xs text-slate">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {renderSection('Clients', groupedResults.clients, 0)}
                {renderSection('Projects', groupedResults.projects, groupedResults.clients.length)}
                {renderSection('Content', groupedResults.content, groupedResults.clients.length + groupedResults.projects.length)}
              </div>
            )}
          </div>

          {/* Footer with shortcuts */}
          {totalResults > 0 && (
            <div className="border-t border-mid-gray px-4 py-2 flex items-center justify-between text-xs text-slate bg-charcoal">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-dark-gray rounded border border-mid-gray">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-dark-gray rounded border border-mid-gray">Enter</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-dark-gray rounded border border-mid-gray">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="text-silver">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
