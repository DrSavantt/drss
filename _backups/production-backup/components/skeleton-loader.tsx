'use client'

// Instant skeleton loaders - no loading spinners
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-32 bg-dark-gray rounded-2xl" />
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-dark-gray rounded-xl" />
        ))}
      </div>
      
      {/* Activity skeleton */}
      <div className="h-96 bg-dark-gray rounded-xl" />
    </div>
  )
}

export function ClientGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-64 bg-dark-gray rounded-xl" />
      ))}
    </div>
  )
}

export function ProjectBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-12 bg-dark-gray rounded-lg" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="h-32 bg-dark-gray rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ContentLibrarySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-dark-gray rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="h-48 bg-dark-gray rounded-xl" />
        ))}
      </div>
    </div>
  )
}
