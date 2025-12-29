"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Check, HelpCircle, ChevronRight, ChevronLeft, Save } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface ClientQuestionnaireProps {
  clientName: string
}

const sections = [
  {
    id: "avatar",
    title: "Avatar",
    questions: [
      { id: "q1", text: "Who is your ideal customer?", help: "Describe demographics, psychographics, and behaviors" },
      { id: "q2", text: "What does a day in their life look like?", help: "Walk through their typical daily routine" },
      { id: "q3", text: "What are their biggest frustrations?", help: "List 3-5 key pain points they experience" },
      { id: "q4", text: "What do they secretly desire?", help: "Think about unspoken wants and aspirations" },
    ],
  },
  {
    id: "dream",
    title: "Dream Outcome",
    questions: [
      { id: "q5", text: "What transformation do you offer?", help: "Before and after state" },
      { id: "q6", text: "What would their life look like after success?", help: "Paint a vivid picture" },
      { id: "q7", text: "What metrics indicate success?", help: "Specific, measurable outcomes" },
      { id: "q8", text: "How long does transformation take?", help: "Realistic timeline" },
    ],
  },
  {
    id: "problems",
    title: "Problems & Obstacles",
    questions: [
      { id: "q9", text: "What external problems do they face?", help: "Tangible, visible challenges" },
      { id: "q10", text: "What internal problems do they experience?", help: "Feelings, emotions, fears" },
      { id: "q11", text: "What philosophical problem exists?", help: "Why is it wrong that they struggle with this?" },
      { id: "q12", text: "What obstacles have stopped them before?", help: "Past failed attempts" },
    ],
  },
  {
    id: "solution",
    title: "Your Solution",
    questions: [
      { id: "q13", text: "How does your solution work?", help: "Simple 3-step explanation" },
      { id: "q14", text: "What makes your approach unique?", help: "Differentiators from competitors" },
      { id: "q15", text: "What is your mechanism of change?", help: "The 'how' behind results" },
      { id: "q16", text: "Why should they trust your solution?", help: "Credibility factors" },
    ],
  },
  {
    id: "voice",
    title: "Brand Voice",
    questions: [
      { id: "q17", text: "If your brand was a person, how would they speak?", help: "Tone, personality, mannerisms" },
      { id: "q18", text: "What words should always be used?", help: "Key brand terminology" },
      { id: "q19", text: "What words should never be used?", help: "Off-brand language" },
      { id: "q20", text: "What emotions should content evoke?", help: "Primary feelings to trigger" },
    ],
  },
  {
    id: "proof",
    title: "Social Proof",
    questions: [
      { id: "q21", text: "What results have clients achieved?", help: "Specific metrics and outcomes" },
      { id: "q22", text: "What testimonials do you have?", help: "Best quotes from happy clients" },
      { id: "q23", text: "What case studies can you share?", help: "Detailed success stories" },
      { id: "q24", text: "What credentials or certifications matter?", help: "Authority markers" },
    ],
  },
  {
    id: "faith",
    title: "Belief Shifts",
    questions: [
      { id: "q25", text: "What false beliefs hold prospects back?", help: "Misconceptions to address" },
      { id: "q26", text: "What do they need to believe to buy?", help: "Required mental shifts" },
      { id: "q27", text: "What objections come up most?", help: "Common resistance points" },
      { id: "q28", text: "How do you overcome skepticism?", help: "Trust-building strategies" },
    ],
  },
  {
    id: "metrics",
    title: "Success Metrics",
    questions: [
      { id: "q29", text: "What KPIs matter most to your clients?", help: "Business metrics they track" },
      { id: "q30", text: "What ROI can clients expect?", help: "Return on investment" },
      { id: "q31", text: "What timeframe produces results?", help: "When do clients see wins" },
      { id: "q32", text: "How do you measure success?", help: "Your success indicators" },
    ],
  },
]

export function ClientQuestionnaire({ clientName }: ClientQuestionnaireProps) {
  const [activeSection, setActiveSection] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0)
  const answeredQuestions = Object.values(answers).filter((a) => a.trim().length > 0).length
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)

  const currentSection = sections[activeSection]

  const handleNext = () => {
    if (activeSection < sections.length - 1) {
      setActiveSection(activeSection + 1)
    }
  }

  const handlePrevious = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1)
    }
  }

  const isSectionComplete = (sectionIndex: number) => {
    const section = sections[sectionIndex]
    return section.questions.every((q) => answers[q.id]?.trim().length > 0)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Section Navigation */}
      <Card className="border-border bg-card h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sections</CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <nav className="space-y-1 px-3 pb-3">
            {sections.map((section, index) => {
              const isComplete = isSectionComplete(index)
              const isActive = index === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border text-xs",
                        isActive ? "border-primary" : "border-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                  {section.title}
                </button>
              )
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Section {activeSection + 1}: {currentSection.title}
              </CardTitle>
              <CardDescription>Complete these questions to help AI understand {clientName}</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSection.questions.map((question, qIndex) => (
            <div key={question.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <Label htmlFor={question.id} className="text-base">
                  Q{activeSection * 4 + qIndex + 1}. {question.text} <span className="text-destructive">*</span>
                </Label>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Help with this question</SheetTitle>
                      <SheetDescription>{question.help}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-medium">Example of a good answer:</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          A detailed, specific response that provides actionable insights for AI content generation.
                          Include concrete examples and metrics where possible.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Example of a weak answer:</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Vague, generic statements that could apply to any business. Avoid one-word answers or industry
                          jargon without explanation.
                        </p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <Textarea
                id={question.id}
                placeholder="Type your answer here..."
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {(answers[question.id] || "").length}/500 characters minimum
              </p>
            </div>
          ))}

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={activeSection === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {activeSection + 1} / {sections.length}
            </span>
            <Button onClick={handleNext} disabled={activeSection === sections.length - 1}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
