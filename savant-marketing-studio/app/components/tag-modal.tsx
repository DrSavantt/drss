'use client'

import { useState } from 'react'

interface TagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tags: string[]) => void
  title?: string
}

export function TagModal({ isOpen, onClose, onConfirm, title = "Add Tags" }: TagModalProps) {
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  if (!isOpen) return null

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleConfirm = () => {
    if (tags.length > 0) {
      onConfirm(tags)
      setTags([])
      setTagInput('')
      onClose()
    }
  }

  const handleCancel = () => {
    setTags([])
    setTagInput('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal border border-mid-gray rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
        
        {/* Tag Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-silver mb-2">
            Enter tags (press Enter to add)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., urgent, idea, todo"
              className="flex-1 px-3 py-2 bg-dark-gray border border-mid-gray rounded-lg text-foreground placeholder-slate focus:outline-none focus:border-red-primary"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-silver mb-2">Tags to add:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-primary/20 text-red-primary rounded-full text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-bright"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-mid-gray text-silver hover:text-foreground hover:bg-dark-gray rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={tags.length === 0}
            className="px-4 py-2 bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {tags.length} {tags.length === 1 ? 'Tag' : 'Tags'}
          </button>
        </div>
      </div>
    </div>
  )
}
