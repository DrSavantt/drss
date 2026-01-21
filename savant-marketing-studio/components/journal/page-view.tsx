'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { Plus, Pencil, Check, X, Loader2, FileText, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PageBreadcrumbs } from './page-breadcrumbs'
import { 
  getPage, 
  updatePageMeta, 
  updatePageContent, 
  createPage 
} from '@/app/actions/journal-pages'
import type { JournalPage, JournalPageTreeNode } from '@/types/journal'
import dynamic from 'next/dynamic'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PAGE_ICONS } from '@/types/journal'
import { createClient } from '@/lib/supabase/client'
import type { AIModel } from '@/components/editor/ai-prompt-bar'

// Dynamically import TipTap editor for SSR compatibility
const TiptapEditor = dynamic(
  () => import('@/components/tiptap-editor').then(mod => ({ default: mod.TiptapEditor })),
  {
    loading: () => (
      <div className="min-h-[300px] flex items-center justify-center border border-border rounded-lg bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

// ============================================================================
// TYPES
// ============================================================================

interface PageViewProps {
  /** Page ID to display */
  pageId: string
  /** Callback when navigating to another page */
  onNavigate: (pageId: string | null) => void
  /** Callback when page tree needs refresh (after creating child) */
  onTreeRefresh?: () => void
  /** Optional class name */
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTOSAVE_DELAY = 1500 // ms

// ============================================================================
// COMPONENT
// ============================================================================

export function PageView({
  pageId,
  onNavigate,
  onTreeRefresh,
  className,
}: PageViewProps) {
  // Page data
  const [page, setPage] = useState<JournalPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  // Icon editing
  const [showIconPicker, setShowIconPicker] = useState(false)
  
  // Content editing
  const [editorContent, setEditorContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Transitions
  const [isPending, startTransition] = useTransition()
  
  // AI Models
  const [aiModels, setAiModels] = useState<AIModel[]>([])

  // Fetch AI models on mount
  useEffect(() => {
    async function fetchModels() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ai_models')
        .select('id, model_name, display_name, max_tokens')
        .eq('is_active', true)
        .order('display_name')
      
      if (data) setAiModels(data)
    }
    fetchModels()
  }, [])

  // Fetch page data
  const fetchPage = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const pageData = await getPage(pageId)
      if (pageData) {
        setPage(pageData)
        setEditTitle(pageData.title)
        setEditorContent(pageData.content || '')
      } else {
        setError('Page not found')
      }
    } catch (err) {
      console.error('Failed to fetch page:', err)
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Auto-save content with debounce
  const handleContentChange = useCallback((html: string) => {
    setEditorContent(html)
    setHasUnsavedChanges(true)
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      if (!page) return
      
      setIsSaving(true)
      setSaveStatus('saving')
      
      try {
        await updatePageContent(page.id, html)
        setHasUnsavedChanges(false)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err) {
        console.error('Failed to save content:', err)
        setSaveStatus('error')
      } finally {
        setIsSaving(false)
      }
    }, AUTOSAVE_DELAY)
  }, [page])

  // Save title
  const handleSaveTitle = async () => {
    if (!page || !editTitle.trim()) {
      setIsEditingTitle(false)
      setEditTitle(page?.title || '')
      return
    }
    
    if (editTitle === page.title) {
      setIsEditingTitle(false)
      return
    }
    
    try {
      await updatePageMeta(page.id, editTitle.trim(), page.icon)
      setPage(prev => prev ? { ...prev, title: editTitle.trim() } : null)
      onTreeRefresh?.()
    } catch (err) {
      console.error('Failed to save title:', err)
      setEditTitle(page.title)
    } finally {
      setIsEditingTitle(false)
    }
  }

  // Cancel title edit
  const handleCancelTitle = () => {
    setEditTitle(page?.title || '')
    setIsEditingTitle(false)
  }

  // Change icon
  const handleChangeIcon = async (icon: string) => {
    if (!page) return
    
    try {
      await updatePageMeta(page.id, page.title, icon)
      setPage(prev => prev ? { ...prev, icon } : null)
      setShowIconPicker(false)
      onTreeRefresh?.()
    } catch (err) {
      console.error('Failed to change icon:', err)
    }
  }

  // Create child page
  const handleCreateChildPage = async () => {
    if (!page) return
    
    startTransition(async () => {
      try {
        const result = await createPage('Untitled', page.id)
        onTreeRefresh?.()
        onNavigate(result.id)
      } catch (err) {
        console.error('Failed to create child page:', err)
      }
    })
  }

  // Navigate to child page
  const handleChildClick = (childId: string) => {
    onNavigate(childId)
  }

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        // Trigger immediate save if there are unsaved changes
        if (hasUnsavedChanges && page) {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }
          setIsSaving(true)
          setSaveStatus('saving')
          updatePageContent(page.id, editorContent)
            .then(() => {
              setHasUnsavedChanges(false)
              setSaveStatus('saved')
              setTimeout(() => setSaveStatus('idle'), 2000)
            })
            .catch(() => setSaveStatus('error'))
            .finally(() => setIsSaving(false))
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, page, editorContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading page...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !page) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[400px] gap-4", className)}>
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">{error || 'Page not found'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            The page you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <Button variant="outline" onClick={() => onNavigate(null)}>
          Back to Journal
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          breadcrumbs={page.breadcrumbs || []}
          currentPageId={page.id}
          onNavigate={onNavigate}
        />
        
        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-green-500">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-destructive">Save failed</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Page Icon & Title */}
          <div className="mb-8">
            {/* Icon */}
            <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-5xl mb-2 hover:bg-muted rounded-lg p-2 -ml-2 transition-colors"
                  title="Change icon"
                >
                  {page.icon || '📄'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-5 gap-1">
                  {PAGE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleChangeIcon(icon)}
                      className={cn(
                        "text-2xl p-2 rounded hover:bg-muted transition-colors",
                        page.icon === icon && "bg-muted"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={titleInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-3xl font-bold h-auto py-1 px-2 border-none shadow-none focus-visible:ring-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelTitle()
                  }}
                  onBlur={handleSaveTitle}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 w-full text-left"
              >
                <h1 className="text-3xl font-bold text-foreground">
                  {page.title || 'Untitled'}
                </h1>
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Editor */}
          <div className="mb-8">
            <TiptapEditor
              content={editorContent}
              onChange={handleContentChange}
              editable={true}
              showAIBar={true}
              models={aiModels}
            />
          </div>

          {/* Child Pages Section */}
          <div className="border-t border-border pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pages Inside ({page.children?.length || 0})
              </h2>
            </div>

            {page.children && page.children.length > 0 ? (
              <div className="space-y-2">
                {page.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleChildClick(child.id)}
                    className={cn(
                      "flex items-center gap-3 w-full p-3 rounded-lg border border-border",
                      "bg-card hover:bg-accent/50 transition-colors text-left"
                    )}
                  >
                    <span className="text-xl">{child.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {child.title || 'Untitled'}
                      </p>
                      {child.child_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {child.child_count} page{child.child_count > 1 ? 's' : ''} inside
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pages inside yet</p>
              </div>
            )}

            {/* Add Child Page Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleCreateChildPage}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add a page
            </Button>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="border-t border-border px-6 py-2 bg-background/50">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">⌘S</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl+S</kbd> to save • Auto-saves after typing
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface PageViewEmptyProps {
  onCreatePage: () => void
  isCreating?: boolean
  className?: string
}

export function PageViewEmpty({
  onCreatePage,
  isCreating,
  className,
}: PageViewEmptyProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-full p-8 text-center",
      className
    )}>
      <div className="max-w-md">
        <div className="text-6xl mb-4">📓</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to Journal
        </h2>
        <p className="text-muted-foreground mb-6">
          Create pages to organize your ideas, notes, and research. 
          Pages can be nested to create a knowledge hierarchy.
        </p>
        <Button 
          onClick={onCreatePage} 
          disabled={isCreating}
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Page
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
