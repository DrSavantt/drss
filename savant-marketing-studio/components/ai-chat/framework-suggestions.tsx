"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Layers, X, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { searchFrameworksByQuery, type FrameworkSearchResult } from "@/app/actions/frameworks"
import type { ContextItem } from "./context-picker-modal"

interface FrameworkSuggestionsProps {
  userMessage: string
  onSelectFramework: (item: ContextItem) => void
  disabled?: boolean
}

const MIN_QUERY_LENGTH = 10
const DEBOUNCE_MS = 500
const STORAGE_KEY = "drss-hide-framework-suggestions"

export function FrameworkSuggestions({
  userMessage,
  onSelectFramework,
  disabled = false,
}: FrameworkSuggestionsProps) {
  const [results, setResults] = useState<FrameworkSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  })
  const [collapsed, setCollapsed] = useState(false)

  // Persist hidden preference
  const toggleHidden = useCallback(() => {
    const newValue = !hidden
    setHidden(newValue)
    localStorage.setItem(STORAGE_KEY, String(newValue))
  }, [hidden])

  // Debounced search
  useEffect(() => {
    // Reset if query too short
    if (!userMessage || userMessage.length < MIN_QUERY_LENGTH) {
      setResults([])
      return
    }

    // Don't search if hidden
    if (hidden) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const frameworks = await searchFrameworksByQuery(userMessage, 5)
        setResults(frameworks)
      } catch (error) {
        console.error("Framework search failed:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [userMessage, hidden])

  // Handle framework selection
  const handleSelect = (framework: FrameworkSearchResult) => {
    onSelectFramework({
      type: "framework",
      id: framework.id,
      name: framework.name,
      subtitle: framework.category || undefined,
    })
  }

  // Don't render anything if hidden via toggle
  if (hidden) {
    return (
      <button
        onClick={toggleHidden}
        className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Layers className="h-3 w-3" />
        <span>Show framework suggestions</span>
      </button>
    )
  }

  // Don't render if query too short and not loading
  if (userMessage.length < MIN_QUERY_LENGTH && results.length === 0 && !loading) {
    return null
  }

  // Loading state
  if (loading && results.length === 0) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Finding relevant frameworks...</span>
      </div>
    )
  }

  // No results
  if (!loading && results.length === 0) {
    return null
  }

  return (
    <div className="mb-2 rounded-lg border border-border bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-medium text-muted-foreground">
            Suggested frameworks
          </span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleHidden}
            title="Hide framework suggestions"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {!collapsed && (
        <div className="flex flex-wrap gap-1.5 p-2">
          {results.map((framework) => (
            <button
              key={framework.id}
              onClick={() => handleSelect(framework)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title={`${framework.description || framework.name} (${Math.round(framework.similarity * 100)}% match)`}
            >
              <span className="truncate max-w-[120px]">{framework.name}</span>
              <span className="text-orange-400/70 text-[10px]">
                {Math.round(framework.similarity * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
