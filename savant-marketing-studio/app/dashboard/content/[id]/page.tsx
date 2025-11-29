import { getContentAsset } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import { ContentDetailClient } from './content-detail-client'
import { FilePreviewClient } from './file-preview-client'

export default async function ContentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const content = await getContentAsset(params.id)

  if (!content) {
    notFound()
  }

  // If it's a file (not a note), show file preview page
  if (content.file_url) {
    return <FilePreviewClient content={content} />
  }

  return <ContentDetailClient content={content} />
}
