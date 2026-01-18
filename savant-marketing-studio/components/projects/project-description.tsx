'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { updateProjectData } from '@/app/actions/projects'
import { Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProjectDescriptionProps {
  projectId: string
  description: string | null
}

export function ProjectDescription({ projectId, description }: ProjectDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(description || '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])
  
  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`
    }
  }, [isEditing, value])
  
  const handleSave = () => {
    const trimmedValue = value.trim()
    const originalValue = (description || '').trim()
    
    // No change - just exit edit mode
    if (trimmedValue === originalValue) {
      setIsEditing(false)
      return
    }
    
    startTransition(async () => {
      const result = await updateProjectData(projectId, { 
        description: trimmedValue || null 
      })
      
      if (result.error) {
        toast.error('Failed to save description')
        setValue(description || '')
      } else {
        setValue(trimmedValue)
      }
      setIsEditing(false)
    })
  }
  
  const handleCancel = () => {
    setValue(description || '')
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }
  
  const handleBlur = (e: React.FocusEvent) => {
    // Don't save if clicking inside the same container
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('[data-description-container]')) {
      return
    }
    handleSave()
  }

  return (
    <div 
      className="rounded-lg border border-border bg-card"
      data-description-container
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={isPending}
              placeholder="Add a description..."
              className={cn(
                "w-full min-h-[100px] resize-y rounded-md border border-border bg-background px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            />
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘+Enter</kbd> to save, <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> to cancel
            </p>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={cn(
              "group relative min-h-[60px] rounded-md px-3 py-2 -mx-3 -my-2",
              "cursor-pointer transition-colors",
              "hover:bg-muted/50",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            {value ? (
              <p className="text-sm text-foreground whitespace-pre-wrap pr-6">
                {value}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Click to add a description...
              </p>
            )}
            
            {/* Edit icon - visible on mobile, hover on desktop */}
            <Pencil className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  )
}
