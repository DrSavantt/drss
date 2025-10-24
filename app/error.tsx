'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => reset()}
          className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

