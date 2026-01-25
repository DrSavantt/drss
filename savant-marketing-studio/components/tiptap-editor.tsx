'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { AIPromptBar, AIModel } from '@/components/editor/ai-prompt-bar'
import { FloatingSelectionMenu } from '@/components/editor/floating-selection-menu'

export interface TiptapEditorProps {
  content?: string | object
  onChange?: (html: string) => void
  editable?: boolean
  showAIBar?: boolean
  clientId?: string
  models?: AIModel[]
  // Context injection - entity data for AI mentions
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

export function TiptapEditor({
  content = '',
  onChange,
  editable = true,
  showAIBar = true,
  clientId,
  models = [],
  // Context injection props
  clients = [],
  projects = [],
  contentAssets = [],
  journalEntries = [],
  writingFrameworks = [],
}: TiptapEditorProps) {
  const [showHtml, setShowHtml] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const aiBarRef = useRef<HTMLDivElement>(null)
  
  // State for pending selection from floating menu
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    from: number;
    to: number;
  } | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')
      setSelectedText(text)
      setSelectionRange(text ? { from, to } : null)
    },
    editorProps: {
      attributes: {
        class: editable 
          ? 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-6 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed'
          : 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed'
      }
    }
  })

  // Update editor content when prop changes (handles both HTML string and JSON object)
  useEffect(() => {
    if (editor && content) {
      const currentHTML = editor.getHTML()
      // If content is string (HTML), compare directly
      // If content is object (JSON), setContent can handle it directly
      if (typeof content === 'string' && content !== currentHTML) {
        editor.commands.setContent(content)
      } else if (typeof content === 'object') {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Clear selection handler - collapses selection to cursor position
  const clearSelection = useCallback(() => {
    if (editor) {
      const { from } = editor.state.selection
      editor.commands.setTextSelection(from)
      setSelectedText('')
      setSelectionRange(null)
    }
  }, [editor])

  // Replace selection at specific position - for multi-selection support
  const replaceSelection = useCallback((from: number, to: number, newText: string) => {
    if (editor) {
      const deletedSize = to - from
      const docSizeBefore = editor.state.doc.content.size
      
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(newText)
        .run()
      
      // Calculate and select the newly inserted content
      const docSizeAfter = editor.state.doc.content.size
      const insertedSize = docSizeAfter - docSizeBefore + deletedSize
      
      if (insertedSize > 0) {
        editor.chain()
          .setTextSelection({ from, to: from + insertedSize })
          .run()
      }
    }
  }, [editor])

  // Handler for adding selection from floating menu
  const handleAddSelectionFromFloat = useCallback(() => {
    if (selectedText && selectionRange) {
      setPendingSelection({
        text: selectedText,
        from: selectionRange.from,
        to: selectionRange.to,
      });
      // Clear editor selection
      clearSelection();
    }
  }, [selectedText, selectionRange, clearSelection])

  // Handler to clear pending selection after it's been handled
  const handlePendingSelectionHandled = useCallback(() => {
    setPendingSelection(null);
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div className={editable ? 'border border-mid-gray/30 rounded-lg overflow-hidden' : ''}>
      {/* Toolbar - Only when editing */}
      {editable && (
        <div className="border-b border-mid-gray/30 bg-charcoal/30 px-3 py-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('bold')
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            Bold
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('italic')
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            Italic
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            H1
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            H2
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            H3
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            • List
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-red-primary/20 text-red-primary'
                : 'text-silver/70 hover:bg-charcoal hover:text-silver'
            }`}
            type="button"
          >
            1. List
          </button>

          <div className="ml-auto flex items-center gap-2">
            {showAIBar && models.length > 0 && (
              <button
                onClick={() => {
                  aiBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  // Focus the AI prompt bar textarea after a short delay
                  setTimeout(() => {
                    const textarea = aiBarRef.current?.querySelector('textarea')
                    textarea?.focus()
                  }, 300)
                }}
                className="px-2.5 py-1 rounded text-xs font-medium bg-red-primary/10 text-red-primary hover:bg-red-primary/20 transition-colors flex items-center gap-1.5"
                type="button"
                title="Ask AI to edit or enhance"
              >
                <Sparkles className="w-3 h-3" />
                Ask AI
              </button>
            )}
            
            <button
              onClick={() => setShowHtml(!showHtml)}
              className="px-2.5 py-1 rounded text-xs font-medium text-silver/70 hover:bg-charcoal hover:text-silver transition-colors"
              type="button"
            >
              {showHtml ? 'Hide HTML' : 'Show HTML'}
            </button>
          </div>
        </div>
      )}

      {/* Editor Content - Clean Document Style */}
      <div className={`tiptap-editor-container relative ${editable ? 'bg-dark-gray/30' : ''}`}>
        <EditorContent editor={editor} />
        
        {/* Floating Selection Menu - Google Docs style with inline editing */}
        {showAIBar && editable && models && models.length > 0 && (
          <FloatingSelectionMenu
            editor={editor}
            models={models}
            clientId={clientId}
            onAddToList={selectedText ? handleAddSelectionFromFloat : undefined}
            disabled={isGenerating}
            // Context injection - entity data for @mentions
            clients={clients}
            projects={projects}
            contentAssets={contentAssets}
            journalEntries={journalEntries}
            writingFrameworks={writingFrameworks}
          />
        )}
      </div>

      {/* HTML Output */}
      {showHtml && (
        <div className="border-t border-mid-gray/30 bg-charcoal/30 p-4">
          <p className="text-xs font-semibold text-silver mb-2">HTML Output:</p>
          <pre className="text-xs bg-dark-gray/50 p-3 rounded border border-mid-gray/30 overflow-x-auto text-slate">
            <code>{editor.getHTML()}</code>
          </pre>
        </div>
      )}

      {/* AI Prompt Bar - Multi-Selection Support */}
      {showAIBar && editable && models.length > 0 && (
        <div 
          ref={aiBarRef}
          className="border-t border-mid-gray/30 p-4"
        >
          <AIPromptBar
            editorContent={editor.getHTML()}
            selectedText={selectedText}
            selectionRange={selectionRange}
            onClearSelection={clearSelection}
            onReplaceSelection={replaceSelection}
            clientId={clientId}
            showModelSelector={true}
            models={models}
            pendingSelection={pendingSelection}
            onPendingSelectionHandled={handlePendingSelectionHandled}
            // Context injection - entity data
            clients={clients}
            projects={projects}
            contentAssets={contentAssets}
            journalEntries={journalEntries}
            writingFrameworks={writingFrameworks}
            onResponse={(text) => {
              setIsGenerating(true)
              
              try {
                // Track position before insertion for post-insert selection
                const insertPos = selectedText && selectionRange 
                  ? selectionRange.from 
                  : editor.state.selection.from > 0 
                    ? editor.state.selection.from 
                    : editor.state.doc.content.size
                
                const docSizeBefore = editor.state.doc.content.size
                
                // Fallback for single response (when not using multi-selection targeted replacement)
                if (selectedText && selectedText.length > 0 && selectionRange) {
                  // Replace selected text with AI response
                  editor.chain().focus().deleteSelection().insertContent(text).run()
                } else {
                  // Insert at current cursor position or append to end
                  const { from } = editor.state.selection
                  if (from > 0) {
                    editor.chain().focus().insertContent(text).run()
                  } else {
                    // Append to end of document
                    const endPos = editor.state.doc.content.size
                    editor.chain().focus().insertContentAt(endPos, text).run()
                  }
                }
                
                // Calculate inserted content size and select it
                const docSizeAfter = editor.state.doc.content.size
                const deletedSize = selectedText?.length || 0
                const insertedSize = docSizeAfter - docSizeBefore + deletedSize
                
                if (insertedSize > 0) {
                  // Select the newly inserted content so user can see what was added
                  editor.chain()
                    .setTextSelection({ from: insertPos, to: insertPos + insertedSize })
                    .run()
                }
                
                // Clear selection state (but keep editor selection on new content)
                setSelectedText('')
                setSelectionRange(null)
              } catch (error) {
                console.error('Failed to insert AI content:', error)
              } finally {
                setIsGenerating(false)
              }
            }}
            disabled={isGenerating}
          />
        </div>
      )}
    </div>
  )
}
