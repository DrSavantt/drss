'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Loader2, AtSign, Command, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MentionAutocomplete } from './mention-autocomplete'
import { MentionOption } from '@/lib/editor/types'
import { AutocompleteType } from '@/lib/editor/types'
import { generateInlineEdit } from '@/app/actions/ai'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const AI_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Sonnet 4.5', provider: 'Claude', icon: '🧠' },
  { id: 'claude-opus-4-20250514', label: 'Opus 4.5', provider: 'Claude', icon: '🧠' },
  { id: 'claude-haiku-4-20250514', label: 'Haiku 4.5', provider: 'Claude', icon: '🧠' },
  { id: 'gemini-2.0-flash-exp', label: 'Gemini Flash', provider: 'Google', icon: '✨' },
  { id: 'gemini-2.5-pro-002', label: 'Gemini Pro', provider: 'Google', icon: '✨' },
] as const

interface AIPromptBarProps {
  onResponse: (text: string) => void
  editorContent?: string
  selectedText?: string
  clientId?: string
  disabled?: boolean
  placeholder?: string
  showModelSelector?: boolean
}

export function AIPromptBar({
  onResponse,
  editorContent = '',
  selectedText,
  clientId,
  disabled = false,
  placeholder = 'Plan, @ for context, / for commands',
  showModelSelector = true
}: AIPromptBarProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMentions, setActiveMentions] = useState<string[]>([])
  const [autocompleteType, setAutocompleteType] = useState<AutocompleteType>(null)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514')
  const [modelOpen, setModelOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to recalculate
    textarea.style.height = 'auto'
    
    // Calculate new height (max 4 lines)
    const lineHeight = 24 // approximate line height
    const maxLines = 4
    const maxHeight = lineHeight * maxLines
    
    const scrollHeight = textarea.scrollHeight
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
  }, [value])

  // Detect autocomplete triggers (@, /)
  useEffect(() => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPos)
    
    // Check for mention trigger (@)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setAutocompleteType('mention')
      setAutocompleteQuery(mentionMatch[1])
      setSelectedIndex(0)
      return
    }
    
    // Check for command trigger (/)
    const commandMatch = textBeforeCursor.match(/\/(\w*)$/)
    if (commandMatch) {
      setAutocompleteType('command')
      setAutocompleteQuery(commandMatch[1])
      setSelectedIndex(0)
      return
    }
    
    // No triggers found
    if (autocompleteType) {
      setAutocompleteType(null)
      setAutocompleteQuery('')
    }
  }, [value, autocompleteType])

  const handleSubmit = async () => {
    if (!value.trim() || isLoading || disabled) return
    
    const prompt = value.trim()
    setIsLoading(true)
    
    // Show loading toast
    const toastId = toast.loading(`Generating with ${currentModel.label}...`)
    
    try {
      // Build context based on active mentions
      const includeClientContext = activeMentions.includes('client')
      const includeFramework = activeMentions.includes('framework')
      const useSelection = activeMentions.includes('selection')
      
      // Call server action with selected model
      const result = await generateInlineEdit(prompt, {
        selectedText: useSelection ? selectedText : undefined,
        fullContent: editorContent,
        clientId: includeClientContext ? clientId : undefined,
        includeClientContext,
        frameworkId: includeFramework ? 'default' : undefined,
        model: selectedModel, // Pass selected model
      })
      
      if (result.error) {
        toast.error('AI Error', {
          description: result.error,
          id: toastId,
        })
        return
      }
      
      // Success! Pass response to parent
      onResponse(result.content)
      
      // Clear input
      setValue('')
      setActiveMentions([])
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      
      toast.success('Content Generated!', {
        description: `${result.content.length} characters generated`,
        id: toastId,
      })
    } catch (error) {
      console.error('Failed to generate content:', error)
      toast.error('Generation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: toastId,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMentionSelect = (mention: MentionOption) => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    
    // Find the @ symbol position
    const mentionMatch = textBeforeCursor.match(/@\w*$/)
    if (!mentionMatch) return
    
    const mentionStartPos = cursorPos - mentionMatch[0].length
    const beforeMention = value.slice(0, mentionStartPos)
    
    // Insert mention tag
    const mentionTag = `[${mention.label}]`
    const newValue = beforeMention + mentionTag + ' ' + textAfterCursor
    
    setValue(newValue)
    setAutocompleteType(null)
    setAutocompleteQuery('')
    
    // Track active mention
    if (!activeMentions.includes(mention.value)) {
      setActiveMentions([...activeMentions, mention.value])
    }
    
    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionTag.length + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const closeAutocomplete = () => {
    setAutocompleteType(null)
    setAutocompleteQuery('')
    setSelectedIndex(0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete navigation
    if (autocompleteType === 'mention') {
      const { filterMentions } = require('@/lib/editor/ai-commands')
      const mentions = filterMentions(autocompleteQuery)
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % mentions.length)
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + mentions.length) % mentions.length)
        return
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (mentions[selectedIndex]) {
          handleMentionSelect(mentions[selectedIndex])
        }
        return
      }
      
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAutocomplete()
        return
      }
    }
    
    // Normal submit (no autocomplete open)
    if (e.key === 'Enter' && !e.shiftKey && !autocompleteType) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isDisabled = disabled || isLoading

  const handleMentionButtonClick = () => {
    // Focus textarea and insert @ to trigger autocomplete
    if (textareaRef.current) {
      textareaRef.current.focus()
      const cursorPos = textareaRef.current.selectionStart || 0
      const newValue = value.slice(0, cursorPos) + '@' + value.slice(cursorPos)
      setValue(newValue)
      // Set cursor after @
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(cursorPos + 1, cursorPos + 1)
      }, 0)
    }
  }

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Mention Autocomplete */}
      {autocompleteType === 'mention' && (
        <MentionAutocomplete
          query={autocompleteQuery}
          onSelect={handleMentionSelect}
          onClose={closeAutocomplete}
          isOpen={true}
          selectedIndex={selectedIndex}
        />
      )}
      
      {/* Main Input Container - Cursor Style */}
      <div
        className={cn(
          'bg-muted/30 border rounded-xl px-4 py-3 transition-all space-y-2',
          isFocused ? 'border-border' : 'border-border/50',
          isDisabled && 'opacity-70 cursor-not-allowed'
        )}
      >
        {/* Input Row */}
        <div className="flex items-center gap-3">
          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isLoading ? 'Generating...' : placeholder}
            disabled={isDisabled}
            rows={1}
            className={cn(
              'flex-1 bg-transparent border-none outline-none resize-none',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed',
              isLoading && 'opacity-70 cursor-wait'
            )}
            style={{
              minHeight: '20px',
              maxHeight: '96px', // 4 lines max
              overflowY: 'auto'
            }}
          />
          
          {/* Right Side Icons - Minimal */}
          <div className="flex items-center gap-2 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-primary" />
            ) : (
              <>
                {/* @ Mention Button */}
                <button
                  type="button"
                  onClick={handleMentionButtonClick}
                  className="hover:text-foreground transition-colors"
                  title="Add context mention"
                  disabled={isDisabled}
                >
                  <AtSign className="w-4 h-4" />
                </button>
                
                {/* Keyboard Shortcut Hint */}
                <div className="text-muted-foreground/40" title="Press Enter to send">
                  <Command className="w-3.5 h-3.5" />
                </div>
                
                {/* Send Button - Just Icon */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isDisabled || !value.trim()}
                  className={cn(
                    'hover:text-foreground transition-colors',
                    'disabled:opacity-30 disabled:cursor-not-allowed'
                  )}
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Model Selector Row */}
        {showModelSelector && (
          <div className="flex items-center gap-2">
            <DropdownMenu open={modelOpen} onOpenChange={setModelOpen}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <span>{currentModel.icon}</span>
                  <span>{currentModel.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {['Claude', 'Google'].map((provider, idx) => {
                  const providerModels = AI_MODELS.filter(m => m.provider === provider)
                  if (providerModels.length === 0) return null
                  
                  return (
                    <div key={provider}>
                      {idx > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs">{provider}</DropdownMenuLabel>
                      {providerModels.map(model => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setModelOpen(false)
                          }}
                          className={cn(
                            'flex items-center justify-between cursor-pointer',
                            selectedModel === model.id && 'bg-accent'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span>{model.icon}</span>
                            <span>{model.label}</span>
                          </span>
                          {selectedModel === model.id && (
                            <Check className="w-3.5 h-3.5 text-red-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
