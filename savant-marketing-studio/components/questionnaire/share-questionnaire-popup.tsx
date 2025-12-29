'use client'

import { useState, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Pencil, 
  Copy, 
  Loader2,
  Clock,
  GripVertical
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { QuestionEditorModal } from './question-editor-modal'
import {
  getSections,
  getQuestionsWithHelp,
  type SectionConfig,
  type QuestionWithHelp
} from '@/app/actions/questionnaire-config'

interface Override {
  id: string
  client_id: string
  question_id?: string
  section_id?: string
  override_type: string
  is_enabled: boolean
  custom_text?: string
}

interface ShareQuestionnairePopupProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  questionnaireToken: string
}

// Robust clipboard fallback for HTTP or permission denied scenarios
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern API (requires HTTPS or localhost)
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for HTTP or permission denied
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (e) {
      document.body.removeChild(textArea)
      console.error('Copy failed:', e)
      return false
    }
  }
}

export function ShareQuestionnairePopup({
  isOpen,
  onClose,
  clientId,
  clientName,
  questionnaireToken
}: ShareQuestionnairePopupProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [questions, setQuestions] = useState<QuestionWithHelp[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithHelp | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Map<string, Override>>(new Map())

  // Fetch ALL sections and questions (like Settings UI) + client overrides
  useEffect(() => {
    if (isOpen && clientId) {
      loadConfig()
    }
  }, [isOpen, clientId])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      // Fetch ALL sections and questions (same as Settings UI)
      const [sectionsData, questionsData] = await Promise.all([
        getSections(),
        getQuestionsWithHelp()
      ])
      
      // Also fetch client overrides
      const overridesRes = await fetch(`/api/client-questionnaire/${clientId}/overrides`)
      const overridesJson = await overridesRes.json()
      const overridesData = overridesJson.data || []
      
      setSections(sectionsData)
      setQuestions(questionsData)
      setOverrides(overridesData)
      
      // Expand first section by default
      if (sectionsData.length > 0) {
        setExpandedSections(new Set([sectionsData[0].id]))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      toast.error('Failed to load questionnaire config')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Get effective enabled state (considering overrides)
  const getSectionEnabled = (section: SectionConfig): boolean => {
    const override = overrides.find(o => o.section_id === section.id.toString())
    return override ? override.is_enabled : section.enabled
  }

  const getQuestionEnabled = (question: QuestionWithHelp): boolean => {
    const override = overrides.find(o => o.question_id === question.id)
    return override ? override.is_enabled : question.enabled
  }

  const getQuestionText = (question: QuestionWithHelp): string => {
    const override = overrides.find(o => o.question_id === question.id && o.custom_text)
    return override?.custom_text || question.text
  }

  const hasOverride = (question: QuestionWithHelp): boolean => {
    return overrides.some(o => o.question_id === question.id)
  }

  // Handle section toggle - saves to client overrides
  const handleSectionToggle = (sectionId: number, enabled: boolean) => {
    // Track pending change
    setPendingChanges(prev => {
      const next = new Map(prev)
      next.set(`section-${sectionId}`, {
        id: '',
        client_id: clientId,
        section_id: sectionId.toString(),
        override_type: 'section',
        is_enabled: enabled
      })
      return next
    })
  }

  // Handle question toggle - saves to client overrides
  const handleQuestionToggle = (questionId: string, enabled: boolean) => {
    // Track pending change
    setPendingChanges(prev => {
      const next = new Map(prev)
      const existingOverride = overrides.find(o => o.question_id === questionId)
      next.set(`question-${questionId}`, {
        id: existingOverride?.id || '',
        client_id: clientId,
        question_id: questionId,
        override_type: 'question',
        is_enabled: enabled,
        custom_text: existingOverride?.custom_text
      })
      return next
    })
  }

  // Handle question edit
  const handleQuestionEdit = (question: QuestionWithHelp) => {
    setEditingQuestion(question)
  }

  // Handle question save - saves custom text to client overrides
  const handleQuestionSave = (questionId: string, customText: string | null) => {
    // Track pending change
    setPendingChanges(prev => {
      const next = new Map(prev)
      const existingOverride = overrides.find(o => o.question_id === questionId)
      const existingPending = prev.get(`question-${questionId}`)
      
      next.set(`question-${questionId}`, {
        id: existingOverride?.id || '',
        client_id: clientId,
        question_id: questionId,
        override_type: 'question',
        is_enabled: existingPending?.is_enabled ?? existingOverride?.is_enabled ?? true,
        custom_text: customText || undefined
      })
      return next
    })

    setEditingQuestion(null)
  }

  // Calculate stats
  const enabledSections = sections.filter(s => getSectionEnabled(s)).length
  const enabledQuestions = questions.filter(q => getQuestionEnabled(q)).length
  const totalTime = sections
    .filter(s => getSectionEnabled(s))
    .reduce((sum, s) => sum + s.estimated_minutes, 0)

  // Save all pending changes and copy link
  const saveAndCopyLink = async () => {
    setIsSaving(true)
    try {
      // Save all pending changes
      for (const [key, override] of pendingChanges) {
        const response = await fetch(`/api/client-questionnaire/${clientId}/override`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(override)
        })
        if (!response.ok) throw new Error('Failed to save override')
      }

      // Copy link with fallback
      const link = `${window.location.origin}/form/${questionnaireToken}`
      const success = await copyToClipboard(link)
      
      if (success) {
        toast.success('Customizations saved! Link copied to clipboard.')
      } else {
        toast.error('Saved! But failed to copy link. Please copy manually.')
      }
      
      setPendingChanges(new Map())
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save customizations')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Customize Questionnaire</DialogTitle>
            <DialogDescription>
              for {clientName}
              <span className="ml-2 text-muted-foreground">
                {enabledSections}/{sections.length} sections • {enabledQuestions}/{questions.length} questions
                {totalTime > 0 && ` • ${totalTime} min`}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map(section => {
                  const sectionQuestions = questions.filter(q => q.section_id === section.id)
                  const sectionEnabled = getSectionEnabled(section)
                  const isExpanded = expandedSections.has(section.id)
                  const enabledCount = sectionQuestions.filter(q => getQuestionEnabled(q)).length

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "rounded-lg border",
                        !sectionEnabled && "opacity-60"
                      )}
                    >
                      {/* Section Header - matching Settings UI */}
                      <div className="flex items-center gap-3 p-4">
                        <button
                          onClick={() => toggleSectionExpansion(section.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              !sectionEnabled && "line-through"
                            )}>
                              {section.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {section.estimated_minutes}m
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {enabledCount}/{sectionQuestions.length} questions
                            </Badge>
                          </div>
                          {section.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {section.description}
                            </p>
                          )}
                        </div>

                        <Switch 
                          checked={sectionEnabled} 
                          onCheckedChange={(checked) => handleSectionToggle(section.id, checked)}
                        />
                      </div>

                      {/* Questions List - matching Settings UI */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pl-16">
                          <div className="space-y-2">
                            {sectionQuestions.map(question => {
                              const questionEnabled = getQuestionEnabled(question)
                              const questionText = getQuestionText(question)
                              const isCustom = hasOverride(question)

                              return (
                                <div
                                  key={question.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 bg-muted/30 rounded-md",
                                    !questionEnabled && "opacity-60"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Q{question.sort_order}</span>
                                      <Badge variant="outline" className="text-xs">{question.type}</Badge>
                                      {question.required && (
                                        <Badge variant="secondary" className="text-xs">Required</Badge>
                                      )}
                                      {isCustom && (
                                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-600/20">
                                          Custom
                                        </Badge>
                                      )}
                                    </div>
                                    <p className={cn(
                                      "text-sm text-muted-foreground",
                                      !questionEnabled && "line-through"
                                    )}>
                                      {questionText}
                                    </p>
                                  </div>

                                  <Switch 
                                    checked={questionEnabled} 
                                    onCheckedChange={(checked) => handleQuestionToggle(question.id, checked)}
                                  />
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleQuestionEdit(question)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={saveAndCopyLink} 
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Save & Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          question={editingQuestion}
          clientName={clientName}
          onSave={handleQuestionSave}
        />
      )}
    </>
  )
}
