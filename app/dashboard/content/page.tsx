import { getAllContentAssets } from '@/app/actions/content'
import { ContentLibraryClient } from './content-library-client'

export default async function ContentLibraryPage() {
  const content = await getAllContentAssets()

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] bg-clip-text text-transparent">Content Library</h1>
          <p className="text-gray-400">
            All content across all clients
          </p>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="bg-[#1a1f2e] border-2 border-dashed border-gray-700/50 rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold text-white">No content yet</h3>
          <p className="mt-2 text-sm text-gray-400">
            Create content from a client&apos;s page to get started.
          </p>
        </div>
      ) : (
        <ContentLibraryClient initialContent={content} />
      )}
    </div>
  )
}
