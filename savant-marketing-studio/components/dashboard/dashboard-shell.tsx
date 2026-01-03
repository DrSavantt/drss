'use client'

import { SidebarProvider } from '@/contexts/sidebar-context'
import { AppShell } from '@/components/layout/app-shell'
import { ErrorBoundary } from '@/components/error-boundary'
import { PerfMonitor } from '@/components/perf-monitor'

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface DashboardShellProps {
  user: User | null
  children: React.ReactNode
}

/**
 * DashboardShell - Client Component wrapper for the dashboard
 * 
 * This component encapsulates all client-side functionality:
 * - SidebarProvider (sidebar collapse state)
 * - ErrorBoundary (error handling)
 * - AppShell (layout with Sidebar + TopNav)
 * - PerfMonitor (dev-only FPS counter)
 * 
 * The parent Server Component (layout.tsx) handles:
 * - Authentication check
 * - User data fetching
 * - Redirect logic
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <ErrorBoundary>
        <AppShell user={user}>
          {children}
        </AppShell>
      </ErrorBoundary>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
    </SidebarProvider>
  )
}

