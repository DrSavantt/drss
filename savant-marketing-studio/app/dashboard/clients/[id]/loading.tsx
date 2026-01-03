// Minimal loading state - rarely seen now with server-side data fetching
// Only shown during initial page load, not on tab switches

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link skeleton */}
      <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted/30 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-muted/30 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 w-full max-w-md bg-muted/30 rounded-lg animate-pulse" />

      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>

      <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

