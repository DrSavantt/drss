'use client'

import { useState, useRef, useEffect, KeyboardEvent, useMemo } from 'react'
import { Send, Loader2, AtSign, Command, ChevronDown, Check, AlertTriangle, Scissors, Plus, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MentionAutocomplete } from './mention-autocomplete'
import { MentionOption, AutocompleteType } from '@/lib/editor/types'
import { filterMentions } from '@/lib/editor/ai-commands'
import { generateInlineEdit } from '@/app/actions/ai'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MultiEditPreview } from './multi-edit-preview'

// Rough token estimation: ~4 characters = 1 token
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Selection interface for multi-selection support
interface Selection {
  id: string;
  text: string;
  from: number;
  to: number;
}

// Edit result for preview
export interface EditResult {
  id: string;
  original: string;
  edited: string;
  from: number;
  to: number;
}

// Add Selection Button - shows when text is highlighted but not added
function AddSelectionButton({ 
  selectedText, 
  onAdd,
  disabled
}: { 
  selectedText: string;
  onAdd: () => void;
  disabled?: boolean;
}) {
  if (!selectedText) return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <Scissors className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-600 dark:text-amber-400 truncate">
          "{selectedText.slice(0, 40)}{selectedText.length > 40 ? '...' : ''}"
        </p>
        <p className="text-xs text-muted-foreground">
          {selectedText.length} characters highlighted
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        disabled={disabled}
        className="h-8 flex-shrink-0"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  );
}

