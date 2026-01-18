'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquare, 
  BookMarked,
  Menu,
  Users,
  Search,
  BookOpen,
  FileText,
  BarChart3,
  Archive,
  Settings,
  LogOut,
} from 'lucide-react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'

// Primary navigation items for bottom bar (most frequently used)
const primaryNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/projects/board', icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard/ai/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/dashboard/journal', icon: BookMarked, label: 'Journal' },
]

// Items that appear in the "More" sheet menu
const moreNavItems = [
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/research', icon: Search, label: 'Deep Research' },
  { href: '/dashboard/frameworks', icon: BookOpen, label: 'Frameworks' },
  { href: '/dashboard/content', icon: FileText, label: 'Content' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/archive', icon: Archive, label: 'Archive' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Check if a route is active (exact match or starts with for nested routes)
  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Auto-close sheet on navigation
  const handleNavClick = () => {
    setSheetOpen(false)
  }

  const handleLogout = async () => {
    setSheetOpen(false)
    await logout()
  }

  // Check if any "more" item is active (to highlight the More button)
  const isMoreActive = moreNavItems.some(item => isRouteActive(item.href))

  return (
    <>
      {/* Bottom Navigation Bar - visible only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border pb-safe-bottom">
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => {
            const isActive = isRouteActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] min-h-[44px]",
                  "transition-colors touch-action-manipulation",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Menu Button - Opens Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] min-h-[44px]",
                  "transition-colors touch-action-manipulation",
                  isMoreActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <Menu className={cn("h-5 w-5", isMoreActive && "text-primary")} />
                <span className="text-xs font-medium">More</span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="pb-safe-bottom rounded-t-2xl">
              <SheetHeader className="pb-2">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              
              <nav className="grid gap-1 py-2">
                {moreNavItems.map((item) => {
                  const isActive = isRouteActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                        "transition-colors min-h-[44px] touch-action-manipulation",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground active:bg-muted"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                      {item.label}
                    </Link>
                  )
                })}
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive active:bg-destructive/10 min-h-[44px] touch-action-manipulation mt-2 border-t border-border pt-4"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Log out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden pb-safe-bottom" aria-hidden="true" />
    </>
  )
}
