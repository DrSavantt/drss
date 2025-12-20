import { getAllContentAssets } from '@/app/actions/content'
import { ContentLibraryClient } from './content-library-client'
import { ContentLibraryPageClient } from './content-library-page-client'

export default async function ContentLibraryPage() {
  const content = await getAllContentAssets()

  return (
    <ContentLibraryPageClient initialContent={content} />
  )
}
