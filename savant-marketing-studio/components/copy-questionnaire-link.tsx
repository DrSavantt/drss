'use client'

import { Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'

interface CopyQuestionnaireLinkProps {
  clientId: string
}

export function CopyQuestionnaireLink({ clientId }: CopyQuestionnaireLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/questionnaire/${clientId}`
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)

      // Show toast notification using DOM approach (consistent with existing codebase)
      const toast = document.createElement('div')
      toast.className = 'fixed bottom-4 right-4 bg-success/10 border border-success text-success px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2'
      toast.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-sm font-medium">Link copied to clipboard!</span>`
      document.body.appendChild(toast)
      
      setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2')
        setTimeout(() => toast.remove(), 150)
      }, 2000)
      
      // Reset icon after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      // Show error toast
      const errorToast = document.createElement('div')
      errorToast.className = 'fixed bottom-4 right-4 bg-error/10 border border-error text-error px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2'
      errorToast.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="text-sm font-medium">Failed to copy link</span>`
      document.body.appendChild(errorToast)
      
      setTimeout(() => {
        errorToast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2')
        setTimeout(() => errorToast.remove(), 150)
      }, 2000)
    }
  }, [clientId])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
      title="Copy questionnaire link to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? 'Copied!' : 'Copy Questionnaire Link'}
    </button>
  )
}

