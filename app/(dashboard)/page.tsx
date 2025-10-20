import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p className="mt-2 text-gray-600">
          You&apos;re logged in as {user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Phase 0</h3>
          <p className="mt-2 text-sm text-gray-600">
            Foundation complete. Authentication working!
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Next Up</h3>
          <p className="mt-2 text-sm text-gray-600">
            Phase 1: Client management and kanban boards
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Database</h3>
          <p className="mt-2 text-sm text-gray-600">
            10 tables ready with RLS enabled
          </p>
        </div>
      </div>
    </div>
  )
}

