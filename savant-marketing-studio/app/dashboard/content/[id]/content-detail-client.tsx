'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2,
  Calendar,
  User,
  Folder,
  FileText,
  Check,
  X,
  Pencil,
  ArrowRight,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { updateContentAsset, deleteContentAsset } from '@/app/actions/content'
import { cn } from '@/lib/utils'
import { TiptapEditor } from '@/components/tiptap-editor'

// ============================================================================
// FULL CONTENT DETAIL - View and edit notes with TipTap
// ============================================================================

interface ContentDetailClientProps {
  content: {
    id: string
    title: string
    asset_type: string
    content_json: any
    client_id: string
    project_id?: string | null
    created_at: string
    updated_at: string
    clients?: { id: string; name: string } | null
    projects?: { id: string; name: string } | null
    related_captures?: Array<{
      id: string
      content: string
      created_at: string
    }>
  }
}

export function ContentDetailClient({ content }: ContentDetailClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(content.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editorContent, setEditorContent] = useState(content.content_json || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Track changes
  useEffect(() => {
    const titleChanged = title !== content.title
    const contentChanged = JSON.stringify(editorContent) !== JSON.stringify(content.content_json)
    setHasChanges(titleChanged || contentChanged)
  }, [title, editorContent, content.title, content.content_json])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content_json', typeof editorContent === 'string' ? editorContent : JSON.stringify(editorContent))
      
      const result = await updateContentAsset(content.id, formData)
      
      if (result?.error) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        setHasChanges(false)
        
        // Reset saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteContentAsset(content.id, content.client_id, 'all', content.title)
      router.push(`/dashboard/clients/${content.client_id}`)
    } catch (error) {
      console.error('Failed to delete:', error)
      setIsDeleting(false)
    }
  }

  const handleTitleSave = () => {
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setTitle(content.title)
    setIsEditingTitle(false)
  }

  // Auto-save on Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, handleSave])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button & Breadcrumb */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {content.clients && (
                  <>
                    <Link 
                      href={`/dashboard/clients/${content.client_id}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {content.clients.name}
                    </Link>
                    <span>/</span>
                  </>
                )}
                <span className="text-foreground">Content</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Save Status Indicator */}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-500 flex items-center gap-1 mr-2">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-destructive mr-2">
                  Save failed
                </span>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={cn(
                  hasChanges && "bg-primary hover:bg-primary/90"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {hasChanges ? 'Save Changes' : 'Saved'}
                  </>
                )}
              </Button>

              {/* Delete Button */}
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Title */}
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold h-12"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave()
                      if (e.key === 'Escape') handleTitleCancel()
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleTitleSave}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleTitleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button 
                  className="flex items-center gap-2 group flex-1"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <h1 className="text-2xl font-bold text-left">{title}</h1>
                  <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Type Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                {content.asset_type?.replace('_', ' ') || 'Note'}
              </Badge>
            </div>

            {/* TipTap Editor */}
            <Card className="min-h-[500px]">
              <CardContent className="p-6">
                <TiptapEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  editable={true}
                />
              </CardContent>
            </Card>

            {/* Keyboard Shortcut Hint */}
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">⌘S</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded border">Ctrl+S</kbd> to save
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Metadata Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {/* Client */}
                {content.clients && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <Link 
                        href={`/dashboard/clients/${content.client_id}`}
                        className="hover:underline font-medium"
                      >
                        {content.clients.name}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Project */}
                {content.projects && (
                  <div className="flex items-start gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Project</p>
                      <p className="font-medium">{content.projects.name}</p>
                    </div>
                  </div>
                )}

                {/* Created */}
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="font-medium">{format(new Date(content.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(content.created_at), 'h:mm a')}</p>
                  </div>
                </div>

                {/* Updated */}
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium">{format(new Date(content.updated_at), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(content.updated_at), 'h:mm a')}</p>
                  </div>
                </div>

                {/* Related Captures */}
                {content.related_captures && content.related_captures.length > 0 && (
                  <div className="flex items-start gap-2 pt-4 border-t border-border">
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Related Captures</p>
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {content.related_captures.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {content.related_captures.map((capture) => (
                          <Link
                            key={capture.id}
                            href={`/dashboard/journal?entry=${capture.id}`}
                            className="group flex items-start gap-1 hover:text-primary transition-colors p-2 -mx-2 rounded hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-snug line-clamp-2">
                                "{capture.content.substring(0, 80)}{capture.content.length > 80 ? '...' : ''}"
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(capture.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <ArrowRight className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Content?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete <strong>"{content.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
