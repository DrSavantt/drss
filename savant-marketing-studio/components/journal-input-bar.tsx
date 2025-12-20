'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AtSign, Hash, Send } from 'lucide-react'
import { createJournalEntry } from '@/app/actions/journal'
import { parseMentions } from '@/lib/utils/mentions'

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface MentionItem {
  id: string
  name: string
  type: 'client' | 'project'
}

interface JournalInputBarProps {
  onFocus?: () => void
  onEntryCreated?: () => void
  clients?: Client[]
  projects?: Project[]
  defaultChatId?: string
}

export function JournalInputBar({ 
  onEntryCreated, 
  clients = [], 
  projects = [],
  defaultChatId 
}: JournalInputBarProps) {
  const [value, setValue] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // All mentionable items
  const allMentionables: MentionItem[] = [
    ...clients.map(c => ({ id: c.id, name: c.name, type: 'client' as const })),
    ...projects.map(p => ({ id: p.id, name: p.name, type: 'project' as const }))
  ]
  
  // Filter mentions based on query
  const filteredMentions = allMentionables.filter(item =>
    item.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5)
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      const newHeight = Math.min(inputRef.current.scrollHeight, 120)
      inputRef.current.style.height = newHeight + 'px'
    }
  }, [value])
  
  // Clear success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])
  
  // Detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    setValue(newValue)
    
    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show mentions if we're right after @ or typing a name
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt)
        setShowMentions(true)
        return
      }
    }
    
    setShowMentions(false)
  }
  
  // Handle mention selection
  const handleSelectMention = useCallback((mentionName: string) => {
    if (!inputRef.current) return
    
    const cursorPos = inputRef.current.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    const newValue = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      `@${mentionName} ` + 
      textAfterCursor
    
    setValue(newValue)
    setShowMentions(false)
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [value])
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
      return
    }
    
    // Escape to close mentions or clear
    if (e.key === 'Escape') {
      if (showMentions) {
        setShowMentions(false)
      } else {
        setValue('')
        inputRef.current?.blur()
      }
    }
  }
  
  // Save capture
  const handleSave = async () => {
    if (!value.trim() || isSaving) return
    
    setIsSaving(true)
    
    try {
      // Parse mentions and tags from content
      const { mentioned_clients, mentioned_projects, tags } = parseMentions(
        value, 
        clients, 
        projects, 
        []
      )
      
      // Get or use default chat ID
      const chatId = defaultChatId || 'inbox'
      
      await createJournalEntry(
        value, 
        chatId, 
        mentioned_clients, 
        mentioned_projects,
        [],
        tags
      )
      
      setValue('')
      setShowSuccess(true)
      onEntryCreated?.()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm z-30"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Mention autocomplete */}
      {showMentions && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-0 mx-3 bg-surface border border-border rounded-t-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredMentions.map((item) => (
      <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelectMention(item.name)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-highlight text-left text-sm border-b border-border/50 last:border-b-0"
      >
              <span className={item.type === 'client' ? 'text-red-primary' : 'text-silver'}>
                @
        </span>
              <span className="text-foreground">{item.name}</span>
              <span className="ml-auto text-xs text-silver capitalize">{item.type}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Success indicator */}
      {showSuccess && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3">
          <div className="bg-success/20 text-success px-3 py-2 rounded-lg text-sm text-center font-medium">
            ✓ Captured!
          </div>
        </div>
      )}
      
      <div className="p-3">
        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to capture... @ to mention, # for tags"
            rows={1}
            className="w-full px-4 py-3 pr-24 bg-surface border border-border rounded-xl outline-none focus:border-red-primary focus:ring-1 focus:ring-red-primary/20 resize-none text-sm placeholder:text-silver"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          
          {/* Actions (right side) */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setValue(value + '@')
                inputRef.current?.focus()
                setShowMentions(true)
                setMentionQuery('')
              }}
              className="p-2 hover:bg-surface-highlight rounded-lg transition-colors"
              title="Add mention"
            >
              <AtSign className="w-4 h-4 text-silver" />
            </button>
            
            <button
              type="button"
              onClick={() => {
                setValue(value + '#')
                inputRef.current?.focus()
              }}
              className="p-2 hover:bg-surface-highlight rounded-lg transition-colors"
              title="Add tag"
            >
              <Hash className="w-4 h-4 text-silver" />
            </button>
            
            {value.trim() && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 bg-red-primary hover:bg-red-bright text-white rounded-lg transition-colors disabled:opacity-50"
                title="Capture (⌘+Enter)"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
      </button>
            )}
          </div>
        </div>
        
        {/* Hint text */}
        <div className="flex items-center justify-between mt-1.5 px-1 text-xs text-silver">
          <span>⌘↵ to save</span>
          {value.length > 0 && (
            <span>{value.length} chars</span>
          )}
        </div>
      </div>
    </div>
  )
}
