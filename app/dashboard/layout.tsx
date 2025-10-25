'use client'

import { logout } from '@/app/actions/auth'
import { SearchBar } from '@/components/search-bar'
import { MobileNav } from '@/components/mobile-nav'
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
    <div className="min-h-screen bg-black">
      {/* Mobile Navigation */}
      <MobileNav userEmail={userEmail} />

      {/* Desktop Header */}
      <header className="hidden lg:block bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8 h-14">
            <Link href="/dashboard" className="flex-shrink-0">
              <h1 className="text-lg font-bold text-coral">DRSS</h1>
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
                href="/dashboard/projects/board" 
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
                <span className="text-sm text-gray-400">{userEmail}</span>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm font-medium bg-gray-900 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 lg:pt-0 px-4 lg:px-0 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto lg:px-4">
          {children}
        </div>
      </main>
    </div>
  )
}
