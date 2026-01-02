import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-5 w-40" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention Card */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Skeleton className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
          
          {/* This Week Calendar Card */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-6 w-28" />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="text-center p-2 rounded-lg border border-border">
                    <Skeleton className="h-3 w-8 mx-auto mb-1" />
                    <Skeleton className="h-6 w-6 mx-auto" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border border-border">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Capture */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-[120px] w-full rounded-md" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

