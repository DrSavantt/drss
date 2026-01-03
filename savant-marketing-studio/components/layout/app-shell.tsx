"use client"

import type React from "react"
import { TopNav } from "./top-nav"

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface AppShellProps {
  user?: User | null
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav user={user} />
      
      {/* Main Content Area - Full Width */}
      <main className="min-h-[calc(100vh-4rem)] p-6">
        {children}
      </main>
    </div>
  )
}

