'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// ============================================================================
// QUESTIONNAIRE STATUS CARD - Prominent display of onboarding status
// Simplified - no progress tracking (progress column was never written to)
// ============================================================================

interface QuestionnaireStatusCardProps {
  clientId: string
  clientName: string
  status: 'not_started' | 'in_progress' | 'completed' | null
  completedAt?: string | null
  questionnaireToken?: string | null
  className?: string
}

export function QuestionnaireStatusCard({
  clientId,
  clientName,
  status,
  completedAt,
  questionnaireToken,
  className
}: QuestionnaireStatusCardProps) {
  const [copied, setCopied] = useState(false)
  const effectiveStatus = status || 'not_started'
  
  const handleCopyLink = async () => {
    if (!questionnaireToken) return
    
    const link = `${window.location.origin}/form/${questionnaireToken}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Not started or in progress - Red/Orange card with CTA
  if (effectiveStatus !== 'completed') {
    return (
      <Card className={cn(
        "relative overflow-hidden border-2",
        effectiveStatus === 'in_progress' 
          ? "bg-yellow-500/5 border-yellow-500/30" 
          : "bg-primary/5 border-primary/30",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {/* Title with emoji */}
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                {effectiveStatus === 'in_progress' ? (
                  <>
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Questionnaire In Progress
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Complete Your Onboarding
                  </>
                )}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                {effectiveStatus === 'in_progress' 
                  ? 'Pick up where you left off. Your progress has been saved.'
                  : 'Help us understand your business better by completing the onboarding questionnaire. Takes about 15 minutes.'}
              </p>

              {/* Copy Link Button - Admin action to share with client */}
              {questionnaireToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="mt-4"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link for Client
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Completed - Green card with checkmark
  return (
    <Card className={cn(
      "relative overflow-hidden bg-green-500/5 border-2 border-green-500/30",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Onboarding Complete</h3>
              <p className="text-sm text-muted-foreground">
                Completed {completedAt ? new Date(completedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Link */}
            {questionnaireToken && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            )}
            {/* View Responses */}
            <Link href={`/dashboard/clients/${clientId}/questionnaire`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Responses
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

