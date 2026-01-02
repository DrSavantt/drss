'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-silver">{message}</p>
          <div className="flex gap-3 justify-end pt-2">
            <AnimatedButton
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="h-10 px-4"
            >
              {cancelText}
            </AnimatedButton>
            <AnimatedButton
              variant={isDanger ? 'primary' : 'secondary'}
              onClick={onConfirm}
              disabled={isLoading}
              className={`${isDanger ? '' : 'bg-info text-foreground hover:bg-info/80'} h-10 px-4`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </AnimatedButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
