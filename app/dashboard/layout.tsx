import { logout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 h-12">
            {/* Logo */}
            <Link href="/dashboard" className="flex-shrink-0">
              <h1 className="text-lg font-semibold text-gray-900">DRSS</h1>
            </Link>

            {/* Navigation */}
            <nav className="flex gap-8">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/clients" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clients
              </Link>
              <Link 
                href="/dashboard/projects/board" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/content" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Content
              </Link>
            </nav>

            {/* Search Bar - compact and centered */}
            <div className="flex-1 max-w-sm mx-4">
              <SearchBar />
            </div>

            {/* User Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
