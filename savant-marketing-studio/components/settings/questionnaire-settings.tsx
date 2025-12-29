'use client'

import { useState, useEffect } from 'react'
import { 
  getSections, 
  getQuestionsWithHelp,
  toggleSection,
  toggleQuestion,
  updateSection,
  updateQuestion,
  updateHelp,
  reorderSections,
  reorderQuestions,
  type SectionConfig,
  type QuestionWithHelp
} from '@/app/actions/questionnaire-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  ChevronDown, 
  ChevronRight, 
  Pencil, 
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// Types for client overrides
interface ClientOverride {
  id: string
  client_id: string
  question_id: string | null
  section_id: number | null
  override_type: 'question' | 'section' | 'help'
  is_enabled: boolean
  custom_text: string | null
  custom_help: Record<string, unknown> | null
}

interface QuestionnaireSettingsProps {
  clientId?: string
  clientName?: string
  mode?: 'global' | 'client'
}

export function QuestionnaireSettings({ 
  clientId, 
  clientName,
  mode = 'global' 
}: QuestionnaireSettingsProps) {
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [questions, setQuestions] = useState<QuestionWithHelp[]>([])
  const [clientOverrides, setClientOverrides] = useState<ClientOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithHelp | null>(null)

  const isClientMode = mode === 'client' && !!clientId

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load data
  useEffect(() => {
    loadData()
  }, [clientId, mode])

  async function loadData() {
    try {
      setLoading(true)
      
      // Always load global config first
      const [sectionsData, questionsData] = await Promise.all([
        getSections(),
        getQuestionsWithHelp()
      ])
      
      // In client mode, also fetch client overrides and merge
      if (isClientMode) {
        const overridesRes = await fetch(`/api/client-questionnaire/${clientId}/overrides`)
        if (overridesRes.ok) {
          const overridesData = await overridesRes.json()
          const overrides = overridesData.data || []
          setClientOverrides(overrides)
          
          // Apply section overrides
          const mergedSections = sectionsData.map(section => {
            const override = overrides.find((o: ClientOverride) => 
              o.section_id === section.id && o.override_type === 'section'
            )
            if (override) {
              // Read description from custom_help.description if present
              const customDescription = override.custom_help && typeof override.custom_help === 'object' 
                ? (override.custom_help as Record<string, unknown>).description as string | null
                : null
              return { 
                ...section, 
                enabled: override.is_enabled,
                title: override.custom_text || section.title,
                description: customDescription || section.description
              }
            }
            return section
          })
          setSections(mergedSections)
          
          // Apply question overrides
          const mergedQuestions = questionsData.map(question => {
            const override = overrides.find((o: ClientOverride) => 
              o.question_id === question.id
            )
            if (override) {
              return {
                ...question,
                enabled: override.is_enabled,
                text: override.custom_text || question.text
              }
            }
            return question
          })
          setQuestions(mergedQuestions)
        } else {
          setSections(sectionsData)
          setQuestions(questionsData)
        }
      } else {
        setSections(sectionsData)
        setQuestions(questionsData)
      }
    } catch (error) {
      console.error('Failed to load questionnaire config:', error)
      toast.error('Failed to load questionnaire configuration')
    } finally {
      setLoading(false)
    }
  }
  
  // Check if an item has an override (for visual indication)
  const hasOverride = (type: 'section' | 'question', id: number | string) => {
    if (!isClientMode) return false
    return clientOverrides.some(o => 
      type === 'section' 
        ? o.section_id === id 
        : o.question_id === id
    )
  }
  
  // Reset a single override to global defaults
  async function resetOverride(type: 'section' | 'question', id: number | string) {
    if (!isClientMode) return
    
    const override = clientOverrides.find(o => 
      type === 'section' ? o.section_id === id : o.question_id === id
    )
    
    if (!override) return
    
    try {
      const res = await fetch(`/api/client-questionnaire/${clientId}/override/${override.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to reset')
      
      toast.success('Reset to global defaults')
      loadData() // Reload to get fresh state
    } catch (error) {
      console.error('Failed to reset override:', error)
      toast.error('Failed to reset override')
    }
  }
  
  // Reset all overrides for this client
  async function resetAllOverrides() {
    if (!isClientMode || clientOverrides.length === 0) return
    
    try {
      // Delete each override
      await Promise.all(
        clientOverrides.map(o => 
          fetch(`/api/client-questionnaire/${clientId}/override/${o.id}`, {
            method: 'DELETE'
          })
        )
      )
      
      toast.success('All customizations reset to global defaults')
      loadData()
    } catch (error) {
      console.error('Failed to reset overrides:', error)
      toast.error('Failed to reset all overrides')
    }
  }

  // Calculate stats
  const enabledSections = sections.filter(s => s.enabled).length
  const enabledQuestions = questions.filter(q => q.enabled).length
  const totalTime = sections
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.estimated_minutes, 0)

  // Handle section toggle
  async function handleSectionToggle(id: number, enabled: boolean) {
    const oldSections = [...sections]
    setSections(sections.map(s => s.id === id ? { ...s, enabled } : s))
    
    try {
      if (isClientMode) {
        // Save to client overrides
        const res = await fetch(`/api/client-questionnaire/${clientId}/override`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section_id: id,
            override_type: 'section',
            is_enabled: enabled
          })
        })
        if (!res.ok) throw new Error('Failed to save override')
        
        // Update local overrides state
        const result = await res.json()
        if (result.action === 'created') {
          setClientOverrides([...clientOverrides, result.data])
        } else {
          setClientOverrides(clientOverrides.map(o => 
            o.section_id === id ? result.data : o
          ))
        }
      } else {
        await toggleSection(id, enabled)
      }
      toast.success(enabled ? 'Section enabled' : 'Section disabled')
    } catch (error) {
      setSections(oldSections)
      toast.error('Failed to update section')
    }
  }

  // Handle question toggle
  async function handleQuestionToggle(id: string, enabled: boolean) {
    const oldQuestions = [...questions]
    setQuestions(questions.map(q => q.id === id ? { ...q, enabled } : q))
    
    try {
      if (isClientMode) {
        // Save to client overrides
        const res = await fetch(`/api/client-questionnaire/${clientId}/override`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: id,
            override_type: 'question',
            is_enabled: enabled
          })
        })
        if (!res.ok) throw new Error('Failed to save override')
        
        // Update local overrides state
        const result = await res.json()
        if (result.action === 'created') {
          setClientOverrides([...clientOverrides, result.data])
        } else {
          setClientOverrides(clientOverrides.map(o => 
            o.question_id === id ? result.data : o
          ))
        }
      } else {
        await toggleQuestion(id, enabled)
      }
      toast.success(enabled ? 'Question enabled' : 'Question disabled')
    } catch (error) {
      setQuestions(oldQuestions)
      toast.error('Failed to update question')
    }
  }

  // Handle section reorder
  async function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id)
      const newIndex = sections.findIndex(s => s.id === over.id)
      
      const newOrder = arrayMove(sections, oldIndex, newIndex)
      setSections(newOrder)
      
      try {
        await reorderSections(newOrder.map(s => s.id))
        toast.success('Sections reordered')
      } catch (error) {
        setSections(sections)
        toast.error('Failed to reorder sections')
      }
    }
  }

  // Handle question reorder within section
  async function handleQuestionDragEnd(sectionId: number, event: DragEndEvent) {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const sectionQuestions = questions.filter(q => q.section_id === sectionId)
      const oldIndex = sectionQuestions.findIndex(q => q.id === active.id)
      const newIndex = sectionQuestions.findIndex(q => q.id === over.id)
      
      const newOrder = arrayMove(sectionQuestions, oldIndex, newIndex)
      
      // Update local state
      const otherQuestions = questions.filter(q => q.section_id !== sectionId)
      setQuestions([...otherQuestions, ...newOrder])
      
      try {
        await reorderQuestions(sectionId, newOrder.map(q => q.id))
        toast.success('Questions reordered')
      } catch (error) {
        setQuestions(questions)
        toast.error('Failed to reorder questions')
      }
    }
  }

  // Toggle section expansion
  function toggleSectionExpansion(id: number) {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Client Mode Banner */}
      {isClientMode && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-500/50 bg-blue-500/10">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-4">
            <span className="text-blue-800 dark:text-blue-200">
              <strong>Client-specific overrides</strong> — Changes here only affect {clientName}&apos;s questionnaire.
              {clientOverrides.length > 0 && (
                <span className="ml-2 text-sm opacity-80">
                  ({clientOverrides.length} customization{clientOverrides.length !== 1 ? 's' : ''} active)
                </span>
              )}
            </span>
            {clientOverrides.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAllOverrides}
                className="shrink-0 border-blue-500/50 text-blue-700 hover:bg-blue-500/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All to Global
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enabled Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledSections} / {sections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enabled Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledQuestions} / {questions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Est. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTime} min</div>
          </CardContent>
        </Card>
      </div>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isClientMode ? `Questionnaire for ${clientName}` : 'Questionnaire Sections'}
          </CardTitle>
          <CardDescription>
            {isClientMode 
              ? 'Toggle or edit sections and questions to customize what this client sees. Items with a blue dot have been customized.'
              : 'Drag to reorder sections. Click to expand and manage questions.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map(section => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    questions={questions.filter(q => q.section_id === section.id)}
                    isExpanded={expandedSections.has(section.id)}
                    onToggle={() => handleSectionToggle(section.id, !section.enabled)}
                    onEdit={() => setEditingSection(section)}
                    onExpand={() => toggleSectionExpansion(section.id)}
                    onQuestionToggle={handleQuestionToggle}
                    onQuestionEdit={setEditingQuestion}
                    onQuestionDragEnd={(e) => handleQuestionDragEnd(section.id, e)}
                    isClientMode={isClientMode}
                    hasOverride={hasOverride('section', section.id)}
                    onResetOverride={() => resetOverride('section', section.id)}
                    hasQuestionOverride={(questionId) => hasOverride('question', questionId)}
                    onResetQuestionOverride={(questionId) => resetOverride('question', questionId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Edit Section Dialog */}
      {editingSection && (
        <EditSectionDialog
          section={editingSection}
          onClose={() => setEditingSection(null)}
          isClientMode={isClientMode}
          clientName={clientName}
          onSave={async (updates) => {
            try {
              if (isClientMode && clientId) {
                // Save to client overrides
                const res = await fetch(`/api/client-questionnaire/${clientId}/override`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    section_id: editingSection.id,
                    override_type: 'section',
                    is_enabled: editingSection.enabled, // Keep current enabled state
                    custom_text: updates.title,
                    custom_description: updates.description
                  })
                })
                if (!res.ok) throw new Error('Failed to save override')
                
                // Update local overrides state
                const result = await res.json()
                if (result.action === 'created') {
                  setClientOverrides([...clientOverrides, result.data])
                } else {
                  setClientOverrides(clientOverrides.map(o => 
                    o.section_id === editingSection.id ? result.data : o
                  ))
                }
                
                // Update local sections state
                setSections(sections.map(s => 
                  s.id === editingSection.id ? { ...s, ...updates } : s
                ))
                setEditingSection(null)
                toast.success('Section customized for this client')
              } else {
                // Global mode - update global table
                await updateSection(editingSection.id, updates)
                setSections(sections.map(s => 
                  s.id === editingSection.id ? { ...s, ...updates } : s
                ))
                setEditingSection(null)
                toast.success('Section updated')
              }
            } catch (error) {
              toast.error('Failed to update section')
            }
          }}
        />
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <EditQuestionDialog
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          isClientMode={isClientMode}
          clientName={clientName}
          onSave={async (questionUpdates, helpUpdates) => {
            try {
              if (isClientMode && clientId) {
                // Save to client overrides
                const res = await fetch(`/api/client-questionnaire/${clientId}/override`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    question_id: editingQuestion.id,
                    override_type: 'question',
                    is_enabled: editingQuestion.enabled, // Keep current enabled state
                    custom_text: questionUpdates.text,
                    custom_help: helpUpdates ? {
                      title: helpUpdates.title,
                      quick_tip: helpUpdates.quick_tip,
                      good_example: helpUpdates.good_example,
                      weak_example: helpUpdates.weak_example
                    } : null
                  })
                })
                if (!res.ok) throw new Error('Failed to save override')
                
                // Update local overrides state
                const result = await res.json()
                if (result.action === 'created') {
                  setClientOverrides([...clientOverrides, result.data])
                } else {
                  setClientOverrides(clientOverrides.map(o => 
                    o.question_id === editingQuestion.id ? result.data : o
                  ))
                }
                
                // Update local questions state
                setQuestions(questions.map(q =>
                  q.id === editingQuestion.id 
                    ? { ...q, text: questionUpdates.text, help: helpUpdates ? { ...q.help, ...helpUpdates } as any : q.help }
                    : q
                ))
                setEditingQuestion(null)
                toast.success('Question customized for this client')
              } else {
                // Global mode - update global tables
                await Promise.all([
                  updateQuestion(editingQuestion.id, questionUpdates),
                  helpUpdates && updateHelp(editingQuestion.id, helpUpdates)
                ])
                setQuestions(questions.map(q =>
                  q.id === editingQuestion.id 
                    ? { ...q, ...questionUpdates, help: helpUpdates ? { ...q.help, ...helpUpdates } as any : q.help }
                    : q
                ))
                setEditingQuestion(null)
                toast.success('Question updated')
              }
            } catch (error) {
              toast.error('Failed to update question')
            }
          }}
        />
      )}
    </div>
  )
}

// Section Item Component
function SectionItem({
  section,
  questions,
  isExpanded,
  onToggle,
  onEdit,
  onExpand,
  onQuestionToggle,
  onQuestionEdit,
  onQuestionDragEnd,
  isClientMode = false,
  hasOverride = false,
  onResetOverride,
  hasQuestionOverride,
  onResetQuestionOverride
}: {
  section: SectionConfig
  questions: QuestionWithHelp[]
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onExpand: () => void
  onQuestionToggle: (id: string, enabled: boolean) => void
  onQuestionEdit: (question: QuestionWithHelp) => void
  onQuestionDragEnd: (event: DragEndEvent) => void
  isClientMode?: boolean
  hasOverride?: boolean
  onResetOverride?: () => void
  hasQuestionOverride?: (questionId: string) => boolean
  onResetQuestionOverride?: (questionId: string) => void
}) {
  // ✅ HOOKS AT TOP LEVEL - Must be called on every render
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id })

  // ✅ Create sensors at top level, always called in same order
  const questionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const enabledCount = questions.filter(q => q.enabled).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border ${isDragging ? 'opacity-50' : ''} ${!section.enabled ? 'opacity-60' : ''} ${hasOverride ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        {!isClientMode && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onExpand}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasOverride && (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="Customized for this client" />
            )}
            <span className="font-medium">{section.title}</span>
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {section.estimated_minutes}m
            </Badge>
            <Badge variant="outline" className="text-xs">
              {enabledCount}/{questions.length} questions
            </Badge>
          </div>
          {section.description && (
            <p className="text-sm text-muted-foreground truncate">{section.description}</p>
          )}
        </div>

        <Switch checked={section.enabled} onCheckedChange={onToggle} />
        
        {hasOverride && onResetOverride && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onResetOverride}
            title="Reset to global default"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        
        <Button variant="ghost" size="icon" onClick={onEdit} title={isClientMode ? "Customize for this client" : "Edit section"}>
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pl-16">
          <DndContext
            sensors={questionSensors}
            collisionDetection={closestCenter}
            onDragEnd={onQuestionDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {questions.map(question => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onToggle={() => onQuestionToggle(question.id, !question.enabled)}
                    onEdit={() => onQuestionEdit(question)}
                    isClientMode={isClientMode}
                    hasOverride={hasQuestionOverride?.(question.id) || false}
                    onResetOverride={onResetQuestionOverride ? () => onResetQuestionOverride(question.id) : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// Question Item Component
function QuestionItem({
  question,
  onToggle,
  onEdit,
  isClientMode = false,
  hasOverride = false,
  onResetOverride
}: {
  question: QuestionWithHelp
  onToggle: () => void
  onEdit: () => void
  isClientMode?: boolean
  hasOverride?: boolean
  onResetOverride?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-md ${isDragging ? 'opacity-50' : ''} ${!question.enabled ? 'opacity-60' : ''} ${hasOverride ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-muted/30'}`}
    >
      {!isClientMode && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {hasOverride && (
            <span className="w-2 h-2 rounded-full bg-blue-500" title="Customized for this client" />
          )}
          <span className="text-sm font-medium">Q{question.sort_order}</span>
          <Badge variant="outline" className="text-xs">{question.type}</Badge>
          {question.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
        </div>
        <p className="text-sm text-muted-foreground truncate">{question.text}</p>
      </div>

      <Switch checked={question.enabled} onCheckedChange={onToggle} />
      
      {hasOverride && onResetOverride && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onResetOverride}
          title="Reset to global default"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      )}
      
      <Button variant="ghost" size="icon" onClick={onEdit} title={isClientMode ? "Customize for this client" : "Edit question"}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Edit Section Dialog
function EditSectionDialog({
  section,
  onClose,
  onSave,
  isClientMode = false,
  clientName
}: {
  section: SectionConfig
  onClose: () => void
  onSave: (updates: Partial<SectionConfig>) => void
  isClientMode?: boolean
  clientName?: string
}) {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description || '')
  const [minutes, setMinutes] = useState(section.estimated_minutes)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isClientMode ? `Customize Section for ${clientName}` : 'Edit Section'}
          </DialogTitle>
          <DialogDescription>
            {isClientMode 
              ? 'These changes will only apply to this client\'s questionnaire'
              : 'Update section properties'
            }
          </DialogDescription>
        </DialogHeader>
        {isClientMode && (
          <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md">
            💡 Changes here override the global settings for this client only.
          </div>
        )}
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {!isClientMode && (
            <div>
              <Label htmlFor="minutes">Estimated Minutes</Label>
              <Input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ title, description, estimated_minutes: minutes })}>
            {isClientMode ? 'Save Customization' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Question Dialog
function EditQuestionDialog({
  question,
  onClose,
  onSave,
  isClientMode = false,
  clientName
}: {
  question: QuestionWithHelp
  onClose: () => void
  onSave: (questionUpdates: any, helpUpdates: any) => void
  isClientMode?: boolean
  clientName?: string
}) {
  const [text, setText] = useState(question.text)
  const [required, setRequired] = useState(question.required)
  const [minLength, setMinLength] = useState(question.min_length || 0)
  const [maxLength, setMaxLength] = useState(question.max_length || 1000)
  const [placeholder, setPlaceholder] = useState(question.placeholder || '')
  const [helpTitle, setHelpTitle] = useState(question.help?.title || '')
  const [quickTip, setQuickTip] = useState(question.help?.quick_tip || '')
  const [goodExample, setGoodExample] = useState(question.help?.good_example || '')
  const [weakExample, setWeakExample] = useState(question.help?.weak_example || '')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isClientMode ? `Customize Question for ${clientName}` : 'Edit Question'}
          </DialogTitle>
          <DialogDescription>
            {isClientMode 
              ? 'These changes will only apply to this client\'s questionnaire'
              : 'Update question and help content'
            }
          </DialogDescription>
        </DialogHeader>

        {isClientMode && (
          <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md">
            💡 Changes here override the global settings for this client only.
          </div>
        )}

        <Tabs defaultValue="question" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="help">Help Content</TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="space-y-4">
            <div>
              <Label htmlFor="text">Question Text</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            </div>
            {!isClientMode && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="required">Required</Label>
                  <Switch
                    id="required"
                    checked={required}
                    onCheckedChange={setRequired}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minLength">Min Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={minLength}
                      onChange={(e) => setMinLength(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLength">Max Length</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={maxLength}
                      onChange={(e) => setMaxLength(parseInt(e.target.value) || 1000)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div>
              <Label htmlFor="helpTitle">Help Title</Label>
              <Input
                id="helpTitle"
                value={helpTitle}
                onChange={(e) => setHelpTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quickTip">Quick Tip</Label>
              <Textarea
                id="quickTip"
                value={quickTip}
                onChange={(e) => setQuickTip(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="goodExample">Good Example</Label>
              <Textarea
                id="goodExample"
                value={goodExample}
                onChange={(e) => setGoodExample(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="weakExample">Weak Example</Label>
              <Textarea
                id="weakExample"
                value={weakExample}
                onChange={(e) => setWeakExample(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onSave(
              {
                text,
                required,
                min_length: minLength || null,
                max_length: maxLength || null,
                placeholder: placeholder || null
              },
              {
                title: helpTitle || null,
                quick_tip: quickTip || null,
                good_example: goodExample || null,
                weak_example: weakExample || null
              }
            )
          }}>
            {isClientMode ? 'Save Customization' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

