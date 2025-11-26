import { getContentAsset } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import { ContentDetailClient } from './content-detail-client'
import Link from 'next/link'

export default async function ContentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const content = await getContentAsset(params.id)

  if (!content) {
    notFound()
  }

  // If it's a file (not a note), show download page instead
  if (content.file_url) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/dashboard/clients/${content.client_id}`}
            className="text-sm text-red-primary hover:text-red-bright no-underline"
          >
            ← Back to {content.clients?.name || 'Client'}
          </Link>
        </div>
        
        <div className="bg-card rounded-lg border border-mid-gray p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {content.title}
          </h1>
          <p className="text-silver mb-6">
            This is a file. Click below to download.
          </p>
          
          <a
            href={content.file_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-success px-6 py-3 text-sm font-semibold text-foreground hover:bg-success/90 transition-colors"
          >
            Download File ↓
          </a>
          
          {content.file_size && (
            <p className="mt-4 text-sm text-slate">
              Size: {(content.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      </div>
    )
  }

  return <ContentDetailClient content={content} />
}
