"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Upload, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FrameworkCard } from "./framework-card"
import { NewFrameworkDialog } from "./new-framework-dialog"
import { cn } from "@/lib/utils"

// ============================================================================
// EXACT v0 CODE - Only data fetching added, UI unchanged
// ============================================================================

const categories = [
  "All",
  "Strategy",
  "Formulas", 
  "Templates",
  "Story",
  "Hooks",
  "Prompts",
  "Copywriting",
  "Content Types",
]

interface Framework {
  id: string
  name: string
  description: string
  category: string
  characterCount: number
  chunkCount: number
}

export function FrameworkLibrary() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Callback to trigger refetch after mutations (delete, duplicate)
  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  // Fetch frameworks
  useEffect(() => {
    async function fetchFrameworks() {
      try {
        const res = await fetch('/api/frameworks', { cache: 'no-store' })
        const data = await res.json()
        
        // Transform to v0 format
        const transformedFrameworks: Framework[] = data.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description || '',
          category: formatCategory(f.category),
          characterCount: f.content?.length || 0,
          chunkCount: f.chunk_count || 0,
        }))
        
        setFrameworks(transformedFrameworks)
      } catch (error) {
        console.error('Failed to fetch frameworks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFrameworks()
  }, [dialogOpen, refreshKey]) // Refetch when dialog closes OR refreshKey changes

  // PERFORMANCE OPTIMIZATION: Memoize filtered frameworks
  // Prevents recalculation on every render - only recalculates when dependencies change
  const filteredFrameworks = useMemo(() => {
    return frameworks.filter((framework) => {
      const matchesSearch =
        framework.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        framework.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || framework.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [frameworks, searchQuery, selectedCategory])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Framework Library</h1>
            <p className="text-muted-foreground">Your copywriting frameworks power AI generation</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={`skeleton-framework-${i}`} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Framework Library</h1>
          <p className="text-muted-foreground">Your copywriting frameworks power AI generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            New Framework
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search frameworks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Framework Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFrameworks.map((framework) => (
          <FrameworkCard key={framework.id} framework={framework} onRefresh={handleRefresh} />
        ))}
      </div>

      {filteredFrameworks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No frameworks found</p>
          <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
            Create your first framework
          </Button>
        </div>
      )}

      <NewFrameworkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

// Helper: Format category from DB to v0 display format
function formatCategory(dbCategory: string | null): string {
  if (!dbCategory) return 'Copywriting'
  
  const categoryMap: Record<string, string> = {
    // New categories (primary)
    'strategy_framework': 'Strategy',
    'copywriting_formula': 'Formulas',
    'structure_template': 'Templates',
    'story_framework': 'Story',
    'hook_type': 'Hooks',
    'prompt_template': 'Prompts',
    'content-type': 'Content Types',
    // Legacy categories (for backwards compatibility)
    'copywriting': 'Copywriting',
    'email': 'Email',
    'ads': 'Ads',
    'funnel': 'Funnel',
    'landing': 'Landing Page',
    'social': 'Social',
  }
  
  return categoryMap[dbCategory.toLowerCase()] || dbCategory
}

