'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'

interface TiptapEditorProps {
  content?: string
  onChange?: (html: string) => void
  editable?: boolean
}

export function TiptapEditor({
  content = '',
  onChange,
  editable = true
}: TiptapEditorProps) {
  const [showHtml, setShowHtml] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 text-foreground'
      }
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border border-mid-gray rounded-lg overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-mid-gray bg-charcoal p-2 flex flex-wrap gap-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('bold')
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            Bold
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('italic')
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            Italic
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            H1
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            H2
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            H3
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            • List
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-red-primary text-foreground'
                : 'bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground'
            }`}
            type="button"
          >
            1. List
          </button>

          <div className="ml-auto">
            <button
              onClick={() => setShowHtml(!showHtml)}
              className="px-3 py-1 rounded text-sm font-medium bg-dark-gray text-silver hover:bg-mid-gray hover:text-foreground transition-colors"
              type="button"
            >
              {showHtml ? 'Hide HTML' : 'Show HTML'}
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="bg-dark-gray">
      <EditorContent editor={editor} />
      </div>

      {/* HTML Output */}
      {showHtml && (
        <div className="border-t border-mid-gray bg-charcoal p-4">
          <p className="text-xs font-semibold text-silver mb-2">HTML Output:</p>
          <pre className="text-xs bg-dark-gray p-3 rounded border border-mid-gray overflow-x-auto text-slate">
            <code>{editor.getHTML()}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
