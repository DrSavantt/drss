import { PlusCircle, FileText, Folder, Layout } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
        Quick Actions
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Primary CTA - Most common action */}
        <Link
          href="/dashboard/content"
          className="
            flex-1 min-w-[200px] h-14 
            bg-coral hover:bg-coral-dark 
            rounded-xl font-medium text-white
            flex items-center justify-center gap-2
            shadow-lg shadow-coral/20
            active:scale-95 transition-all
            group
          "
        >
          <PlusCircle size={20} />
          Create Content
          <span className="ml-auto mr-2 text-xs opacity-70 hidden sm:inline">⌘N</span>
        </Link>

        {/* Secondary actions */}
        <Link
          href="/dashboard/clients/new"
          className="
            flex-1 sm:flex-initial px-6 h-14 
            border-2 border-slate-700 hover:border-coral 
            rounded-xl text-white font-medium
            flex items-center justify-center gap-2
            transition-all active:scale-95
          "
        >
          <Folder size={18} />
          New Client
        </Link>
        
        <Link
          href="/dashboard/projects/board"
          className="
            flex-1 sm:flex-initial px-6 h-14 
            border-2 border-slate-700 hover:border-coral 
            rounded-xl text-white font-medium
            flex items-center justify-center gap-2
            transition-all active:scale-95
          "
        >
          <Layout size={18} />
          View Board
        </Link>
      </div>

      {/* Alternative: Create from scratch */}
      <div className="pt-2">
        <Link
          href="/dashboard/journal"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <FileText size={16} />
          Or start with a quick note
        </Link>
      </div>
    </div>
  )
}

