'use client'

import { useState, useEffect } from 'react'
import { X, Folder, Inbox, Plus, Check } from 'lucide-react'
import { JournalFolder, createJournalFolder } from '@/app/actions/journal-folders'

interface JournalFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folders: JournalFolder[]
  selectedFolder: string | null
  onSelectFolder: (folderId: string | null) => void
  totalCount: number
  onFoldersChange: () => void
}

const FOLDER_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
]

export function JournalFolderModal({ 
  isOpen, 
  onClose, 
  folders, 
  selectedFolder, 
  onSelectFolder,
  totalCount,
  onFoldersChange
}: JournalFolderModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    setIsSubmitting(true)
    try {
      await createJournalFolder(newFolderName.trim(), selectedColor)
      setNewFolderName('')
      setIsCreating(false)
      onFoldersChange()
    } catch (error) {
      console.error('Failed to create folder:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelect = (folderId: string | null) => {
    onSelectFolder(folderId)
    onClose()
  }

  // Shared folder list content
  const FolderListContent = ({ compact = false }: { compact?: boolean }) => {
    const itemClass = compact ? "px-3 py-2.5" : "px-4 py-3"
    const iconSize = compact ? "w-4 h-4" : "w-5 h-5"
    const textSize = compact ? "text-sm" : "text-base"
    
    return (
      <>
        {/* All Items option */}
        <button
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center justify-between ${itemClass} rounded-xl transition-colors ${
            selectedFolder === null 
              ? 'bg-red-primary/10 border border-red-primary/30' 
              : 'hover:bg-surface-highlight'
          }`}
        >
          <div className="flex items-center gap-3">
            <Inbox className={`${iconSize} text-silver`} />
            <span className={`text-foreground font-medium ${textSize}`}>All Items</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-silver">({totalCount})</span>
            {selectedFolder === null && (
              <Check className={`${iconSize} text-red-primary`} />
            )}
          </div>
        </button>

        {/* Folder items */}
        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => handleSelect(folder.id)}
            className={`w-full flex items-center justify-between ${itemClass} rounded-xl transition-colors ${
              selectedFolder === folder.id 
                ? 'bg-red-primary/10 border border-red-primary/30' 
                : 'hover:bg-surface-highlight'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className={iconSize} style={{ color: folder.color }} />
              <span className={`text-foreground ${textSize}`}>{folder.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-silver">({folder.chat_count || 0})</span>
              {selectedFolder === folder.id && (
                <Check className={`${iconSize} text-red-primary`} />
              )}
            </div>
          </button>
        ))}

        {/* Create new folder section */}
        {isCreating ? (
          <div className="mt-2 p-4 bg-surface-highlight rounded-xl border border-border">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder-slate focus:border-red-primary focus:outline-none mb-3"
            />
            
            {/* Color picker */}
            <div className="flex gap-2 mb-3">
              {FOLDER_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewFolderName('')
                }}
                className="flex-1 px-4 py-2 text-sm text-silver hover:text-foreground transition-colors rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isSubmitting}
                className="flex-1 px-4 py-2 text-sm bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className={`w-full flex items-center gap-3 ${itemClass} rounded-xl hover:bg-surface-highlight text-red-primary transition-colors mt-2 border-t border-border pt-4`}
          >
            <Plus className={iconSize} />
            <span className={`font-medium ${textSize}`}>New Folder</span>
          </button>
        )}
      </>
    )
  }

  return (
    <>
      {/* Blurred backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
          transition-opacity duration-200 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ willChange: 'opacity' }}
      />

      {/* DESKTOP: Centered modal */}
      <div
        className={`hidden md:flex fixed inset-0 z-[101] items-center justify-center p-4
          transition-all duration-200 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Folders</h2>
            <button 
              onClick={onClose}
              className="p-1 text-silver hover:text-foreground transition-colors rounded-lg hover:bg-surface-highlight"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Folder list */}
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <FolderListContent compact={false} />
          </div>
        </div>
      </div>

      {/* MOBILE: Bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[101] bg-surface border-t border-border rounded-t-2xl 
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ 
          maxHeight: '70vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          willChange: 'transform'
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-mid-gray rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Folders</h2>
          <button 
            onClick={onClose}
            className="p-1 text-silver hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folders list */}
        <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          <FolderListContent compact={true} />
        </div>
      </div>
    </>
  )
}

