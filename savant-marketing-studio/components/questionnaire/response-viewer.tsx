'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeRender, isEmptyObject } from '@/lib/utils/safe-render'

interface QuestionResponse {
  questionKey: string        // Full key like "q1_ideal_customer"
  questionText: string
  answer?: string | string[]  // Optional since we look it up from responseData
  type: 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload'
}

interface SectionResponse {
  sectionKey: string
  sectionTitle: string
  questions: QuestionResponse[]
}

interface ResponseViewerProps {
  responseData: Record<string, any>
  sections: SectionResponse[]
  className?: string
}

export function ResponseViewer({ responseData, sections, className }: ResponseViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionKey)) {
        next.delete(sectionKey)
      } else {
        next.add(sectionKey)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.sectionKey)))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  const getAnswer = (sectionKey: string, questionKey: string): string | string[] | null => {
    const sectionData = responseData[sectionKey]
    if (!sectionData) return null
    
    const rawAnswer = sectionData[questionKey]
    
    // Validate the answer type - filter out invalid types
    if (rawAnswer === null || rawAnswer === undefined) return null
    
    // Handle empty objects (corrupted data)
    if (isEmptyObject(rawAnswer)) {
      console.warn('Empty object in response data at', sectionKey, questionKey)
      return null
    }
    
    // Handle objects (should not happen, but protect against it)
    if (typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
      console.warn('Unexpected object in response data:', sectionKey, questionKey, rawAnswer)
      return null // Treat objects as no answer
    }
    
    return rawAnswer ?? null
  }

  const formatAnswer = (answer: string | string[] | null, type: string): string => {
    // Use the safe render utility
    const rendered = safeRender(answer)
    return rendered || '—'
  }

  const getAnsweredCount = (section: SectionResponse): number => {
    return section.questions.filter(q => {
      const answer = getAnswer(section.sectionKey, q.questionKey)
      if (answer === null || answer === undefined) return false
      if (Array.isArray(answer)) return answer.length > 0
      if (typeof answer === 'string') return answer.trim() !== ''
      return true
    }).length
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {sections.length} sections
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.sectionKey)
          const answeredCount = getAnsweredCount(section)
          const totalCount = section.questions.length
          const isComplete = answeredCount === totalCount

          return (
            <div
              key={section.sectionKey}
              className="border border-border rounded-lg overflow-hidden bg-card"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.sectionKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{section.sectionTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm',
                    isComplete ? 'text-green-500' : 'text-muted-foreground'
                  )}>
                    {answeredCount}/{totalCount} answered
                  </span>
                  {isComplete && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {section.questions.map((question, index) => {
                    const answer = getAnswer(section.sectionKey, question.questionKey)
                    const formattedAnswer = formatAnswer(answer, question.type)
                    const hasAnswer = formattedAnswer !== '—'

                    return (
                      <div key={question.questionKey} className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                            Q{index + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              {question.questionText}
                            </p>
                            <div className={cn(
                              'text-sm rounded-md p-3',
                              hasAnswer 
                                ? 'bg-muted/50 text-foreground' 
                                : 'bg-muted/30 text-muted-foreground italic'
                            )}>
                              {question.type === 'long-text' && hasAnswer ? (
                                <p className="whitespace-pre-wrap">{formattedAnswer}</p>
                              ) : (
                                <p>{formattedAnswer}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

