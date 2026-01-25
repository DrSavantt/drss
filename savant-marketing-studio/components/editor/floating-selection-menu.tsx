'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, Send, X, Check, Loader2, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/utils';
import { generateInlineEdit } from '@/app/actions/ai';
import { InlineMentionPopup, type InlineMentionPopupRef } from '@/components/ai-chat/inline-mention-popup';
import type { ContextItem, ContextItemType } from '@/components/ai-chat/context-picker-modal';

interface AIModel {
  id: string;
  model_name: string;
  display_name: string;
  max_tokens: number | null;
}

interface FloatingSelectionMenuProps {
  editor: Editor | null;
  models: AIModel[];
  clientId?: string;
  onAddToList?: () => void; // Keep option to add to main list
  disabled?: boolean;
  // Context injection props for @mentions
  clients?: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string; clientName?: string | null }>;
  contentAssets?: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>;
  journalEntries?: Array<{
    id: string;
    title: string | null;
    content: string;
    tags?: string[] | null;
    mentionedClients?: Array<{ id: string; name: string }>;
    mentionedProjects?: Array<{ id: string; name: string }>;
    mentionedContent?: Array<{ id: string; name: string }>;
  }>;
  writingFrameworks?: Array<{ id: string; name: string; category?: string }>;
}

export function FloatingSelectionMenu({ 
  editor, 
  models,
  clientId,
  onAddToList,
  disabled,
  // Context injection props
  clients = [],
  projects = [],
  contentAssets = [],
  journalEntries = [],
  writingFrameworks = [],
}: FloatingSelectionMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[0]?.model_name || '');
  
  // Preview state
  const [pendingEdit, setPendingEdit] = useState<{
    original: string;
    suggested: string;
    from: number;
    to: number;
  } | null>(null);
  
  // Current selection info
  const [selection, setSelection] = useState<{
    text: string;
    from: number;
    to: number;
  } | null>(null);
  
  // Context injection state for @mentions
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [showInlinePopup, setShowInlinePopup] = useState(false);
  const [inlineQuery, setInlineQuery] = useState('');
  const [inlinePopupPosition, setInlinePopupPosition] = useState({ top: 0, left: 0 });
  const [inlineSelectedIndex, setInlineSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineMentionRef = useRef<InlineMentionPopupRef>(null);

  // Update model when models change
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].model_name);
    }
  }, [models, selectedModel]);

  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    
    if (!text || text.length === 0) {
      // Only hide if not in expanded mode with pending edit
      if (!pendingEdit && !isExpanded) {
        setIsVisible(false);
        setSelection(null);
      }
      return;
    }

    setSelection({ text, from, to });

    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    
    const editorElement = view.dom.closest('.tiptap-editor-container');
    if (!editorElement) {
      setIsVisible(false);
      return;
    }
    
    const editorRect = editorElement.getBoundingClientRect();
    
    // Adjust width and height based on state
    const menuWidth = isExpanded ? 320 : 200;
    const menuHeight = isExpanded ? (pendingEdit ? 300 : 240) : 44;
    
    const selectionCenter = (start.left + end.left) / 2;
    
    let left = selectionCenter - editorRect.left - (menuWidth / 2);
    // Keep within editor bounds
    left = Math.max(8, Math.min(left, editorRect.width - menuWidth - 8));
    
    // Position above selection with gap
    let top = start.top - editorRect.top - menuHeight - 12;
    
    // If would go above editor, position below selection instead
    if (top < 8) {
      top = end.bottom - editorRect.top + 12;
    }

    setPosition({ top, left });
    setIsVisible(true);
  }, [editor, isExpanded, pendingEdit]);

  // Debounced position update
  const debouncedUpdatePosition = useCallback(
    debounce(updatePosition, 50),
    [updatePosition]
  );

  useEffect(() => {
    if (!editor) return;

    // Update on selection change
    editor.on('selectionUpdate', debouncedUpdatePosition);
    
    // Also update on scroll
    const editorElement = editor.view.dom.closest('.tiptap-editor-container');
    const handleScroll = () => {
      if (isVisible) updatePosition();
    };
    editorElement?.addEventListener('scroll', handleScroll);

    // Handle window resize
    const handleResize = () => {
      if (isVisible) updatePosition();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      editor.off('selectionUpdate', debouncedUpdatePosition);
      editorElement?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      debouncedUpdatePosition.cancel();
    };
  }, [editor, isVisible, updatePosition, debouncedUpdatePosition]);

  // Update position when expanded state changes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isExpanded, pendingEdit, isVisible, updatePosition]);

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current && !pendingEdit) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isExpanded, pendingEdit]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Don't close if clicking in editor while collapsed
        if (!isExpanded) {
          const editorElement = editor?.view.dom;
          if (editorElement?.contains(e.target as Node)) return;
        }
        
        // If expanded with pending edit, don't auto-close
        if (pendingEdit) return;
        
        handleCollapse();
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editor, isExpanded, pendingEdit]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        if (pendingEdit) {
          handleReject();
        } else if (isExpanded) {
          handleCollapse();
        } else {
          setIsVisible(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isExpanded, pendingEdit]);

  const handleExpand = () => {
    setIsExpanded(true);
    setError(null);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setPrompt('');
    setError(null);
    setPendingEdit(null);
    setSelectedContext([]);
    setShowInlinePopup(false);
    setInlineQuery('');
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !selection || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build mentions array from selected context
      const mentions = selectedContext.map(c => ({
        type: c.type,
        id: c.id,
        name: c.name,
      }));
      
      const result = await generateInlineEdit(prompt, {
        selectedText: selection.text,
        fullContent: editor?.getHTML() || '',
        clientId,
        model: selectedModel,
        mentions: mentions.length > 0 ? mentions : undefined,
      });
      
      if (!result.error && result.content) {
        setPendingEdit({
          original: selection.text,
          suggested: result.content,
          from: selection.from,
          to: selection.to,
        });
      } else {
        setError(result.error || 'Failed to generate edit');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (!pendingEdit || !editor) return;
    
    const { from, to, suggested } = pendingEdit;
    const deletedSize = to - from;
    const docSizeBefore = editor.state.doc.content.size;
    
    // Replace the selection with the suggested text
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteSelection()
      .insertContent(suggested)
      .run();
    
    // Calculate and select the newly inserted content
    const docSizeAfter = editor.state.doc.content.size;
    const insertedSize = docSizeAfter - docSizeBefore + deletedSize;
    
    if (insertedSize > 0) {
      // Select the newly inserted content so user can see what was added
      editor.chain()
        .setTextSelection({ from, to: from + insertedSize })
        .run();
    }
    
    // Reset state
    setPendingEdit(null);
    setPrompt('');
    setIsExpanded(false);
    setIsVisible(false);
    setSelection(null);
  };

  const handleReject = () => {
    setPendingEdit(null);
    // Keep prompt so user can modify and retry
  };

  // Calculate caret position for inline popup
  const getCaretCoordinates = useCallback(() => {
    if (!textareaRef.current || !menuRef.current) return { top: 0, left: 0 };
    
    const menuRect = menuRef.current.getBoundingClientRect();
    
    // Position popup above the menu
    return {
      top: menuRect.top - 10,
      left: menuRect.left + 16,
    };
  }, []);

  // Handle input change with @ detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    setPrompt(newValue);
    setCursorPosition(newCursorPos);
    setError(null);
    
    // Detect @ for inline popup
    const textBeforeCursor = newValue.slice(0, newCursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setInlineQuery(atMatch[1] || '');
      setShowInlinePopup(true);
      setInlineSelectedIndex(0);
      setInlinePopupPosition(getCaretCoordinates());
    } else {
      setShowInlinePopup(false);
      setInlineQuery('');
    }
  }, [getCaretCoordinates]);

  // Handle context selection from inline popup
  const handleSelectContext = useCallback((item: ContextItem) => {
    // Avoid duplicates
    if (!selectedContext.find(c => c.type === item.type && c.id === item.id)) {
      setSelectedContext(prev => [...prev, item]);
    }
    
    // Remove @query from input if inline popup was used
    if (showInlinePopup) {
      const textBeforeCursor = prompt.slice(0, cursorPosition);
      const textAfterCursor = prompt.slice(cursorPosition);
      const newText = textBeforeCursor.replace(/@\w*$/, '') + textAfterCursor;
      setPrompt(newText);
    }
    
    setShowInlinePopup(false);
    setInlineQuery('');
    
    // Focus back on textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [selectedContext, showInlinePopup, prompt, cursorPosition]);

  // Remove context item
  const handleRemoveContext = useCallback((id: string, type: ContextItemType) => {
    setSelectedContext(prev => prev.filter(c => !(c.id === id && c.type === type)));
  }, []);

  const handleKeyDownTextarea = (e: React.KeyboardEvent) => {
    // Handle inline mention popup navigation
    if (showInlinePopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setInlineSelectedIndex(prev => prev + 1);
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setInlineSelectedIndex(prev => Math.max(0, prev - 1));
        return;
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        inlineMentionRef.current?.selectCurrent();
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowInlinePopup(false);
        setInlineQuery('');
        return;
      }
    }
    
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !showInlinePopup) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddToListClick = () => {
    if (onAddToList) {
      onAddToList();
      setIsVisible(false);
      setIsExpanded(false);
    }
  };

  if (!isVisible || disabled || models.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 animate-in fade-in-0 zoom-in-95 duration-150",
        "bg-popover border border-border rounded-lg shadow-xl",
        isExpanded ? "w-80" : "w-auto"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {!isExpanded ? (
        /* Collapsed: Just buttons */
        <div className="flex items-center gap-1 p-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExpand}
            className="h-8 px-3 gap-2 text-sm font-medium hover:bg-accent"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Edit with AI
          </Button>
          {onAddToList && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddToListClick}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Add to edit list below"
            >
              + List
            </Button>
          )}
        </div>
      ) : (
        /* Expanded: Full editing UI */
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Edit Selection
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCollapse}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Selection Preview */}
          <div className="text-xs bg-muted/50 rounded px-2 py-1.5 max-h-16 overflow-y-auto border border-border/50">
            <span className="text-muted-foreground">Editing: </span>
            <span className="text-foreground">
              "{selection?.text.slice(0, 100)}{(selection?.text.length || 0) > 100 ? '...' : ''}"
            </span>
          </div>
          
          {/* Pending Edit Preview */}
          {pendingEdit && (
            <div className="space-y-2 p-2 bg-muted/30 rounded-lg border border-border">
              <div className="text-xs font-medium text-muted-foreground">Suggested Edit:</div>
              <div className="text-sm space-y-1.5 max-h-32 overflow-y-auto">
                <div className="line-through text-red-500/80 bg-red-500/10 px-2 py-1 rounded text-xs">
                  {pendingEdit.original.slice(0, 200)}{pendingEdit.original.length > 200 ? '...' : ''}
                </div>
                <div className="text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs">
                  {pendingEdit.suggested.slice(0, 200)}{pendingEdit.suggested.length > 200 ? '...' : ''}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAccept} className="h-7 flex-1 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleReject} className="h-7 flex-1 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
          
          {/* Prompt Input (hide when showing preview) */}
          {!pendingEdit && (
            <>
              {/* Context Pills */}
              {selectedContext.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pb-2 border-b border-border/30">
                  {selectedContext.map((item) => (
                    <span
                      key={`${item.type}-${item.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      <span className="opacity-60">@</span>
                      {item.name.slice(0, 15)}{item.name.length > 15 ? '...' : ''}
                      <button
                        type="button"
                        onClick={() => handleRemoveContext(item.id, item.type)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDownTextarea}
                  placeholder="Describe the change... @ for context (⌘+Enter)"
                  className="min-h-[60px] max-h-[100px] text-sm resize-none pr-8"
                  disabled={isLoading}
                />
                
                {/* @ Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      const cursorPos = textareaRef.current.selectionStart || 0;
                      const newValue = prompt.slice(0, cursorPos) + '@' + prompt.slice(cursorPos);
                      setPrompt(newValue);
                      setCursorPosition(cursorPos + 1);
                      setInlineQuery('');
                      setShowInlinePopup(true);
                      setInlineSelectedIndex(0);
                      setInlinePopupPosition(getCaretCoordinates());
                      setTimeout(() => {
                        textareaRef.current?.setSelectionRange(cursorPos + 1, cursorPos + 1);
                      }, 0);
                    }
                  }}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Add context (@)"
                  disabled={isLoading}
                >
                  <AtSign className="h-4 w-4" />
                </button>
              </div>
              
              {/* Model selector + Submit */}
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.model_name} className="text-xs">
                        {model.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isLoading || !prompt.trim()}
                  className="h-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          
          {/* Error */}
          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 rounded px-2 py-1.5 border border-red-500/20">
              {error}
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
            setShowInlinePopup(false);
            setInlineQuery('');
          }}
          clients={clients}
          projects={projects}
          contentAssets={contentAssets}
          journalEntries={journalEntries}
          writingFrameworks={writingFrameworks}
        />
      )}
    </div>
  );
}