// Selection List - shows all added selections
function SelectionList({ 
  selections, 
  onRemove, 
  onClearAll 
}: { 
  selections: Selection[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (selections.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Selections to edit ({selections.length})
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      </div>
      
      {/* Selection Items */}
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {selections.map((selection, index) => (
          <div
            key={selection.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border group"
          >
            {/* Index number */}
            <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
              {index + 1}
            </span>
            
            {/* Preview */}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" title={selection.text}>
                "{selection.text.slice(0, 60)}{selection.text.length > 60 ? '...' : ''}"
              </p>
              <p className="text-xs text-muted-foreground">
                {selection.text.length} characters
              </p>
            </div>
            
            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(selection.id)}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Type for AI models from database
export interface AIModel {
  id: string
  model_name: string
  display_name: string
  max_tokens: number | null
}

interface AIPromptBarProps {
  onResponse: (text: string) => void
  editorContent?: string
  selectedText?: string
  selectionRange?: { from: number; to: number } | null  // NEW: need position info
  onReplaceSelection?: (from: number, to: number, newText: string) => void  // NEW: targeted replacement
  onClearSelection?: () => void  // NEW: clear editor selection
  clientId?: string
  disabled?: boolean
  placeholder?: string
  showModelSelector?: boolean
  models?: AIModel[]
  // For floating selection menu integration
  pendingSelection?: {
    text: string;
    from: number;
    to: number;
  } | null;
  onPendingSelectionHandled?: () => void;
}

export function AIPromptBar({
  onResponse,
  editorContent = '',
  selectedText = '',
  selectionRange,
  onReplaceSelection,
  onClearSelection,
  clientId,
  disabled = false,
  placeholder = 'Plan, @ for context, / for commands',
  showModelSelector = true,
  models = [],
  pendingSelection,
  onPendingSelectionHandled,
}: AIPromptBarProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMentions, setActiveMentions] = useState<string[]>([])
  const [autocompleteType, setAutocompleteType] = useState<AutocompleteType>(null)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedModel, setSelectedModel] = useState(models[0]?.model_name || '')
  const [modelOpen, setModelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Multi-selection state
  const [selections, setSelections] = useState<Selection[]>([])
  
  // State for pending AI changes (multi-edit preview)
  const [pendingEdits, setPendingEdits] = useState<EditResult[] | null>(null)
  
  // Update selected model when models prop changes
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].model_name)
    }
  }, [models, selectedModel])

  // Handle pending selection from floating menu
  useEffect(() => {
    if (pendingSelection) {
      // Check if this exact selection already exists
      const exists = selections.some(
        s => s.from === pendingSelection.from && s.to === pendingSelection.to
      );
      
      if (!exists) {
        setSelections(prev => [...prev, {
          id: generateId(),
          text: pendingSelection.text,
          from: pendingSelection.from,
          to: pendingSelection.to,
        }]);
        
        toast.success('Selection added', {
          description: `${pendingSelection.text.length} characters added to edit list`,
        });
      } else {
        toast.info('Selection already added');
      }
      
      setError(null);
      onPendingSelectionHandled?.();
    }
  }, [pendingSelection, onPendingSelectionHandled, selections]);
  
  const currentModel = models.find(m => m.model_name === selectedModel) || models[0]
  
  // Get selected model's max tokens
  const maxTokens = currentModel?.max_tokens || 200000
  
  // Calculate context tokens - include all selections
  const contextTokens = useMemo(() => {
    let total = 0;
    
    // Prompt tokens
    total += estimateTokens(value);
    
    // Include all selections tokens
    selections.forEach(s => {
      total += estimateTokens(s.text);
    });
    
    // Full content tokens (always sent as context)
    total += estimateTokens(editorContent);
    
    // Add overhead for system prompt (~500 tokens)
    total += 500;
    
    return total;
  }, [value, selections, editorContent]);
  
  // If no models available, don't render the component
  if (!models || models.length === 0) {
    return null
  }

  // Add current selection to list
  const addSelection = () => {
    if (!selectedText || !selectionRange) return;
    
    // Check if this exact selection already exists
    const exists = selections.some(
      s => s.from === selectionRange.from && s.to === selectionRange.to
    );
    if (exists) {
      toast.info('Selection already added');
      return;
    }
    
    setSelections(prev => [...prev, {
      id: generateId(),
      text: selectedText,
      from: selectionRange.from,
      to: selectionRange.to,
    }]);
    
    // Clear editor selection after adding
    onClearSelection?.();
    setError(null);
    
    toast.success('Selection added', {
      description: `${selectedText.length} characters added to edit list`,
    });
  };

  // Remove a selection from list
  const removeSelection = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelections([]);
    toast.info('All selections cleared');
  };

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
    if (!value.trim() || isLoading || disabled || pendingEdits) return
    
    if (selections.length === 0) {
      setError('Add at least one selection to edit');
      return;
    }
    
    const prompt = value.trim()
    setIsLoading(true)
    setError(null)
    
    // Show loading toast
    const toastId = toast.loading(`Generating edits for ${selections.length} selection${selections.length > 1 ? 's' : ''} with ${currentModel?.display_name || 'AI'}...`)
    
    try {
      // Build context based on active mentions
      const includeClientContext = activeMentions.includes('client')
      const includeFramework = activeMentions.includes('framework')
      
      // Call server action with multiple selections
      const result = await generateInlineEdit(prompt, {
        selections: selections.map(s => ({
          text: s.text,
          from: s.from,
          to: s.to,
        })),
        fullContent: editorContent,
        clientId: includeClientContext ? clientId : undefined,
        includeClientContext,
        frameworkId: includeFramework ? 'default' : undefined,
        model: selectedModel,
      })
      
      if (result.error) {
        toast.error('AI Error', {
          description: result.error,
          id: toastId,
        })
        setError(result.error)
        return
      }
      
      // Store edits for preview
      if (result.edits && result.edits.length > 0) {
        // Map edits back to selections with IDs
        const editsWithIds: EditResult[] = result.edits.map((edit, i) => ({
          id: selections[i]?.id || generateId(),
          original: edit.original,
          edited: edit.edited,
          from: edit.from,
          to: edit.to,
        }));
        
        setPendingEdits(editsWithIds);
        
        toast.success('Review Suggested Changes', {
          description: `${editsWithIds.length} edit${editsWithIds.length > 1 ? 's' : ''} ready for review`,
          id: toastId,
        })
      } else if (result.content) {
        // Fallback for single content response (backward compatibility)
        const singleEdit: EditResult = {
          id: selections[0]?.id || generateId(),
          original: selections[0]?.text || '',
          edited: result.content,
          from: selections[0]?.from || 0,
          to: selections[0]?.to || 0,
        };
        setPendingEdits([singleEdit]);
        
        toast.success('Review Suggested Changes', {
          description: 'Edit ready for review',
          id: toastId,
        })
      } else {
        setError('No edits generated')
        toast.error('No edits generated', { id: toastId })
      }
    } catch (err) {
      console.error('Failed to generate content:', err)
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMsg)
      toast.error('Generation Failed', {
        description: errorMsg,
        id: toastId,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptAll = () => {
    if (!pendingEdits) return;
    
    // Apply all edits - need to apply from end to start to preserve positions
    const sortedEdits = [...pendingEdits].sort((a, b) => b.from - a.from);
    
    sortedEdits.forEach(edit => {
      if (onReplaceSelection) {
        onReplaceSelection(edit.from, edit.to, edit.edited);
      } else {
        // Fallback: use onResponse with concatenated edits
        onResponse(edit.edited);
      }
    });
    
    setPendingEdits(null);
    setSelections([]);
    setValue('');
    setActiveMentions([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    toast.success('All Changes Applied!', {
      description: `${sortedEdits.length} edit${sortedEdits.length > 1 ? 's' : ''} applied to editor`,
    });
  }

  const handleRejectAll = () => {
    setPendingEdits(null);
    toast.info('All Suggestions Rejected', {
      description: 'You can modify your prompt and try again',
    });
  }

  const handleAcceptOne = (editId: string) => {
    if (!pendingEdits) return;
    
    const edit = pendingEdits.find(e => e.id === editId);
    if (!edit) return;
    
    if (onReplaceSelection) {
      onReplaceSelection(edit.from, edit.to, edit.edited);
    } else {
      onResponse(edit.edited);
    }
    
    // Remove from pending and selections
    const remaining = pendingEdits.filter(e => e.id !== editId);
    if (remaining.length === 0) {
      setPendingEdits(null);
      setSelections([]);
      setValue('');
      setActiveMentions([]);
    } else {
      setPendingEdits(remaining);
      setSelections(prev => prev.filter(s => s.id !== editId));
    }
    
    toast.success('Edit Applied');
  }

  const handleRejectOne = (editId: string) => {
    if (!pendingEdits) return;
    
    const remaining = pendingEdits.filter(e => e.id !== editId);
    if (remaining.length === 0) {
      setPendingEdits(null);
    } else {
      setPendingEdits(remaining);
    }
    setSelections(prev => prev.filter(s => s.id !== editId));
    
    toast.info('Edit Rejected');
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

  const isDisabled = disabled || isLoading || !!pendingEdits

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
    <div ref={containerRef} className="w-full relative space-y-3">
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
      
      {/* Multi-Edit Preview */}
      {pendingEdits && pendingEdits.length > 0 && (
        <MultiEditPreview
          edits={pendingEdits}
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onAcceptOne={handleAcceptOne}
          onRejectOne={handleRejectOne}
          isLoading={isLoading}
        />
      )}
      
      {/* Add Selection Button - shows when text is highlighted but not added */}
      {!pendingEdits && (
        <AddSelectionButton
          selectedText={selectedText}
          onAdd={addSelection}
          disabled={isLoading}
        />
      )}
      
      {/* Selection List */}
      {!pendingEdits && (
        <SelectionList
          selections={selections}
          onRemove={removeSelection}
          onClearAll={clearAllSelections}
        />
      )}
      
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {/* Main Input Container - Cursor Style */}
      {!pendingEdits && (
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
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isLoading 
                  ? 'Generating...' 
                  : selections.length > 0
                    ? `Describe the edit to apply to ${selections.length} selection${selections.length > 1 ? 's' : ''}...`
                    : "Highlight text and click Add, then describe your edit..."
              }
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
                    disabled={isDisabled || !value.trim() || selections.length === 0}
                    className={cn(
                      'hover:text-foreground transition-colors',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    title={selections.length === 0 ? 'Add selections first' : 'Send (Enter)'}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Model Selector Row with Token Counter */}
          {showModelSelector && models.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              {/* Model Selector */}
              <DropdownMenu open={modelOpen} onOpenChange={setModelOpen}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    <span>{currentModel?.display_name || 'Select Model'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  {models.map(model => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.model_name)
                        setModelOpen(false)
                      }}
                      className={cn(
                        'flex items-center justify-between cursor-pointer',
                        selectedModel === model.model_name && 'bg-accent'
                      )}
                    >
                      <span>{model.display_name}</span>
                      {selectedModel === model.model_name && (
                        <Check className="w-3.5 h-3.5 text-red-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Selection count + Token Counter */}
              <div className="flex items-center gap-3">
                {selections.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selections.length} selection{selections.length !== 1 ? 's' : ''}
                  </span>
                )}
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs text-muted-foreground",
                    contextTokens > maxTokens * 0.9 && "text-amber-500",
                    contextTokens > maxTokens * 0.95 && "text-red-500"
                  )}>
                    {contextTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
                  </span>
                  
                  {/* Progress bar */}
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        contextTokens > maxTokens * 0.95 ? "bg-red-500" :
                        contextTokens > maxTokens * 0.8 ? "bg-amber-500" :
                        "bg-primary"
                      )}
                      style={{ width: `${Math.min((contextTokens / maxTokens) * 100, 100)}%` }}
                    />
                  </div>
                  
                  {/* Warning if approaching limit */}
                  {contextTokens > maxTokens * 0.9 && (
                    <div className="text-xs text-amber-500 flex items-center gap-1" title="Approaching context limit">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
