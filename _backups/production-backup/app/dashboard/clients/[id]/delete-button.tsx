'use client'

import { deleteClient, getRelatedCounts } from '@/app/actions/clients'
import { useState, useEffect } from 'react'
import { DeleteConfirmationModal, type RelatedCounts } from '@/components/delete-confirmation-modal'

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const [showModal, setShowModal] = useState(false)
  const [relatedCounts, setRelatedCounts] = useState<RelatedCounts | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showModal && !relatedCounts) {
      // Fetch related counts when modal opens
      getRelatedCounts(clientId).then(setRelatedCounts)
    }
  }, [showModal, clientId, relatedCounts])

  async function handleDeleteConfirm(deleteOption: 'all' | 'preserve') {
    await deleteClient(clientId, deleteOption, clientName)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-dark transition-colors"
      >
        Delete
      </button>

      <DeleteConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={{ type: 'client', name: clientName }}
        relatedCounts={relatedCounts}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
