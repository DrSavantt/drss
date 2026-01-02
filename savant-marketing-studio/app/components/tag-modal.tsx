'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AnimatedButton } from '@/components/animated-button'

interface TagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tags: string[]) => void
  title?: string
}

export function TagModal({ isOpen, onClose, onConfirm, title = "Add Tags" }: TagModalProps) {
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

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
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) handleCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
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
              <AnimatedButton variant="primary" onClick={handleAddTag} className="h-10 px-4">
                Add
              </AnimatedButton>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
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

          <div className="flex gap-3 justify-end">
            <AnimatedButton
              variant="secondary"
              onClick={handleCancel}
              className="h-10 px-4"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={handleConfirm}
              disabled={tags.length === 0}
              className="h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {tags.length} {tags.length === 1 ? 'Tag' : 'Tags'}
            </AnimatedButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
