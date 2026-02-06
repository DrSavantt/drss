'use client'

import { AppShell } from '@/components/layout/app-shell'
import { ErrorBoundary } from '@/components/error-boundary'
import { PerfMonitor } from '@/components/perf-monitor'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { QuickCaptureProvider } from '@/components/providers/quick-capture-provider'

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
 * - ErrorBoundary (error handling)
 * - AppShell (layout with TopNav and hamburger menu)
 * - PerfMonitor (dev-only FPS counter)
 * 
 * The parent Server Component (layout.tsx) handles:
 * - Authentication check
 * - User data fetching
 * - Redirect logic
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <QuickCaptureProvider>
          <AppShell user={user}>
            {children}
          </AppShell>
        </QuickCaptureProvider>
      </SidebarProvider>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
      
      {/* PWA install prompt */}
      <InstallPrompt />
    </ErrorBoundary>
  )
}

