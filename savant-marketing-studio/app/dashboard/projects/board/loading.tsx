import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsBoardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {['Backlog', 'In Progress', 'In Review', 'Done'].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-t-lg">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            
            {/* Column Cards */}
            <div className="space-y-2 min-h-[400px] bg-muted/30 rounded-b-lg p-2">
              {[...Array(Math.max(1, 3 - i))].map((_, j) => (
                <div key={j} className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

