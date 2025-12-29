'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center bg-charcoal border border-mid-gray rounded-xl p-8 max-w-md">
        <div className="text-error text-6xl mb-4">⚠️</div>
        <h2 className="text-4xl font-bold mb-4 text-foreground">Something went wrong!</h2>
        <p className="text-silver mb-8">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => reset()}
          className="bg-red-primary hover:bg-red-bright text-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
