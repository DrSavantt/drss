import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-56" />
      </div>
      
      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[80px]" />
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-border pb-3">
        {['Overview', 'Clients', 'Projects', 'Content', 'AI', 'Activity'].map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Quick Insights */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 flex-1 max-w-[300px]" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-[180px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

