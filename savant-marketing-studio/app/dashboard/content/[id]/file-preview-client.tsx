'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Loader2,
  Calendar,
  User,
  Folder,
  FileIcon,
  HardDrive,
  ExternalLink,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { deleteContentAsset } from '@/app/actions/content'
import { ResponsiveFilePreview } from '@/components/responsive-file-preview'

// ============================================================================
// FULL FILE PREVIEW - View and download uploaded files
// ============================================================================

interface FilePreviewClientProps {
  content: {
    id: string
    title: string
    asset_type: string
    file_url: string
    file_type?: string
    file_size?: number
    client_id: string
    project_id?: string | null
    created_at: string
    updated_at: string
    clients?: { id: string; name: string } | null
    projects?: { id: string; name: string } | null
  }
}

export function FilePreviewClient({ content }: FilePreviewClientProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  const handleDownload = () => {
    if (content.file_url) {
      // Create a link and trigger download
      const link = document.createElement('a')
      link.href = content.file_url
      link.download = content.title
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getFileTypeDisplay = () => {
    if (content.file_type) {
      if (content.file_type.includes('pdf')) return 'PDF Document'
      if (content.file_type.includes('image')) return 'Image'
      if (content.file_type.includes('word') || content.file_type.includes('document')) return 'Word Document'
      if (content.file_type.includes('excel') || content.file_type.includes('spreadsheet')) return 'Spreadsheet'
      if (content.file_type.includes('powerpoint') || content.file_type.includes('presentation')) return 'PowerPoint'
      return content.file_type
    }
    return content.asset_type?.replace('_', ' ') || 'File'
  }

  const getFileIcon = () => {
    if (content.file_type?.includes('image')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />
    }
    if (content.file_type?.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />
    }
    return <FileIcon className="h-6 w-6 text-muted-foreground" />
  }

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
                <span className="text-foreground">File Preview</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Download Button */}
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {/* Open in New Tab */}
              <Button 
                variant="outline" 
                onClick={() => window.open(content.file_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
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
          {/* Preview Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <h1 className="text-2xl font-bold">{content.title}</h1>
            </div>

            {/* Type Badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <FileIcon className="h-3 w-3 mr-1" />
                {getFileTypeDisplay()}
              </Badge>
              <Badge variant="secondary">
                <HardDrive className="h-3 w-3 mr-1" />
                {formatFileSize(content.file_size)}
              </Badge>
            </div>

            {/* File Preview - Uses ResponsiveFilePreview for full format support */}
            <ResponsiveFilePreview
              fileUrl={content.file_url}
              fileName={content.title}
              fileType={content.file_type || null}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Metadata Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">File Details</CardTitle>
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

                {/* File Size */}
                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Size</p>
                    <p className="font-medium">{formatFileSize(content.file_size)}</p>
                  </div>
                </div>

                {/* File Type */}
                <div className="flex items-start gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-medium">{getFileTypeDisplay()}</p>
                  </div>
                </div>

                {/* Uploaded */}
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Uploaded</p>
                    <p className="font-medium">{format(new Date(content.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(content.created_at), 'h:mm a')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.open(content.file_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete File
                </Button>
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
              <CardTitle>Delete File?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete <strong>"{content.title}"</strong>? This file will be permanently removed.
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
