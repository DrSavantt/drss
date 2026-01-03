// NO 'use client' - This is a Server Component
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

/**
 * DashboardLayout - Server Component
 * 
 * Benefits of Server Component architecture:
 * 1. User data fetched on server (faster initial render)
 * 2. Reduced JavaScript bundle sent to browser
 * 3. HTML rendered on server (better SEO, faster FCP)
 * 4. Enables streaming/Suspense for child pages
 * 
 * All interactive parts (sidebar state, command palette, etc.)
 * are encapsulated in the DashboardShell client component.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Handle missing Supabase config gracefully
  if (!supabase) {
    redirect('/login?error=config')
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  // Note: Middleware also handles this, but we double-check here
  // to ensure user data is available for the shell
  if (error || !user) {
    redirect('/login')
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
