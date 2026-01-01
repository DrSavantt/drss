'use client'

import { AppShell } from '@/components/layout/app-shell'
import { PerfMonitor } from '@/components/perf-monitor'
import { ErrorBoundary } from '@/components/error-boundary'
import { SidebarProvider } from '@/contexts/sidebar-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {/* Unified Responsive Layout */}
      <ErrorBoundary>
        <AppShell>{children}</AppShell>
      </ErrorBoundary>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
    </SidebarProvider>
  )
}
