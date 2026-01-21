// Server Component - renders Journal with nested pages (Notion-style)
import { JournalContent } from '@/components/journal/journal-content'

export const dynamic = 'force-dynamic'

interface JournalPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  // Get page ID from URL params if provided
  const params = await searchParams
  const initialPageId = params.page || null
  
  return <JournalContent initialPageId={initialPageId} />
}
