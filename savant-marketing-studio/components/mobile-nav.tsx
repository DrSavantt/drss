'use client'

import { create } from 'zustand'
import { 
  Menu, 
  X, 
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  BookOpen,
  Sparkles,
  BookMarked,
  Settings,
  Search,
  Archive,
  BarChart3,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/components/command-palette'

interface MobileNavProps {
  userEmail: string | null
}

// Zustand store - guarantees state works across re-renders
const useMobileMenuStore = create<{
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))

// SAME nav items as desktop sidebar (not mobile-specific order)
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

export function MobileNav({ userEmail }: MobileNavProps) {
  const { isOpen, close, toggle } = useMobileMenuStore()
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  // Load theme
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('drss-theme') as 'dark' | 'light' | null
    if (savedTheme) setTheme(savedTheme)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('drss-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  // Auto-close on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, close])

  // Command palette shortcut
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
      {/* Fixed Mobile Header - Respects iOS Safe Area */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border z-50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(4rem + env(safe-area-inset-top))'
        }}
      >
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo on left */}
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <span className="font-semibold text-foreground">DRSS</span>
          </Link>

          {/* Utilities on right */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Hamburger Menu */}
            <button
              onClick={toggle}
              className="p-2 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop - Blurred overlay */}
      <div
        onClick={close}
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ease-out",
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ willChange: 'opacity' }}
      />

      {/* SIDEBAR DRAWER - Slides from LEFT (EXACTLY like desktop sidebar) */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-[101] h-screen w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out",
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ willChange: 'transform' }}
      >
        <div className="flex h-full flex-col">
          {/* Logo - SAME as desktop */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={close}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">D</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">DRSS Studio</span>
            </Link>
          </div>

          {/* Search - SAME as desktop */}
          <div className="p-4">
            <button 
              onClick={() => {
                setCommandOpen(true)
                close()
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-sidebar-foreground cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
            </button>
          </div>

          {/* Main Nav - SAME as desktop */}
          <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-red-500/10 text-red-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0 transition-colors duration-150", isActive && "text-red-500")} />
                  <span className="transition-opacity duration-150">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Nav - SAME as desktop */}
          <div className="border-t border-sidebar-border px-3 py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-red-500/10 text-red-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0 transition-colors duration-150", isActive && "text-red-500")} />
                  <span className="transition-opacity duration-150">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* User info & Logout - At bottom */}
          {userEmail && (
            <div className="border-t border-sidebar-border p-3">
              <div className="mb-2 px-2">
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
