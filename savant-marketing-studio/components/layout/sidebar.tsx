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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/sidebar-context"
import { CommandPalette } from "@/components/command-palette"

// Reordered to follow marketer workflow
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

const bottomNavItems = [{ href: "/dashboard/settings", label: "Settings", icon: Settings }]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed } = useSidebar()
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
    <>
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r border-sidebar-border bg-sidebar",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
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
            >
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </Link>
          )}
        </div>

        {/* Search - Opens Command Palette */}
        {!collapsed && (
          <div className="p-4">
            <button 
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-red-500/10 text-red-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors duration-150", isActive && "text-red-500")} />
                {!collapsed && (
                  <span className="transition-opacity duration-150">
                    {item.label}
                  </span>
                )}
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-red-500/10 text-red-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors duration-150", isActive && "text-red-500")} />
                {!collapsed && (
                  <span className="transition-opacity duration-150">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-3">
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
