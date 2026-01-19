'use client'

import { createFileAsset, getUploadUrl, getClientProjects } from '@/app/actions/content'
import { getAssetTypeFromMimeType } from '@/lib/content-types'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function NewFilePage() {
  const params = useParams()
  const clientId = params.id as string

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function loadProjects() {
      const data = await getClientProjects(clientId)
      setProjects(data)
    }
    loadProjects()
  }, [clientId])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50MB')
      return
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not supported. Please upload PDF, image, or Word document.')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Step 1: Get signed upload URL
      const urlResult = await getUploadUrl(file.name, clientId)
      
      if (urlResult.error || !urlResult.signedUrl) {
        setError(urlResult.error || 'Failed to get upload URL')
        setUploading(false)
        return
      }

      // Step 2: Upload file to Supabase Storage
      const uploadResponse = await fetch(urlResult.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        setError('Failed to upload file')
        setUploading(false)
        return
      }

      setUploadProgress(100)

      // Step 3: Construct public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/client-files/${urlResult.path}`

      // Step 4: Determine asset type based on file type
      const assetType = getAssetTypeFromMimeType(file.type)

      // Step 5: Save file metadata
      formData.append('file_url', publicUrl)
      formData.append('file_size', file.size.toString())
      formData.append('file_type', file.type)
      formData.append('asset_type', assetType)

      const result = await createFileAsset(clientId, formData)
      
      if (result?.error) {
        setError(result.error)
        setUploading(false)
      }
      // If successful, createFileAsset will redirect
    } catch (err) {
      console.error('Upload error:', err)
      setError('An unexpected error occurred')
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="text-sm text-red-primary hover:text-red-bright no-underline"
        >
          ← Back to Client
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Upload File</h1>
        <p className="mt-2 text-silver">
          Upload PDFs, images, or documents for this client
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-error/20 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-charcoal rounded-lg border border-mid-gray p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-silver">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              disabled={uploading}
              className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
              placeholder="Q4 Campaign Research"
            />
          </div>

          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-silver">
              Link to Project (Optional)
            </label>
            <select
              name="project_id"
              id="project_id"
              disabled={uploading}
              className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-silver mb-2">
              File *
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              className="block w-full text-sm text-silver file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-primary/20 file:text-red-primary hover:file:bg-red-primary/30 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-slate">
              Supported: PDF, JPG, PNG, GIF, DOC, DOCX (max 50MB)
            </p>
            {file && (
              <div className="mt-3 p-3 bg-dark-gray rounded-md">
                <p className="text-sm text-foreground">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
                <p className="text-xs text-slate mt-1">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {uploading && uploadProgress > 0 && (
            <div>
              <div className="w-full bg-dark-gray rounded-full h-2">
                <div
                  className="bg-red-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-silver mt-2 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading || !file}
            className="flex-1 rounded-md bg-red-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-bright disabled:bg-mid-gray disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex-1 text-center rounded-md bg-dark-gray px-4 py-2 text-sm font-semibold text-silver hover:bg-mid-gray no-underline transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
