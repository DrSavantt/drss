'use client'

import { logout } from '@/app/actions/auth'
import { SearchBar } from '@/components/search-bar'
import { MobileNav } from '@/components/mobile-nav'
import { PerfMonitor } from '@/components/perf-monitor'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from '@/components/command-palette'
import { InstallPrompt } from '@/components/install-prompt'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const pathname = usePathname()

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
    <div className="min-h-screen bg-background">
      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Mobile Navigation */}
      <MobileNav userEmail={userEmail} />

      {/* Desktop Header */}
      <header className="hidden lg:block bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8 h-14">
            <Link href="/dashboard" className="flex-shrink-0">
              <h1 className="text-lg font-bold text-red-primary">
                DRSS
              </h1>
            </Link>

            <nav className="flex gap-6">
              <Link 
                href="/dashboard" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname === '/dashboard'
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/analytics" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname.startsWith('/dashboard/analytics')
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Analytics
              </Link>
              <Link 
                href="/dashboard/clients" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname.startsWith('/dashboard/clients')
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Clients
              </Link>
              <Link 
                href="/dashboard/projects/board" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname.startsWith('/dashboard/projects')
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/content" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname.startsWith('/dashboard/content')
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Content
              </Link>
              <Link 
                href="/dashboard/journal" 
                className={`
                  text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-lg
                  ${pathname.startsWith('/dashboard/journal')
                    ? 'text-red-primary bg-red-primary/10 font-semibold'
                    : 'text-silver hover:text-foreground hover:bg-surface-highlight'
                  }
                `}
              >
                Journal
              </Link>
            </nav>

            <div className="hidden xl:block flex-1 max-w-sm mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              {userEmail && (
                <span className="text-sm text-silver">{userEmail}</span>
              )}
              <ThemeToggle />
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm font-medium bg-secondary text-silver px-4 py-2 rounded-lg hover:bg-dark-gray hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Instant page loads - no transitions */}
      <main className="pt-16 lg:pt-0 px-4 lg:px-0 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto lg:px-4">
          {children}
        </div>
      </main>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
    </div>
  )
}
