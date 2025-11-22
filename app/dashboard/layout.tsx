'use client'

import { motion } from 'framer-motion'
import { logout } from '@/app/actions/auth'
import { SearchBar } from '@/components/search-bar'
import { MobileNav } from '@/components/mobile-nav'
import { PerfMonitor } from '@/components/perf-monitor'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)

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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Mobile Navigation */}
      <MobileNav userEmail={userEmail} />

      {/* Desktop Header */}
      <header className="hidden lg:block" style={{ background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8 h-14">
            <Link href="/dashboard" className="flex-shrink-0">
              <motion.h1 
                className="text-lg font-bold text-coral"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                DRSS
              </motion.h1>
            </Link>

            <nav className="flex gap-6">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/clients" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/dashboard/projects/list"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/content" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Content
              </Link>
              <Link 
                href="/dashboard/journal" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Journal
              </Link>
            </nav>

            <div className="hidden xl:block flex-1 max-w-sm mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              {userEmail && (
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{userEmail}</span>
              )}
              <ThemeToggle />
              <form action={logout}>
                <motion.button
                  type="submit"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    border: '1px solid var(--card-border)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Instant page loads - no blocking transitions */}
      <main className="pt-16 lg:pt-0 px-4 lg:px-0 py-6 lg:py-8 transition-opacity duration-150">
        <div className="max-w-7xl mx-auto lg:px-4">
          {children}
        </div>
      </main>
      
      {/* Performance monitor for development */}
      <PerfMonitor />
    </div>
  )
}
