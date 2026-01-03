/**
 * Supabase Query Helpers
 * 
 * This file is kept for documentation and potential future use.
 * 
 * CACHING STRATEGY:
 * 
 * For production performance, we use Next.js ISR (Incremental Static Regeneration)
 * at the page level instead of `unstable_cache`:
 * 
 * 1. Add `export const revalidate = 60` to page.tsx files
 * 2. Use Suspense boundaries for streaming
 * 3. Fetch data in async Server Components
 * 
 * This approach:
 * - Works with Supabase auth (cookies)
 * - Provides caching at the page level
 * - Revalidates in background after cache expires
 * - Shows loading UI immediately via Suspense
 * 
 * WHY NOT unstable_cache?
 * - unstable_cache cannot access cookies (needed for Supabase auth)
 * - Page-level revalidation is simpler and more reliable
 * - ISR is the recommended Next.js pattern for Server Components
 * 
 * EXAMPLE PAGE:
 * ```tsx
 * // app/dashboard/clients/page.tsx
 * import { Suspense } from 'react'
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export const revalidate = 60  // Cache for 60 seconds
 * 
 * async function DataLoader() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('clients').select('*')
 *   return <ClientsContent data={data} />
 * }
 * 
 * export default function Page() {
 *   return (
 *     <Suspense fallback={<Skeleton />}>
 *       <DataLoader />
 *     </Suspense>
 *   )
 * }
 * ```
 * 
 * REVALIDATION TIMES:
 * - Dashboard: 60s (balance of freshness and performance)
 * - Client list: 60s
 * - Client detail: 30s (more interactive, needs fresher data)
 * - Content: 60s
 * - Analytics: 120s (less frequently changing)
 * - Questionnaire config: Static (rarely changes)
 */

// Export empty object to make this a valid module
export {}
