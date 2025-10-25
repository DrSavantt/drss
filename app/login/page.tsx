'use client'

import { autoLogin } from '@/app/actions/auth'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    
    try {
      const result = await autoLogin()
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // If no error, redirect is happening (don't set loading to false)
    } catch (err) {
      // Handle NEXT_REDIRECT which is expected behavior
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        // This is normal - redirect is happening, keep loading state
        return
      }
      
      if (err instanceof Error && err.message.includes('Missing Supabase environment variables')) {
        setError('Configuration error: Supabase is not properly set up. Please check your environment variables.')
      } else {
        setError('An unexpected error occurred: ' + (err instanceof Error ? err.message : String(err)))
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            DRSS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Marketing Agency Operating System
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Login to DRSS'
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Single-user application • Click to access your dashboard
        </p>
      </div>
    </div>
  )
}

