'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  getSections, 
  getQuestionsWithHelp,
  toggleSection,
  toggleQuestion,
  updateSection,
  updateQuestion,
  updateHelp,
  addSection,
  addQuestion,
  deleteSection,
  deleteQuestion,
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  RotateCcw,
  Plus,
  Trash2
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
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<SectionConfig | null>(null)
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithHelp | null>(null)
  const [addQuestionSection, setAddQuestionSection] = useState<SectionConfig | null>(null)
  const isSavingRef = useRef(false)

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
    // Don't reload while saving - prevents race condition
    if (isSavingRef.current) return
    
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
              // Guard against empty objects {}
              const customDescription = override.custom_help && 
                typeof override.custom_help === 'object' && 
                Object.keys(override.custom_help).length > 0
                ? (override.custom_help as Record<string, unknown>).description as string | null
                : null
              
              // Ensure description is string or null, never an object
              const finalDescription = typeof customDescription === 'string' 
                ? customDescription 
                : section.description
              
              return { 
                ...section, 
                enabled: override.is_enabled,
                title: override.custom_text || section.title,
                description: finalDescription
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
  
  function generateSectionKey(title: string) {
    const normalized = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    return normalized || `section_${Date.now()}`
  }

  function generateQuestionId(text: string) {
    const normalized = text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    return normalized ? `q_${normalized}` : `q_${Date.now()}`
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
    
    isSavingRef.current = true
    
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
    } finally {
      isSavingRef.current = false
    }
  }

  // Handle question toggle
  async function handleQuestionToggle(id: string, enabled: boolean) {
    const oldQuestions = [...questions]
    setQuestions(questions.map(q => q.id === id ? { ...q, enabled } : q))
    
    isSavingRef.current = true
    
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
    } finally {
      isSavingRef.current = false
    }
  }

  async function handleAddSection(values: {
    title: string
    description: string | null
    estimated_minutes: number
  }) {
    isSavingRef.current = true
    try {
      const key = generateSectionKey(values.title)
      const sort_order = sections.length + 1

      await addSection({
        key,
        title: values.title,
        description: values.description,
        estimated_minutes: values.estimated_minutes,
        sort_order,
        enabled: true,
      })

      isSavingRef.current = false
      await loadData()
      setIsAddSectionOpen(false)
      toast.success('Section added')
    } catch (error) {
      console.error('Failed to add section:', error)
      toast.error('Failed to add section')
    } finally {
      isSavingRef.current = false
    }
  }

  async function handleDeleteSection(section: SectionConfig) {
    isSavingRef.current = true
    try {
      console.log('Deleting section via action:', section.id)
      await deleteSection(section.id)
      isSavingRef.current = false
      await loadData()
      setSectionToDelete(null)
      toast.success('Section deleted')
    } catch (error) {
      console.error('Failed to delete section:', error)
      toast.error('Failed to delete section')
    } finally {
      isSavingRef.current = false
    }
  }

  async function handleAddQuestion(values: {
    section: SectionConfig
    text: string
    type: QuestionWithHelp['type']
    placeholder: string | null
    required: boolean
    helpContent: string | null
  }) {
    isSavingRef.current = true
    try {
      const id = generateQuestionId(values.text)
      const sectionQuestions = questions.filter(q => q.section_id === values.section.id)
      const sort_order = sectionQuestions.length + 1
      const payload = {
        id,
        section_id: values.section.id,
        question_key: id,
        sort_order,
        text: values.text,
        type: values.type,
        required: values.required,
        enabled: true,
        min_length: null,
        max_length: null,
        placeholder: values.placeholder,
        options: null,
        conditional_on: null,
        accepted_file_types: null,
        max_file_size: null,
        max_files: null,
        file_description: null,
        help_content: values.helpContent ? { content: values.helpContent } : null,
      }

      await addQuestion(payload as any)

      isSavingRef.current = false
      await loadData()
      setAddQuestionSection(null)
      toast.success('Question added')
    } catch (error) {
      console.error('Failed to add question:', error)
      toast.error('Failed to add question')
    } finally {
      isSavingRef.current = false
    }
  }

  async function handleDeleteQuestion(question: QuestionWithHelp) {
    isSavingRef.current = true
    try {
      await deleteQuestion(question.id)
      isSavingRef.current = false
      await loadData()
      setQuestionToDelete(null)
      toast.success('Question deleted')
    } catch (error) {
      console.error('Failed to delete question:', error)
      toast.error('Failed to delete question')
    } finally {
      isSavingRef.current = false
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
          {!isClientMode && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => setIsAddSectionOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          )}
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
                    onDelete={() => {
                      console.log('Delete clicked for section:', section.id)
                      setSectionToDelete(section)
                    }}
                    onExpand={() => toggleSectionExpansion(section.id)}
                    onQuestionToggle={handleQuestionToggle}
                    onQuestionEdit={setEditingQuestion}
                    onQuestionDelete={setQuestionToDelete}
                    onQuestionDragEnd={(e) => handleQuestionDragEnd(section.id, e)}
                    onAddQuestion={() => setAddQuestionSection(section)}
                    isClientMode={isClientMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {!isClientMode && (
        <AddSectionDialog
          open={isAddSectionOpen}
          onClose={() => setIsAddSectionOpen(false)}
          onSave={handleAddSection}
        />
      )}

      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sectionToDelete && questions.filter(q => q.section_id === sectionToDelete.id).length > 0
                ? `Delete this section and all ${questions.filter(q => q.section_id === sectionToDelete.id).length} questions inside?`
                : 'Delete this section?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (sectionToDelete) {
                  handleDeleteSection(sectionToDelete)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (questionToDelete) {
                  handleDeleteQuestion(questionToDelete)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddQuestionDialog
        section={addQuestionSection}
        onClose={() => setAddQuestionSection(null)}
        onSave={handleAddQuestion}
      />

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
                await updateQuestion(editingQuestion.id, questionUpdates)
                
                if (helpUpdates) {
                  await updateHelp(editingQuestion.id, helpUpdates)
                }
                
                setQuestions(questions.map(q =>
                  q.id === editingQuestion.id 
                    ? { ...q, ...questionUpdates, help: helpUpdates ? { ...q.help, ...helpUpdates } as any : q.help }
                    : q
                ))
                setEditingQuestion(null)
                toast.success('Question updated')
              }
            } catch (error) {
              console.error('Failed to update question:', error)
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
  onDelete,
  onExpand,
  onQuestionToggle,
  onQuestionEdit,
  onQuestionDelete,
  onQuestionDragEnd,
  onAddQuestion,
  isClientMode = false,
}: {
  section: SectionConfig
  questions: QuestionWithHelp[]
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onExpand: () => void
  onQuestionToggle: (id: string, enabled: boolean) => void
  onQuestionEdit: (question: QuestionWithHelp) => void
  onQuestionDelete: (question: QuestionWithHelp) => void
  onQuestionDragEnd: (event: DragEndEvent) => void
  onAddQuestion: () => void
  isClientMode?: boolean
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card ${isDragging ? 'opacity-50' : ''} ${!section.enabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-4 group">
        {!isClientMode && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div className="flex items-center gap-3">
            <span className="font-medium truncate">{section.title}</span>
            <span className="text-sm text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {section.description && typeof section.description === 'string' && (
            <p className="text-sm text-muted-foreground truncate">{section.description}</p>
          )}
        </div>

        <Switch checked={section.enabled} onCheckedChange={onToggle} />

        <Button variant="ghost" size="icon" onClick={onEdit} title="Edit section">
          <Pencil className="w-4 h-4" />
        </Button>
        {!isClientMode && (
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete section">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
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
                    onDelete={() => onQuestionDelete(question)}
                    isClientMode={isClientMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {!isClientMode && (
            <div className="pt-3">
              <Button variant="outline" size="sm" onClick={onAddQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          )}
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
  onDelete,
  isClientMode = false,
}: {
  question: QuestionWithHelp
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  isClientMode?: boolean
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
      className={`flex items-center gap-3 p-3 rounded-md bg-muted/30 ${isDragging ? 'opacity-50' : ''} ${!question.enabled ? 'opacity-60' : ''} group`}
    >
      {!isClientMode && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {typeof question.text === 'string' ? question.text : ''}
          </span>
          <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
            {question.type}
          </Badge>
        </div>
      </div>

      <Switch checked={question.enabled} onCheckedChange={onToggle} />

      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit question">
        <Pencil className="w-4 h-4" />
      </Button>
      {!isClientMode && (
        <Button variant="ghost" size="icon" onClick={onDelete} title="Delete question">
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
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

// Add Section Dialog
function AddSectionDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (values: {
    title: string
    description: string | null
    estimated_minutes: number
  }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(5)
  const [errors, setErrors] = useState<{ title?: string; minutes?: string }>({})

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setMinutes(5)
      setErrors({})
    }
  }, [open])

  function validate() {
    const nextErrors: { title?: string; minutes?: string } = {}
    const trimmedTitle = title.trim()

    if (trimmedTitle.length < 3) {
      nextErrors.title = 'Title must be at least 3 characters'
    }

    if (!Number.isFinite(minutes) || minutes <= 0) {
      nextErrors.minutes = 'Estimated minutes must be a positive number'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    onSave({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      estimated_minutes: minutes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Create a new questionnaire section.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="new-section-title">Title</Label>
            <Input
              id="new-section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title}</p>
            )}
          </div>
          <div>
            <Label htmlFor="new-section-description">Description</Label>
            <Input
              id="new-section-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-section-minutes">Estimated Minutes</Label>
            <Input
              id="new-section-minutes"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
            />
            {errors.minutes && (
              <p className="text-sm text-destructive mt-1">{errors.minutes}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add Question Dialog
function AddQuestionDialog({
  section,
  onClose,
  onSave,
}: {
  section: SectionConfig | null
  onClose: () => void
  onSave: (values: {
    section: SectionConfig
    text: string
    type: QuestionWithHelp['type']
    placeholder: string | null
    required: boolean
    helpContent: string | null
  }) => void
}) {
  const [text, setText] = useState('')
  const [type, setType] = useState<QuestionWithHelp['type']>('long-text')
  const [placeholder, setPlaceholder] = useState('')
  const [required, setRequired] = useState(false)
  const [helpContent, setHelpContent] = useState('')
  const [errors, setErrors] = useState<{ text?: string; type?: string }>({})

  useEffect(() => {
    if (section) {
      setText('')
      setType('long-text')
      setPlaceholder('')
      setRequired(false)
      setHelpContent('')
      setErrors({})
    }
  }, [section?.id])

  if (!section) return null

  function validate() {
    const nextErrors: { text?: string; type?: string } = {}
    if (text.trim().length === 0) {
      nextErrors.text = 'Question text is required'
    }
    if (!type) {
      nextErrors.type = 'Question type is required'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      section,
      text: text.trim(),
      type,
      placeholder: placeholder.trim() ? placeholder.trim() : null,
      required,
      helpContent: helpContent.trim() ? helpContent.trim() : null,
    })
  }

  return (
    <Dialog open={!!section} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
          <DialogDescription>
            Add a new question to this section.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="new-question-section">Section</Label>
            <Input id="new-question-section" value={section.title} disabled />
          </div>
          <div>
            <Label htmlFor="new-question-text">Question Text</Label>
            <Textarea
              id="new-question-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            {errors.text && (
              <p className="text-sm text-destructive mt-1">{errors.text}</p>
            )}
          </div>
          <div>
            <Label>Question Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as QuestionWithHelp['type'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long-text">long-text</SelectItem>
                <SelectItem value="short-text">short-text</SelectItem>
                <SelectItem value="multiple-choice">multiple-choice</SelectItem>
                <SelectItem value="checkbox">checkbox</SelectItem>
                <SelectItem value="file-upload">file-upload</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type}</p>
            )}
          </div>
          <div>
            <Label htmlFor="new-question-placeholder">Placeholder</Label>
            <Input
              id="new-question-placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="new-question-required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked === true)}
            />
            <Label htmlFor="new-question-required">Required</Label>
          </div>
          <div>
            <Label htmlFor="new-question-help">Help Content</Label>
            <Textarea
              id="new-question-help"
              value={helpContent}
              onChange={(e) => setHelpContent(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Question</Button>
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

