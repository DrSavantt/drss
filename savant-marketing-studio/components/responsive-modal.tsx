'use client'

import { ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  className?: string
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  className = '',
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`sm:max-w-[500px] ${className}`}>
          <DialogTitle>{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`p-4 ${className}`}>
        <DrawerTitle className="text-lg font-semibold mb-4">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
