'use client'

import { useState } from 'react'
import { 
  Search, 
  Edit3, 
  MessageCircle, 
  Inbox, 
  ChevronRight, 
  Star, 
  Folder, 
  Plus,
  Sparkles
} from 'lucide-react'
import { JournalFolder } from '@/app/actions/journal-folders'

interface Props {
  selectedFolder: string | null
  onSelectFolder: (folderId: string | null) => void
  onCapture: () => void
  onSearch: () => void
  folders: JournalFolder[]
  totalCount: number
  onCreateFolder: () => void
}

export function JournalSidebar({ 
  selectedFolder, 
  onSelectFolder, 
  onCapture,
  onSearch,
  folders,
  totalCount,
  onCreateFolder
}: Props) {
  const [foldersExpanded, setFoldersExpanded] = useState(true)
  
  // Get pinned/favorite folders (first 3 with most items)
  const favoritesFolders = [...folders]
    .sort((a, b) => (b.chat_count || 0) - (a.chat_count || 0))
    .slice(0, 3)

  return (
    <aside className="h-full border-r border-border flex flex-col bg-surface/50">
      {/* Top actions */}
      <div className="p-4 space-y-2">
        <button 
          onClick={onSearch}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-highlight text-left transition-colors"
        >
          <Search className="w-4 h-4 text-silver" />
          <span className="text-sm text-foreground">Search</span>
          <kbd className="ml-auto text-xs text-silver bg-surface-highlight px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
        
        <button 
          onClick={onCapture}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-primary hover:bg-red-bright text-white text-left transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-sm font-medium">Capture</span>
        </button>
        
        <button 
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-highlight text-left transition-colors opacity-50 cursor-not-allowed"
          disabled
          title="Coming soon"
        >
          <MessageCircle className="w-4 h-4 text-silver" />
          <span className="text-sm text-foreground">Chat</span>
          <span className="ml-auto text-xs text-silver">Soon</span>
        </button>
      </div>
      
      <div className="h-px bg-border mx-4" />
      
      {/* Scrollable folder tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* All Items */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-highlight text-left text-sm transition-colors ${
            !selectedFolder ? 'bg-surface-highlight text-red-primary' : 'text-foreground'
          }`}
        >
          <Inbox className={`w-4 h-4 ${!selectedFolder ? 'text-red-primary' : 'text-silver'}`} />
          <span className="font-medium">All Items</span>
          <span className="ml-auto text-xs text-silver">({totalCount})</span>
        </button>
        
        {/* Favorites Section */}
        {favoritesFolders.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="w-full flex items-center gap-2 px-2 py-1 text-xs font-medium text-silver hover:text-foreground transition-colors"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${foldersExpanded ? 'rotate-90' : ''}`} />
              <span className="uppercase tracking-wider">Favorites</span>
            </button>
            
            {foldersExpanded && (
              <div className="mt-1 space-y-0.5">
                {favoritesFolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-6 py-1.5 rounded-lg hover:bg-surface-highlight text-left text-sm transition-colors ${
                      selectedFolder === folder.id ? 'bg-surface-highlight text-red-primary' : 'text-foreground'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 text-warning" />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto text-xs text-silver">({folder.chat_count || 0})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* All Folders Section */}
        <div className="mt-5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-silver uppercase tracking-wider">Folders</span>
            <button 
              onClick={onCreateFolder}
              className="p-1 hover:bg-surface-highlight rounded transition-colors"
            >
              <Plus className="w-3 h-3 text-silver hover:text-foreground" />
            </button>
          </div>
          
          <div className="mt-1 space-y-0.5">
            {folders.length === 0 ? (
              <p className="px-6 py-2 text-xs text-silver">No folders yet</p>
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-6 py-1.5 rounded-lg hover:bg-surface-highlight text-left text-sm transition-colors ${
                    selectedFolder === folder.id ? 'bg-surface-highlight text-red-primary' : 'text-foreground'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" style={{ color: folder.color }} />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-xs text-silver">({folder.chat_count || 0})</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom upgrade prompt */}
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-surface-highlight to-surface rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-warning" />
            <p className="text-sm font-medium text-foreground">Premium</p>
          </div>
          <p className="text-xs text-silver mb-3">Unlimited storage & AI features</p>
          <button className="w-full py-2 bg-red-primary hover:bg-red-bright text-white rounded-lg text-sm font-medium transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  )
}

