'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  BookOpen,
  MessageSquare,
  BookMarked,
  Search,
  BarChart3,
  Archive,
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'

// Same navigation structure as the old sidebar
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/projects/board', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/research', label: 'Deep Research', icon: Search },
  { href: '/dashboard/frameworks', label: 'Frameworks', icon: BookOpen },
  { href: '/dashboard/ai/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dashboard/content', label: 'Content', icon: FileText },
  { href: '/dashboard/journal', label: 'Journal', icon: BookMarked },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/archive', label: 'Archive', icon: Archive },
]

const bottomItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface MobileNavProps {
  onSearchClick?: () => void
}

export function MobileNav({ onSearchClick }: MobileNavProps = {}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    setOpen(false)
    await logout()
  }

  const handleSearchClick = () => {
    setOpen(false)
    onSearchClick?.()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left font-bold text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            DRSS Studio
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col h-[calc(100%-73px)]">
          {/* Search Button */}
          <div className="p-4 border-b">
            <button 
              onClick={handleSearchClick}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground cursor-pointer"
            >
              <Search className="h-5 w-5 shrink-0" />
              <span>Search...</span>
              <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
            </button>
          </div>

          <div className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive 
                      ? "bg-red-500/10 text-red-500" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-red-500")} />
                  {item.label}
                </Link>
              )
            })}
          </div>
          
          <div className="border-t py-4 px-2 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive 
                      ? "bg-red-500/10 text-red-500" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-red-500")} />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150 w-full"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

