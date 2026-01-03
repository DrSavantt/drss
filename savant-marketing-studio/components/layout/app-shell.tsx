"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

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
  const { collapsed } = useSidebar()
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "pl-16" : "pl-64"
      )}>
        <TopNav user={user} />
        
        <main className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

