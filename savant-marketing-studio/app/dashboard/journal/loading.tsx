// Simplified loading state - rarely seen now that data arrives with the page
export default function JournalLoading() {
  return (
    <div className="p-6">
      <div className="h-9 w-28 bg-muted animate-pulse rounded mb-2" />
      <div className="h-5 w-64 bg-muted animate-pulse rounded" />
    </div>
  )
}
