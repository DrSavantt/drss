"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { TopNav } from "./top-nav"
import { CommandPalette } from "@/components/command-palette"

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
  const [commandOpen, setCommandOpen] = useState(false)

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopNav user={user} onSearchClick={() => setCommandOpen(true)} />
      
      {/* Main Content Area - Centered with max width */}
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}

