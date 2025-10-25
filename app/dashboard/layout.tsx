'use client'

import { logout } from '@/app/actions/auth'
import { SearchBar } from '@/components/search-bar'
import { useDeviceType } from '@/lib/utils/device'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const deviceType = useDeviceType()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const isMobile = deviceType === 'mobile'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between px-4 h-14">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard">
              <h1 className="text-lg font-bold text-gray-900">DRSS</h1>
            </Link>
            <div className="w-10" />
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-8 h-12">
              <Link href="/dashboard" className="flex-shrink-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900">DRSS</h1>
              </Link>

              <nav className="flex gap-4 sm:gap-8">
                <Link 
                  href="/dashboard" 
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/clients" 
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clients
                </Link>
                <Link 
                  href="/dashboard/projects/board" 
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Projects
                </Link>
                <Link 
                  href="/dashboard/content" 
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Content
                </Link>
                <Link 
                  href="/dashboard/journal" 
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Journal
                </Link>
              </nav>

              <div className="hidden lg:block flex-1 max-w-sm mx-4">
                <SearchBar />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">{userEmail}</span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-xs font-medium bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">DRSS Menu</h2>
            </div>
            <nav className="flex flex-col p-4 space-y-2">
              <Link 
                href="/dashboard" 
                className="text-base font-medium text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/clients" 
                className="text-base font-medium text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Clients
              </Link>
              <Link 
                href="/dashboard/projects/board" 
                className="text-base font-medium text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/content" 
                className="text-base font-medium text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Content
              </Link>
              <Link 
                href="/dashboard/journal" 
                className="text-base font-medium text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Journal
              </Link>
              <div className="pt-4 border-t border-gray-200 mt-4">
                <p className="text-sm text-gray-500 px-4 mb-2">{userEmail}</p>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full text-left text-base font-medium text-red-600 hover:bg-red-50 px-4 py-3 rounded-md"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className={isMobile ? 'pt-14 px-4 py-6' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>
    </div>
  )
}
