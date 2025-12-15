'use client'

import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'

interface CopyFormLinkButtonProps {
  token: string
}

export function CopyFormLinkButton({ token }: CopyFormLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const copyLink = async () => {
    const url = `${window.location.origin}/form/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="mt-4 p-4 bg-surface border border-border rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-red-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-red-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground mb-1">Share Questionnaire Link</h4>
          <p className="text-xs text-silver">
            Send this link to your client so they can fill out the onboarding questionnaire without logging in.
          </p>
        </div>
      </div>
      <button
        onClick={copyLink}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-charcoal border border-mid-gray rounded-lg hover:bg-dark-gray hover:border-red-bright/50 transition-all min-h-[48px]"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-medium">Link Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-foreground" />
            <span className="text-foreground font-medium">Copy Form Link</span>
          </>
        )}
      </button>
    </div>
  )
}
