'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'

export interface DeleteOption {
  value: 'all' | 'preserve'
  label: string
  description: string
}

export interface RelatedCounts {
  projects?: number
  content?: number
  captures?: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  item: {
    type: 'client' | 'content' | 'project'
    name: string
  }
  relatedCounts?: RelatedCounts | null
  onConfirm: (deleteOption: 'all' | 'preserve') => Promise<void>
}

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  item, 
  relatedCounts,
  onConfirm 
}: Props) {
  const [deleteOption, setDeleteOption] = useState<'all' | 'preserve'>('preserve')
  const [loading, setLoading] = useState(false)
  
  if (!isOpen) return null
  
  const hasRelatedItems = relatedCounts && (
    (relatedCounts.projects ?? 0) > 0 || 
    (relatedCounts.content ?? 0) > 0 || 
    (relatedCounts.captures ?? 0) > 0
  )

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(deleteOption)
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-pure-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-charcoal border border-mid-gray rounded-2xl shadow-2xl">
        <div className="p-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground text-center mb-2">
            Delete {item.type}?
          </h2>
          
          <p className="text-sm text-silver/70 text-center mb-6">
            This will delete &ldquo;{item.name}&rdquo;. This action cannot be undone.
          </p>
          
          {/* Related items warning */}
          {hasRelatedItems && (
            <div className="bg-dark-gray border border-mid-gray/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="text-xs font-semibold text-foreground mb-2">Related Items:</div>
              {(relatedCounts?.projects ?? 0) > 0 && (
                <div className="text-xs text-silver/70">• {relatedCounts?.projects} project(s)</div>
              )}
              {(relatedCounts?.content ?? 0) > 0 && (
                <div className="text-xs text-silver/70">• {relatedCounts?.content} content piece(s)</div>
              )}
              {(relatedCounts?.captures ?? 0) > 0 && (
                <div className="text-xs text-silver/70">• {relatedCounts?.captures} journal capture(s)</div>
              )}
            </div>
          )}
          
          {/* Options - only show if there are related items */}
          {hasRelatedItems && (
            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                deleteOption === 'preserve' 
                  ? 'bg-charcoal border-red-primary/50' 
                  : 'bg-dark-gray hover:bg-charcoal border-mid-gray'
              }`}>
              <input
                type="radio"
                name="deleteOption"
                value="preserve"
                checked={deleteOption === 'preserve'}
                onChange={(e) => setDeleteOption(e.target.value as 'all' | 'preserve')}
                className="mt-0.5 accent-red-primary"
              />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Preserve Journal Captures</div>
                  <div className="text-xs text-silver/60">Delete {item.type} but keep associated journal entries</div>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                deleteOption === 'all' 
                  ? 'bg-charcoal border-red-primary/50' 
                  : 'bg-dark-gray hover:bg-charcoal border-mid-gray'
              }`}>
              <input
                type="radio"
                name="deleteOption"
                value="all"
                checked={deleteOption === 'all'}
                onChange={(e) => setDeleteOption(e.target.value as 'all' | 'preserve')}
                className="mt-0.5 accent-red-primary"
              />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Delete Everything</div>
                  <div className="text-xs text-silver/60">Delete {item.type} and all related items (projects, content, captures)</div>
                </div>
              </label>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-mid-gray hover:bg-charcoal rounded-lg text-sm font-medium text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-error hover:bg-red-dark text-foreground rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Deleting...' : `Delete ${deleteOption === 'all' && hasRelatedItems ? 'All' : item.type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

