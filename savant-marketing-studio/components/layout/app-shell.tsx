"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { TopNav } from "./top-nav"
import { BottomNav } from "./bottom-nav"
import { CommandPalette } from "@/components/command-palette"
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

// Routes that need full-bleed layout (no padding, fixed height)
const fullBleedRoutes = ["/dashboard/ai/chat"]

export function AppShell({ user, children }: AppShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const pathname = usePathname()
  const isFullBleed = fullBleedRoutes.includes(pathname)

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
    <div className={cn(
      "bg-background pt-safe-top flex flex-col",
      isFullBleed ? "h-screen-dvh overflow-hidden" : "min-h-screen-dvh"
    )}>
      <TopNav user={user} onSearchClick={() => setCommandOpen(true)} />
      
      {/* Main Content Area */}
      <main className={cn(
        "flex-1",
        isFullBleed 
          ? "overflow-hidden" 
          : "min-h-0"
      )}>
        {isFullBleed ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
