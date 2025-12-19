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
  Zap,
  MoreVertical
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
  const [favoritesExpanded, setFavoritesExpanded] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  
  // Get pinned/favorite folders (first 2 with most items)
  const favoritesFolders = [...folders]
    .sort((a, b) => (b.chat_count || 0) - (a.chat_count || 0))
    .slice(0, 2)

  return (
    <aside className="h-full border-r border-border/50 flex flex-col bg-[#0A0A0A]">
      {/* Top section with better spacing */}
      <div className="p-4 space-y-3">
        {/* Search with focus state */}
        <div className={`relative transition-all ${searchFocused ? 'ring-1 ring-red-primary/30' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/60" />
          <button
            onClick={onSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-12 py-2.5 bg-surface/50 border border-border/50 rounded-lg text-sm text-left outline-none hover:border-red-primary/50 transition-colors text-silver/70"
          >
            Search...
          </button>
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface border border-border/30 rounded text-[10px] text-silver/60 font-mono">
            ⌘K
          </kbd>
        </div>
        
        {/* Capture button - more prominent */}
        <button 
          onClick={onCapture}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-br from-red-primary to-red-primary/80 hover:from-red-primary/90 hover:to-red-primary/70 text-white rounded-lg transition-all shadow-lg shadow-red-primary/20 hover:shadow-xl hover:shadow-red-primary/30"
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-sm font-semibold">New Capture</span>
        </button>
      </div>
      
      {/* Navigation items */}
      <div className="px-3 pb-3 space-y-1">
        <NavItem 
          icon={MessageCircle} 
          label="Chat" 
          badge="Soon" 
          disabled
        />
        <NavItem 
          icon={Inbox} 
          label="All Items" 
          count={totalCount}
          active={!selectedFolder}
          onClick={() => onSelectFolder(null)}
        />
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-4" />
      
      {/* Scrollable folders */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Favorites */}
        {favoritesFolders.length > 0 && (
          <FolderSection 
            title="Favorites" 
            icon={Star}
            expanded={favoritesExpanded}
            onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
            items={favoritesFolders}
            selectedId={selectedFolder}
            onSelect={onSelectFolder}
            isFavorites
          />
        )}
        
        {/* Folders */}
        <FolderSection 
          title="Folders" 
          icon={Folder}
          expanded={foldersExpanded}
          onToggle={() => setFoldersExpanded(!foldersExpanded)}
          items={folders}
          selectedId={selectedFolder}
          onSelect={onSelectFolder}
          onAdd={onCreateFolder}
        />
      </div>
      
      {/* Bottom premium card */}
      <div className="p-4 border-t border-border/50">
        <div className="relative overflow-hidden bg-gradient-to-br from-surface/80 to-surface/40 rounded-xl p-4 border border-border/30">
          {/* Gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-primary/10 to-transparent" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-primary" />
              <span className="text-xs font-semibold text-foreground">Upgrade to Premium</span>
            </div>
            <p className="text-xs text-silver/80 mb-3 leading-relaxed">
              Unlimited storage, AI features & more
            </p>
            <button className="w-full py-2 bg-red-primary hover:bg-red-primary/90 text-white rounded-lg text-xs font-semibold transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

// Nav item component
interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
  count?: number
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, badge, count, active, disabled, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active 
          ? 'bg-surface/80 text-foreground shadow-sm' 
          : disabled
          ? 'text-silver/40 cursor-not-allowed'
          : 'text-silver/70 hover:text-foreground hover:bg-surface/40'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-silver/60 font-medium">{count}</span>
      )}
      {badge && (
        <span className="ml-auto px-2 py-0.5 bg-surface-highlight text-[10px] font-semibold text-silver/70 rounded-full">
          {badge}
        </span>
      )}
    </button>
  )
}

// Folder section component
interface FolderSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: JournalFolder[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd?: () => void
  expanded: boolean
  onToggle: () => void
  isFavorites?: boolean
}

function FolderSection({ 
  title, 
  icon: Icon, 
  items, 
  selectedId, 
  onSelect, 
  onAdd,
  expanded,
  onToggle,
  isFavorites
}: FolderSectionProps) {
  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-1">
        <button 
          onClick={onToggle}
          className="flex items-center gap-2 text-xs font-semibold text-silver/60 hover:text-silver/80 uppercase tracking-wider"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <Icon className="w-3 h-3" />
          <span>{title}</span>
        </button>
        
        {onAdd && (
          <button 
            onClick={onAdd}
            className="p-1 hover:bg-surface/40 rounded transition-colors"
            title="Create folder"
          >
            <Plus className="w-3 h-3 text-silver/60" />
          </button>
        )}
      </div>
      
      {/* Items */}
      {expanded && (
        <div className="space-y-0.5">
          {items.length === 0 ? (
            <p className="px-3 py-2 text-xs text-silver/50">No folders yet</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                  selectedId === item.id
                    ? 'bg-surface/80 text-foreground shadow-sm'
                    : 'text-silver/70 hover:text-foreground hover:bg-surface/40'
                }`}
              >
                {isFavorites ? (
                  <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                ) : (
                  <Folder className="w-3.5 h-3.5" style={{ color: item.color || '#666' }} />
                )}
                <span className="flex-1 truncate text-left">{item.name}</span>
                {item.chat_count !== undefined && item.chat_count > 0 && (
                  <span className="text-xs text-silver/50">{item.chat_count}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
