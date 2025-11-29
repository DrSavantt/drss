import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function TestPage() {
  const supabase = await createClient();

  // Simple connection test - try to query Supabase auth status
  const { error: authError } = await supabase.auth.getUser();

  // Check if we can execute a simple query
  let connectionStatus = 'Unknown';
  let connectionError: string | null = null;

  try {
    // This will succeed even without tables if connection works
    const { error } = await supabase.from('_test').select('*').limit(1);

    if (error) {
      // Expected error if table doesn't exist, but connection works
      if (error.message.includes('relation') || error.code === '42P01') {
        connectionStatus = 'Connected';
      } else {
        connectionStatus = 'Error';
        connectionError = JSON.stringify(error, null, 2);
      }
    } else {
      connectionStatus = 'Connected';
    }
  } catch (e) {
    connectionStatus = 'Error';
    connectionError =
      e instanceof Error ? e.message : JSON.stringify(e, null, 2);
  }

  const isConnected = connectionStatus === 'Connected';

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div
          className={`p-6 rounded-lg border-2 ${
            isConnected
              ? 'border-green-500 bg-green-50 dark:bg-green-950'
              : 'border-red-500 bg-red-50 dark:bg-red-950'
          }`}
        >
          <h1
            className={`text-3xl font-bold mb-4 ${
              isConnected ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {isConnected ? '✅ Supabase Connected!' : '❌ Connection Error'}
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
              <p
                className={`font-mono text-sm ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {connectionStatus}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">
                Environment Variables
              </h2>
              <div className="bg-white dark:bg-gray-900 p-4 rounded border">
                <p className="font-mono text-xs break-all">
                  <span className="font-semibold">SUPABASE_URL:</span>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not Set'}
                </p>
                <p className="font-mono text-xs mt-2">
                  <span className="font-semibold">SUPABASE_ANON_KEY:</span>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? '✅ Set (hidden for security)'
                    : '❌ Not Set'}
                </p>
              </div>
            </div>

            {authError && (
              <div>
                <h2 className="text-lg font-semibold mb-2 text-yellow-700">
                  Auth Status
                </h2>
                <div className="bg-white dark:bg-gray-900 p-4 rounded border">
                  <p className="text-sm">No user authenticated (expected)</p>
                </div>
              </div>
            )}

            {connectionError && (
              <div>
                <h2 className="text-lg font-semibold mb-2 text-red-700">
                  Error Details
                </h2>
                <pre className="bg-white dark:bg-gray-900 p-4 rounded border overflow-x-auto text-xs">
                  {connectionError}
                </pre>
              </div>
            )}

            {!isConnected && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 rounded">
                <h3 className="font-semibold mb-2 text-yellow-800">
                  Setup Instructions:
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                  <li>Go to https://supabase.com/dashboard</li>
                  <li>Create a new project (or select existing)</li>
                  <li>Wait for project provisioning (~2 minutes)</li>
                  <li>Go to Project Settings → API</li>
                  <li>
                    Copy the &quot;Project URL&quot; and &quot;anon public&quot;
                    key
                  </li>
                  <li>Update the values in .env.local</li>
                  <li>Restart the dev server (npm run dev)</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}

            {isConnected && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-300 rounded">
                <h3 className="font-semibold mb-2 text-green-800">
                  ✨ Next Steps:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  <li>Supabase connection is working correctly</li>
                  <li>Ready to proceed with database schema setup</li>
                  <li>Authentication can be configured</li>
                  <li>File storage is available</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

