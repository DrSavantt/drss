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
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

export function QuestionnaireSettings() {
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [questions, setQuestions] = useState<QuestionWithHelp[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithHelp | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [sectionsData, questionsData] = await Promise.all([
        getSections(),
        getQuestionsWithHelp()
      ])
      setSections(sectionsData)
      setQuestions(questionsData)
    } catch (error) {
      console.error('Failed to load questionnaire config:', error)
      toast.error('Failed to load questionnaire configuration')
    } finally {
      setLoading(false)
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
      await toggleSection(id, enabled)
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
      await toggleQuestion(id, enabled)
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
          <CardTitle>Questionnaire Sections</CardTitle>
          <CardDescription>
            Drag to reorder sections. Click to expand and manage questions.
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
          onSave={async (updates) => {
            try {
              await updateSection(editingSection.id, updates)
              setSections(sections.map(s => 
                s.id === editingSection.id ? { ...s, ...updates } : s
              ))
              setEditingSection(null)
              toast.success('Section updated')
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
          onSave={async (questionUpdates, helpUpdates) => {
            try {
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
  onQuestionDragEnd
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
      className={`rounded-lg border ${isDragging ? 'opacity-50' : ''} ${!section.enabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <button
          onClick={onExpand}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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
        
        <Button variant="ghost" size="icon" onClick={onEdit}>
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
  onEdit
}: {
  question: QuestionWithHelp
  onToggle: () => void
  onEdit: () => void
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
      className={`flex items-center gap-3 p-3 bg-muted/30 rounded-md ${isDragging ? 'opacity-50' : ''} ${!question.enabled ? 'opacity-60' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Q{question.sort_order}</span>
          <Badge variant="outline" className="text-xs">{question.type}</Badge>
          {question.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
        </div>
        <p className="text-sm text-muted-foreground truncate">{question.text}</p>
      </div>

      <Switch checked={question.enabled} onCheckedChange={onToggle} />
      
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Edit Section Dialog
function EditSectionDialog({
  section,
  onClose,
  onSave
}: {
  section: SectionConfig
  onClose: () => void
  onSave: (updates: Partial<SectionConfig>) => void
}) {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description || '')
  const [minutes, setMinutes] = useState(section.estimated_minutes)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>Update section properties</DialogDescription>
        </DialogHeader>
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
          <div>
            <Label htmlFor="minutes">Estimated Minutes</Label>
            <Input
              id="minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ title, description, estimated_minutes: minutes })}>
            Save
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
  onSave
}: {
  question: QuestionWithHelp
  onClose: () => void
  onSave: (questionUpdates: any, helpUpdates: any) => void
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
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>Update question and help content</DialogDescription>
        </DialogHeader>

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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

