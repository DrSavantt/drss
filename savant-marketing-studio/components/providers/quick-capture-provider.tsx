"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { QuickCaptureModal } from "@/components/journal/quick-capture-modal"
import type { JournalEntry } from "@/types/journal"

interface QuickCaptureContextType {
  openQuickCapture: (defaultMentions?: {
    clientId?: string
    projectId?: string
    contentId?: string
    pageId?: string
  }) => void
  closeQuickCapture: () => void
  isOpen: boolean
}

const QuickCaptureContext = createContext<QuickCaptureContextType | null>(null)

export function useQuickCapture() {
  const context = useContext(QuickCaptureContext)
  if (!context) {
    throw new Error("useQuickCapture must be used within QuickCaptureProvider")
  }
  return context
}

interface QuickCaptureProviderProps {
  children: React.ReactNode
  onSuccess?: (entry: JournalEntry) => void
}

export function QuickCaptureProvider({ children, onSuccess }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultMentions, setDefaultMentions] = useState<{
    clientId?: string
    projectId?: string
    contentId?: string
    pageId?: string
  }>()

  const openQuickCapture = useCallback((mentions?: typeof defaultMentions) => {
    setDefaultMentions(mentions)
    setIsOpen(true)
  }, [])

  const closeQuickCapture = useCallback(() => {
    setIsOpen(false)
    setDefaultMentions(undefined)
  }, [])

  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+J (Mac) or Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        // Don't trigger in input/textarea elements (unless it's our modal's textarea)
        const target = e.target as HTMLElement
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA"
        const isInOurModal = target.closest('[aria-labelledby="quick-capture-title"]')
        
        // Allow shortcut from inputs only if modal is not open
        // This allows other inputs to use Cmd+J for their own purposes when modal is open
        if (isInput && !isInOurModal && isOpen) {
          return
        }
        
        e.preventDefault()
        
        // Toggle behavior - if open, close; if closed, open
        if (isOpen) {
          closeQuickCapture()
        } else {
          openQuickCapture()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, openQuickCapture, closeQuickCapture])

  return (
    <QuickCaptureContext.Provider value={{ openQuickCapture, closeQuickCapture, isOpen }}>
      {children}
      <QuickCaptureModal
        isOpen={isOpen}
        onClose={closeQuickCapture}
        onSuccess={onSuccess}
        defaultMentions={defaultMentions}
      />
    </QuickCaptureContext.Provider>
  )
}
