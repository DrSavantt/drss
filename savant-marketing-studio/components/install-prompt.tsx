'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-surface border border-border rounded-xl p-4 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-foreground">Install DRSS App</h3>
          <button onClick={() => setShowPrompt(false)} className="p-1">
            <X size={18} className="text-silver" />
          </button>
        </div>
        <p className="text-sm text-silver mb-4">
          Add DRSS to your home screen for quick access and offline support.
        </p>
        <button
          onClick={handleInstall}
          className="w-full bg-red-primary text-white py-2 rounded-lg hover:bg-red-primary/90 transition-colors"
        >
          Install App
        </button>
      </div>
    </div>
  )
}
