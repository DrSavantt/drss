// Minimal loading state - rarely seen with server-side data fetching
// Only shown during initial page load before Suspense fallback kicks in

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link skeleton */}
      <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 bg-muted/30 rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-muted/30 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
            <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Description skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="h-5 w-28 bg-muted/30 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-3/5 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Main content area skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
