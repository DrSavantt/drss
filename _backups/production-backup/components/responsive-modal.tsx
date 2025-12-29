'use client'

import { ReactNode, useEffect } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'

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

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (!isDesktop && open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open, isDesktop])

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

  // Mobile: centered blur modal (like hamburger menu)
  return (
    <>
      {/* Blurred backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
          transition-opacity duration-200 ease-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ willChange: 'opacity' }}
      />

      {/* Centered modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4
          transition-all duration-200 ease-out
          ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
        style={{ willChange: 'opacity, transform' }}
      >
        <div className={`bg-surface border border-border rounded-xl shadow-xl w-full max-h-[85vh] overflow-y-auto ${className}`}>
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-silver hover:text-foreground transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}