'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Eye,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { sanitizeProgressData } from '@/lib/questionnaire/data-sanitizer'
import { isEmpty } from '@/lib/utils/safe-render'

// ============================================================================
// QUESTIONNAIRE STATUS CARD - Prominent display of onboarding status
// Matches production implementation with clear CTAs
// ============================================================================

interface QuestionnaireStatusCardProps {
  clientId: string
  clientName: string
  status: 'not_started' | 'in_progress' | 'completed' | null
  progress?: {
    current_section?: number
    completed_questions?: number[]
    total_questions?: number
  }
  completedAt?: string | null
  questionnaireToken?: string | null
  className?: string
}

export function QuestionnaireStatusCard({
  clientId,
  clientName,
  status,
  progress,
  completedAt,
  questionnaireToken,
  className
}: QuestionnaireStatusCardProps) {
  const [copied, setCopied] = useState(false)
  const effectiveStatus = status || 'not_started'
  
  // Sanitize progress data to prevent crashes from corrupted data
  const safeProgress = useMemo(() => {
    if (!progress || isEmpty(progress)) return null
    return sanitizeProgressData(progress)
  }, [progress])
  
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

  // Calculate progress for in_progress status with type safety
  const progressPercent = (() => {
    if (effectiveStatus !== 'in_progress' || !safeProgress) return 0
    
    const completedCount = safeProgress.completed_questions.length
    const totalCount = safeProgress.total_questions || 32
    
    if (completedCount === 0) return 0
    
    return Math.round((completedCount / totalCount) * 100)
  })()

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

              {/* Progress bar for in_progress */}
              {effectiveStatus === 'in_progress' && progressPercent > 0 && (
                <div className="mb-4 space-y-1">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Section {safeProgress?.current_section || 1} of 8 • {progressPercent}% complete
                  </p>
                </div>
              )}

              {/* CTA Button - Link to public form */}
              {questionnaireToken ? (
                <a 
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${questionnaireToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="font-bold">
                    {effectiveStatus === 'in_progress' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Resume Questionnaire
                      </>
                    ) : (
                      <>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Start Questionnaire
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <Button size="lg" className="font-bold" disabled>
                  No Questionnaire Link Available
                </Button>
              )}
            </div>
          </div>

          {/* Copy Form Link - Always show if token exists */}
          {questionnaireToken && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Share questionnaire link:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
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
          <Link href={`/dashboard/clients/${clientId}/questionnaire-responses`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Responses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Copy Form Link - Always show if token exists */}
        {questionnaireToken && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Share questionnaire link:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

