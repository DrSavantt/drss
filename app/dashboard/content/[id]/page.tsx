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
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to {content.clients?.name || 'Client'}
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>
          <p className="text-gray-600 mb-6">
            This is a file. Click below to download.
          </p>
          
          <a
            href={content.file_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500"
          >
            Download File ↓
          </a>
          
          {content.file_size && (
            <p className="mt-4 text-sm text-gray-500">
              Size: {(content.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      </div>
    )
  }

  return <ContentDetailClient content={content} />
}

