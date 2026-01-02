import { Skeleton } from "@/components/ui/skeleton"

export default function JournalLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Chat List and Entry Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat List */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-20 mb-4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-border space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        
        {/* Entries */}
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

