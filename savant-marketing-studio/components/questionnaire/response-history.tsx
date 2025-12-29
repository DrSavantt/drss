'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { Clock, FileText, CheckCircle2, Edit3, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ResponseVersion {
  id: string
  version: number
  status: 'draft' | 'submitted'
  response_data?: Record<string, any>  // Optional - only needed when viewing full response
  submitted_at: string | null
  submitted_by: 'client' | 'admin' | null
  created_at: string
  updated_at: string
  is_latest: boolean
}

interface ResponseHistoryProps {
  versions: ResponseVersion[]
  currentVersionId?: string
  onViewVersion: (version: ResponseVersion) => void
  className?: string
}

export function ResponseHistory({ 
  versions, 
  currentVersionId,
  onViewVersion,
  className 
}: ResponseHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No response history yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Version History</h3>
      
      <div className="space-y-2">
        {versions.map((version) => {
          const isCurrentView = version.id === currentVersionId
          const isLatest = version.is_latest
          const isDraft = version.status === 'draft'

          return (
            <div
              key={version.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                isCurrentView 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Version badge */}
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium',
                  isDraft 
                    ? 'bg-yellow-500/10 text-yellow-500' 
                    : 'bg-green-500/10 text-green-500'
                )}>
                  v{version.version}
                </div>

                <div>
                  {/* Status and date */}
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <span className="text-sm font-medium text-yellow-500 flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        Draft
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Submitted
                      </span>
                    )}
                    {isLatest && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {version.submitted_at 
                      ? format(new Date(version.submitted_at), 'MMM d, yyyy h:mm a')
                      : format(new Date(version.updated_at), 'MMM d, yyyy h:mm a')
                    }
                    <span className="text-muted-foreground/60">
                      ({formatDistanceToNow(new Date(version.updated_at), { addSuffix: true })})
                    </span>
                  </div>

                  {/* Submitted by */}
                  {version.submitted_by && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      by {version.submitted_by === 'admin' ? 'Admin' : 'Client'}
                    </div>
                  )}
                </div>
              </div>

              {/* View button */}
              <button
                onClick={() => onViewVersion(version)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                  isCurrentView
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                )}
              >
                <Eye className="h-3 w-3" />
                {isCurrentView ? 'Viewing' : 'View'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

