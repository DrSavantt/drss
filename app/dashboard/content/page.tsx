import { getAllContentAssets } from '@/app/actions/content'
import { ContentLibraryClient } from './content-library-client'

export default async function ContentLibraryPage() {
  const content = await getAllContentAssets()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="mt-2 text-gray-600">
            All content across all clients
          </p>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No content yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create content from a client's page to get started.
          </p>
        </div>
      ) : (
        <ContentLibraryClient initialContent={content} />
      )}
    </div>
  )
}
