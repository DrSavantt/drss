import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  try {
    const supabase = await createClient()
    
    // Get the URL from env to show it's loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Simple auth check - this always works
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // If we got here without throwing, connection works!
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-600">
          ✅ Supabase Connected!
        </h1>
        
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold text-green-900">Connection Status</p>
            <p className="text-sm text-green-700 mt-1">
              Successfully initialized Supabase client
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="font-semibold text-gray-900">Environment Variables</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-mono text-gray-600">SUPABASE_URL:</span>{' '}
                <span className="text-gray-900">{supabaseUrl}</span>
              </p>
              <p>
                <span className="font-mono text-gray-600">SUPABASE_ANON_KEY:</span>{' '}
                <span className="text-gray-900">
                  {hasAnonKey ? '✅ Set (hidden for security)' : '❌ Missing'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="font-semibold text-blue-900">Auth Status</p>
            <p className="text-sm text-blue-700 mt-1">
              {session ? 'User logged in' : 'No user authenticated (expected for test)'}
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-semibold text-yellow-900">Next Step</p>
            <p className="text-sm text-yellow-700 mt-1">
              Ready for Feature 0.3 - Create Database Schema
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">❌ Connection Error</h1>
        <p className="mt-2">Failed to initialize Supabase client</p>
        <pre className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }
}