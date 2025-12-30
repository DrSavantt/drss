'use client'

import { AppShell } from '@/components/layout/app-shell'
import { MobileNav } from '@/components/mobile-nav'
import { PerfMonitor } from '@/components/perf-monitor'
import { InstallPrompt } from '@/components/install-prompt'
import { ErrorBoundary } from '@/components/error-boundary'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user on client side
    async function getUser() {
      const response = await fetch('/api/user')
      const data = await response.json()
      setUserEmail(data.email)
    }
    getUser()
  }, [])

  return (
    <SidebarProvider>
      {/* Command Palette is now integrated in Sidebar component */}
      
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Mobile Navigation - Only shown on mobile */}
      <div className="lg:hidden">
        <MobileNav userEmail={userEmail} />
      </div>

      {/* Desktop Layout with new AppShell */}
      <div className="hidden lg:block">
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
      </div>

      {/* Mobile Layout - Direct rendering */}
      <div className="lg:hidden">
        <ErrorBoundary>
          <main className="min-h-screen p-4 pt-20">
            {children}
          </main>
        </ErrorBoundary>
      </div>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
    </SidebarProvider>
  )
}
