'use client'

import { ResponsiveModal } from '@/components/responsive-modal'
import { AnimatedButton } from '@/components/animated-button'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  isDanger?: boolean
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = false
}: ConfirmationModalProps) {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(val) => { if (!val) onCancel() }}
      title={title}
    >
      <div className="space-y-4">
        <p className="text-silver">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <AnimatedButton
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 md:h-10 px-4"
          >
            {cancelText}
          </AnimatedButton>
          <AnimatedButton
            variant={isDanger ? 'primary' : 'secondary'}
            onClick={onConfirm}
            disabled={isLoading}
            className={`${isDanger ? '' : 'bg-info text-foreground hover:bg-info/80'} h-11 md:h-10 px-4`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </AnimatedButton>
        </div>
      </div>
    </ResponsiveModal>
  )
}
