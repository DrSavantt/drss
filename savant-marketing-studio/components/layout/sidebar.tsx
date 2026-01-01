"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  BookOpen,
  Sparkles,
  BookMarked,
  Settings,
  ChevronLeft,
  Search,
  Archive,
  BarChart3,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/sidebar-context"
import { CommandPalette } from "@/components/command-palette"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects/board", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/research", label: "Deep Research", icon: Search },
  { href: "/dashboard/frameworks", label: "Frameworks", icon: BookOpen },
  { href: "/dashboard/ai/generate", label: "AI Studio", icon: Sparkles },
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/journal", label: "Journal", icon: BookMarked },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/archive", label: "Archive", icon: Archive },
]

const bottomNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const [commandOpen, setCommandOpen] = useState(false)

  // Debug log
  useEffect(() => {
    console.log('[Sidebar] mobileOpen changed to:', mobileOpen)
  }, [mobileOpen])

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

  // Close drawer when route changes
  useEffect(() => {
    if (mobileOpen) {
      console.log('[Sidebar] Route changed, closing drawer')
      setMobileOpen(false)
    }
  }, [pathname, mobileOpen, setMobileOpen])

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        console.log('[Sidebar] Escape pressed, closing drawer')
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [mobileOpen, setMobileOpen])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[Sidebar] Backdrop clicked, closing drawer')
    setMobileOpen(false)
  }

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('[Sidebar] Close button clicked, closing drawer')
    setMobileOpen(false)
  }

  // Handle nav link click
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      console.log('[Sidebar] Nav link clicked on mobile, closing drawer')
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Backdrop - mobile only */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-sidebar-border bg-sidebar",
          "w-64 transition-transform duration-300 ease-out",
          // Mobile default: HIDDEN (off-screen to the left)
          "-translate-x-full",
          // Mobile when open: visible
          mobileOpen && "translate-x-0",
          // Desktop: ALWAYS visible (override mobile hidden)
          "lg:!translate-x-0",
          // Desktop: width based on collapsed
          collapsed ? "lg:w-16" : "lg:w-64",
          "lg:transition-[width] lg:duration-200"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo + Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">D</span>
                </div>
                <span className="font-semibold text-sidebar-foreground">DRSS Studio</span>
              </Link>
            )}
            {collapsed && (
              <Link 
                href="/dashboard" 
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
                onClick={handleNavClick}
              >
                <span className="text-sm font-bold text-primary-foreground">D</span>
              </Link>
            )}
            
            {/* Close button - mobile only */}
            <button
              type="button"
              onClick={handleCloseClick}
              className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="p-4">
              <button 
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-sidebar-foreground cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
              </button>
            </div>
          )}

          {/* Main Nav */}
          <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-red-500/10 text-red-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-red-500")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Nav */}
          <div className="border-t border-sidebar-border px-3 py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-red-500/10 text-red-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-red-500")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>

          {/* Collapse Toggle - Desktop only */}
          <div className="hidden lg:block border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="w-full justify-center text-muted-foreground hover:text-sidebar-foreground"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
