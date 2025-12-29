import { getContentAsset } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import { ContentDetailClient } from './content-detail-client'
import { FilePreviewClient } from './file-preview-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { id } = await params
  const content = await getContentAsset(id)

  if (!content) {
    notFound()
  }

  // If it has a file_url, it's an uploaded file - show preview
  if (content.file_url) {
    return <FilePreviewClient content={content} />
  }

  // Otherwise it's a note - show editor
  return <ContentDetailClient content={content} />
}

