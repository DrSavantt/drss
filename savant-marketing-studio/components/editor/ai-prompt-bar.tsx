'use client'

import { useState, useRef, useEffect, KeyboardEvent, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, AtSign, ChevronDown, Check, AlertTriangle, Scissors, Plus, X, Trash2, CheckCircle2, FileText, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { ContextPickerModal, type ContextItem, type ContextItemType } from '@/components/ai-chat/context-picker-modal'
import { InlineMentionPopup, type InlineMentionPopupRef } from '@/components/ai-chat/inline-mention-popup'

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
  
  // Context injection - entity data
  clients?: Array<{ id: string; name: string }>
  projects?: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets?: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>
  journalEntries?: Array<{
    id: string
    title: string | null
    content: string
    tags?: string[] | null
    mentionedClients?: Array<{ id: string; name: string }>
    mentionedProjects?: Array<{ id: string; name: string }>
    mentionedContent?: Array<{ id: string; name: string }>
  }>
  writingFrameworks?: Array<{ id: string; name: string; category?: string }>
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
  // Entity data for context injection
  clients = [],
  projects = [],
  contentAssets = [],
  journalEntries = [],
  writingFrameworks = [],
}: AIPromptBarProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
  
  // Context injection state
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([])
  const [showInlinePopup, setShowInlinePopup] = useState(false)
  const [inlineQuery, setInlineQuery] = useState('')
  const [inlinePopupPosition, setInlinePopupPosition] = useState({ top: 0, left: 0 })
  const [inlineSelectedIndex, setInlineSelectedIndex] = useState(0)
  const [showContextModal, setShowContextModal] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const inlineMentionRef = useRef<InlineMentionPopupRef>(null)
  
  // Track actual token usage from last generation
  const [lastTokenUsage, setLastTokenUsage] = useState<{
    input: number;
    output: number;
    total: number;
  } | null>(null)
  
  // Extended thinking toggle
  const [useExtendedThinking, setUseExtendedThinking] = useState(false)
  
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

  // Calculate caret position for inline popup
  const getCaretCoordinates = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) return { top: 0, left: 0 }
    
    const textarea = textareaRef.current
    const containerRect = containerRef.current.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()
    
    // Simple estimation - popup will appear above the textarea
    return {
      top: textareaRect.top,
      left: textareaRect.left + 16, // Small offset from left edge
    }
  }, [])

  // Handle input change with @ detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const newCursorPos = e.target.selectionStart || 0
    setValue(newValue)
    setCursorPosition(newCursorPos)
    setError(null)
    
    // Detect @ for inline popup
    const textBeforeCursor = newValue.slice(0, newCursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (atMatch) {
      setInlineQuery(atMatch[1] || '')
      setShowInlinePopup(true)
      setInlineSelectedIndex(0)
      setInlinePopupPosition(getCaretCoordinates())
    } else {
      setShowInlinePopup(false)
      setInlineQuery('')
    }
  }, [getCaretCoordinates])

  // Handle context selection from inline popup or modal
  const handleSelectContext = useCallback((item: ContextItem) => {
    // Avoid duplicates
    if (!selectedContext.find(c => c.type === item.type && c.id === item.id)) {
      setSelectedContext(prev => [...prev, item])
    }
    
    // Remove @query from input if inline popup was used
    if (showInlinePopup) {
      const textBeforeCursor = value.slice(0, cursorPosition)
      const textAfterCursor = value.slice(cursorPosition)
      const newText = textBeforeCursor.replace(/@\w*$/, '') + textAfterCursor
      setValue(newText)
    }
    
    setShowInlinePopup(false)
    setInlineQuery('')
    
    // Focus back on textarea
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [selectedContext, showInlinePopup, value, cursorPosition])

  // Handle context items from modal (receives array)
  const handleSelectContextFromModal = useCallback((items: ContextItem[]) => {
    setSelectedContext(prev => {
      const newItems = items.filter(item => 
        !prev.find(c => c.type === item.type && c.id === item.id)
      )
      return [...prev, ...newItems]
    })
    setShowContextModal(false)
  }, [])

  // Remove context item
  const handleRemoveContext = useCallback((id: string, type: ContextItemType) => {
    setSelectedContext(prev => prev.filter(c => !(c.id === id && c.type === type)))
  }, [])

  const handleSubmit = async () => {
    if (!value.trim() || isLoading || disabled || pendingEdits) return
    
    const prompt = value.trim()
    setIsLoading(true)
    setError(null)
    setLastTokenUsage(null) // Clear previous token usage
    
    // Determine mode: EDIT (with selections) vs GENERATE (no selections)
    const isGenerateMode = selections.length === 0;
    
    // Show loading toast
    const toastId = toast.loading(
      isGenerateMode 
        ? (useExtendedThinking 
            ? `🧠 Extended thinking with ${currentModel?.display_name || 'AI'}...`
            : `Generating content with ${currentModel?.display_name || 'AI'}...`)
        : (useExtendedThinking
            ? `🧠 Extended thinking on ${selections.length} selection${selections.length > 1 ? 's' : ''}...`
            : `Generating edits for ${selections.length} selection${selections.length > 1 ? 's' : ''} with ${currentModel?.display_name || 'AI'}...`)
    )
    
    try {
      // Build mentions array from selected context
      const mentions = selectedContext.map(c => ({
        type: c.type,
        id: c.id,
        name: c.name,
      }))
      
      // Check if client context should be included (either from mentions or clientId)
      const hasClientInMentions = selectedContext.some(c => c.type === 'client')
      const includeClientContext = hasClientInMentions || !!clientId
      
      if (isGenerateMode) {
        // GENERATE MODE: No selections - generate new content and insert at cursor
        const result = await generateInlineEdit(prompt, {
          fullContent: editorContent,
          clientId: clientId,
          includeClientContext,
          model: selectedModel,
          mentions: mentions.length > 0 ? mentions : undefined,
          useExtendedThinking,
        })
        
        if (result.error) {
          toast.error('AI Error', {
            description: result.error,
            id: toastId,
          })
          setError(result.error)
          return
        }
        
        if (result.content) {
          // Use onResponse to insert content at cursor position
          onResponse(result.content);
          
          // Capture token usage if available
          if (result.totalTokens) {
            setLastTokenUsage({
              input: result.inputTokens || 0,
              output: result.outputTokens || 0,
              total: result.totalTokens,
            });
          }
          
          // Clear state
          setValue('');
          setSelectedContext([]);
          
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
          
          toast.success('Content Generated!', {
            description: 'New content inserted at cursor position',
            id: toastId,
          })
        } else {
          setError('No content generated')
          toast.error('No content generated', { id: toastId })
        }
      } else {
        // EDIT MODE: With selections - edit selected text
        const result = await generateInlineEdit(prompt, {
          selections: selections.map(s => ({
            text: s.text,
            from: s.from,
            to: s.to,
          })),
          fullContent: editorContent,
          clientId: clientId,
          includeClientContext,
          model: selectedModel,
          mentions: mentions.length > 0 ? mentions : undefined,
          useExtendedThinking,
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
          
          // Capture token usage if available
          if (result.totalTokens) {
            setLastTokenUsage({
              input: result.inputTokens || 0,
              output: result.outputTokens || 0,
              total: result.totalTokens,
            });
          }
          
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
          
          // Capture token usage if available
          if (result.totalTokens) {
            setLastTokenUsage({
              input: result.inputTokens || 0,
              output: result.outputTokens || 0,
              total: result.totalTokens,
            });
          }
          
          toast.success('Review Suggested Changes', {
            description: 'Edit ready for review',
            id: toastId,
          })
        } else {
          setError('No edits generated')
          toast.error('No edits generated', { id: toastId })
        }
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
    setSelectedContext([]);
    
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
      setSelectedContext([]);
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle inline mention popup navigation
    if (showInlinePopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setInlineSelectedIndex(prev => prev + 1)
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setInlineSelectedIndex(prev => Math.max(0, prev - 1))
        return
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        // Select the current item via ref
        inlineMentionRef.current?.selectCurrent()
        return
      }
      
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowInlinePopup(false)
        setInlineQuery('')
        return
      }
    }
    
    // Normal submit (no inline popup open)
    if (e.key === 'Enter' && !e.shiftKey && !showInlinePopup) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isDisabled = disabled || isLoading || !!pendingEdits

  const handleMentionButtonClick = () => {
    // Focus textarea and insert @ to trigger inline popup
    if (textareaRef.current) {
      textareaRef.current.focus()
      const cursorPos = textareaRef.current.selectionStart || 0
      const newValue = value.slice(0, cursorPos) + '@' + value.slice(cursorPos)
      setValue(newValue)
      setCursorPosition(cursorPos + 1)
      setInlineQuery('')
      setShowInlinePopup(true)
      setInlineSelectedIndex(0)
      setInlinePopupPosition(getCaretCoordinates())
      // Set cursor after @
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(cursorPos + 1, cursorPos + 1)
      }, 0)
    }
  }

  const handlePlusButtonClick = () => {
    setShowContextModal(true)
  }

  return (
    <div ref={containerRef} className="w-full relative space-y-3">
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
      
      {/* Generating Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-primary/20" />
            </div>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              {useExtendedThinking && <Brain className="h-3.5 w-3.5 text-primary" />}
              {useExtendedThinking 
                ? 'Thinking deeply...'
                : selections.length > 0 
                  ? `Editing ${selections.length} selection${selections.length > 1 ? 's' : ''}...` 
                  : 'Generating content...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Container - Cursor Style */}
      {!pendingEdits && (
        <div
          className={cn(
            'bg-muted/30 border rounded-xl px-4 py-3 transition-all space-y-2',
            isFocused ? 'border-border' : 'border-border/50',
            isDisabled && 'opacity-70 cursor-not-allowed',
            isLoading && 'ring-2 ring-primary/20 ring-offset-1 ring-offset-background'
          )}
        >
          {/* Context Pills */}
          {selectedContext.length > 0 && (
            <div className="flex gap-2 flex-wrap pb-2 border-b border-border/30">
              {selectedContext.map((item) => (
                <span
                  key={`${item.type}-${item.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <span className="opacity-60">@</span>
                  {item.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveContext(item.id, item.type)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-3">
            {/* Textarea Input */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isLoading 
                  ? (useExtendedThinking ? 'Thinking deeply...' : 'Generating...') 
                  : selections.length > 0
                    ? `Describe the edit to apply to ${selections.length} selection${selections.length > 1 ? 's' : ''}...`
                    : "Type a prompt to generate content, or highlight text to edit..."
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
                  {/* + Button for Context Modal */}
                  <button
                    type="button"
                    onClick={handlePlusButtonClick}
                    className="hover:text-foreground transition-colors"
                    title="Add context"
                    disabled={isDisabled}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  {/* @ Mention Button */}
                  <button
                    type="button"
                    onClick={handleMentionButtonClick}
                    className="hover:text-foreground transition-colors"
                    title="Add context mention (@)"
                    disabled={isDisabled}
                  >
                    <AtSign className="w-4 h-4" />
                  </button>
                  
                  {/* Extended Thinking Toggle */}
                  <button
                    type="button"
                    className={cn(
                      "hover:text-foreground transition-colors",
                      useExtendedThinking && "text-primary"
                    )}
                    onClick={() => setUseExtendedThinking(!useExtendedThinking)}
                    disabled={isDisabled}
                    title={`Extended Thinking ${useExtendedThinking ? "(On)" : "(Off)"} - Claude thinks deeper before responding`}
                  >
                    <Brain className={cn("w-4 h-4", useExtendedThinking && "text-primary")} />
                  </button>
                  
                  {/* Send Button - Just Icon */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isDisabled || !value.trim()}
                    className={cn(
                      'hover:text-foreground transition-colors',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    title={selections.length === 0 ? 'Generate content at cursor (Enter)' : 'Edit selections (Enter)'}
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
                
                {/* Editor context indicator */}
                {editorContent && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Editor content included as context">
                    <FileText className="h-3 w-3" />
                    <span className="hidden sm:inline">Editor context</span>
                  </div>
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
                  
                  {/* Actual usage from last generation */}
                  {lastTokenUsage && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Used {lastTokenUsage.total.toLocaleString()}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline @ Mention Popup */}
      {showInlinePopup && (
        <InlineMentionPopup
          ref={inlineMentionRef}
          query={inlineQuery}
          position={inlinePopupPosition}
          selectedIndex={inlineSelectedIndex}
          onSelectedIndexChange={setInlineSelectedIndex}
          onSelect={handleSelectContext}
          onClose={() => {
            setShowInlinePopup(false)
            setInlineQuery('')
          }}
          clients={clients}
          projects={projects}
          contentAssets={contentAssets}
          journalEntries={journalEntries}
          writingFrameworks={writingFrameworks}
        />
      )}

      {/* Full Context Picker Modal */}
      <ContextPickerModal
        open={showContextModal}
        onOpenChange={setShowContextModal}
        onSelect={handleSelectContextFromModal}
        clients={clients}
        projects={projects}
        contentAssets={contentAssets}
        journalEntries={journalEntries}
        writingFrameworks={writingFrameworks}
      />
    </div>
  )
}
