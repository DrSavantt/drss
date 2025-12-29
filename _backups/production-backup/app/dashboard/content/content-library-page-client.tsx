'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { ContentLibraryClient } from './content-library-client'
import { ContentCreateModal } from '@/components/content-create-modal'
import { getClients } from '@/app/actions/clients'

interface ContentAsset {
  id: string
  title: string
  asset_type: string
  created_at: string
  is_archived?: boolean
  clients: {
    name: string
  } | null
  projects: {
    name: string
  } | null
}

interface Client {
  id: string
  name: string
}

interface ContentLibraryPageClientProps {
  initialContent: ContentAsset[]
}

export function ContentLibraryPageClient({ initialContent }: ContentLibraryPageClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  // Load clients when modal opens
  useEffect(() => {
    if (showCreateModal && clients.length === 0) {
      setLoadingClients(true)
      getClients().then((data) => {
        setClients(data.map(c => ({ id: c.id, name: c.name })))
        setLoadingClients(false)
      })
    }
  }, [showCreateModal, clients.length])

  return (
    <div className="space-y-6">
      {/* Header with Create Content Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Library</h1>
          <p className="mt-2 text-silver">
            All content across all clients
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-primary hover:bg-red-bright text-white rounded-lg transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create Content</span>
        </button>
      </div>

      {initialContent.length === 0 ? (
        <div className="bg-charcoal rounded-lg border-2 border-dashed border-mid-gray p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">No content yet</h3>
          <p className="mt-2 text-sm text-silver">
            Create content from a client&apos;s page to get started, or use the Create Content button above.
          </p>
        </div>
      ) : (
        <ContentLibraryClient initialContent={initialContent} />
      )}

      {/* Create Content Modal */}
      <ContentCreateModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        clients={clients}
      />
    </div>
  )
}

