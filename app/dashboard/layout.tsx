import { logout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DRSS</h1>
              <p className="text-sm text-gray-600">Marketing Agency OS</p>
            </div>
            <nav className="flex gap-6">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/clients" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clients
              </Link>
              <Link 
                href="/dashboard/projects/board" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/content" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Content
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
