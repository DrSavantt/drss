'use client'

import { deleteClient } from '@/app/actions/clients'
import { useState } from 'react'

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteClient(clientId)
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-card border border-card rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Delete {clientName}?
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            This will permanently delete this client and all associated projects and content. This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:bg-red-300"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 rounded-md bg-muted/20 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
    >
      Delete
    </button>
  )
}

