# QUESTIONNAIRE SYSTEM - COMPLETE COMPONENT TREE TRACE

**Date:** December 28, 2025  
**Purpose:** Map every file that renders the actual questionnaire forms  
**Status:** NO CHANGES MADE - TRACE ONLY

---

## TRACE 1: PUBLIC FORM (/form/[token])

### Entry Point: `app/form/[token]/page.tsx`

**Imports:**
```typescript
import { PublicQuestionnaireForm } from '@/components/questionnaire/public-questionnaire-form'
import { getSections, getQuestionsWithHelp } from '@/app/actions/questionnaire-config'
```

**Renders:**
```tsx
<PublicQuestionnaireForm 
  client={{ id, name, email, intake_responses, user_id }}
  token={token}
  sections={enabledSections}
  questions={enabledQuestions}
/>
```

---

### Level 2: `components/questionnaire/public-questionnaire-form.tsx`

**Imports:**
```typescript
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SectionRenderer } from './section-renderer'
import { Building2, Moon, Sun, Loader2, Check, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
```

**Renders:**
```tsx
<div className="min-h-screen">
  {/* Header with client name + theme toggle */}
  <header>
    <Building2 /> {/* Icon */}
    <h1>Client Questionnaire</h1>
    <Button> {/* Theme toggle */}
      <Sun /> or <Moon />
    </Button>
  </header>

  {/* Progress bar */}
  <Progress value={progressPercent} />

  {/* Section navigation pills */}
  <div className="flex gap-2">
    {transformedSections.map(section => (
      <button key={section.id}>{section.title}</button>
    ))}
  </div>

  {/* Current section content */}
  <AnimatePresence mode="wait">
    <motion.div key={currentSection.id}>
      <SectionRenderer
        section={currentSection}
        formData={flatFormData}
        updateQuestion={updateQuestion}
        markQuestionCompleted={markQuestionCompleted}
        completedQuestions={completedQuestions}
        config={mockConfig}
      />
    </motion.div>
  </AnimatePresence>

  {/* Footer navigation */}
  <div className="fixed bottom-0">
    <Button onClick={goToPreviousSection}>
      <ChevronLeft /> Previous
    </Button>
    <Button onClick={isLastSection ? handleSubmit : goToNextSection}>
      {isLastSection ? 'Submit' : 'Next'} <ChevronRight />
    </Button>
  </div>
</div>
```

---

### Level 3: `components/questionnaire/section-renderer.tsx`

**Imports:**
```typescript
import { QuestionRenderer } from './question-renderer'
import SectionContainer from './sections/section-container'
import { HelpPanel } from './help-system'
import { ConfigHelpContent } from './help-system/config-help-content'
```

**Renders:**
```tsx
<>
  <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
    {currentHelpQuestionId && (
      <ConfigHelpContent questionId={currentHelpQuestionId} config={config} />
    )}
  </HelpPanel>

  <SectionContainer
    sectionNumber={section.id}
    title={section.title}
    description={section.description}
    estimatedTime={`${section.estimatedMinutes} minutes`}
    currentProgress={{ answered, total }}
  >
    {visibleQuestions.map(question => (
      <QuestionRenderer
        key={question.id}
        question={question}
        value={formData[question.id]}
        onChange={(val) => updateQuestion(question.key, val)}
        onBlur={() => markQuestionCompleted(question.key)}
        onHelpClick={() => openHelp(question.id)}
        error={errors[question.id]}
      />
    ))}
  </SectionContainer>
</>
```

---

### Level 4A: `components/questionnaire/sections/section-container.tsx`

**Imports:**
```typescript
import SectionHeader from './section-header'
```

**Renders:**
```tsx
<section id={`section-${sectionNumber}`}>
  <SectionHeader
    sectionNumber={sectionNumber}
    title={title}
    description={description}
    estimatedTime={estimatedTime}
  />

  {/* Progress bar */}
  <div className="mb-4">
    <span>Questions: {answered}/{total}</span>
    <div className="progress-bar">
      <div style={{ width: `${progressPercentage}%` }} />
    </div>
  </div>

  {/* Children (questions) */}
  <div className="space-y-6">
    {children}
  </div>
</section>
```

---

### Level 5A: `components/questionnaire/sections/section-header.tsx`

**Imports:**
```typescript
import { Clock } from 'lucide-react'
```

**Renders:**
```tsx
<div className="mb-6 border-b">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 rounded-full bg-red-primary">
      <span className="text-2xl">{sectionNumber}</span>
    </div>
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-silver">{description}</p>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>⏱️ {estimatedTime}</span>
      </div>
    </div>
  </div>
</div>
```

---

### Level 4B: `components/questionnaire/question-renderer.tsx`

**Imports:**
```typescript
import QuestionWrapper from './question-types/question-wrapper'
import LongTextQuestion from './question-types/long-text-question'
import ShortTextQuestion from './question-types/short-text-question'
import MultipleChoiceQuestion from './question-types/multiple-choice-question'
import { FileUploadQuestion } from './question-types/file-upload-question'
```

**Renders:**
```tsx
<QuestionWrapper
  questionNumber={question.order}
  questionText={question.text}
  isRequired={question.required}
  onHelpClick={onHelpClick}
>
  {/* Renders one of: */}
  {question.type === 'long-text' && <LongTextQuestion {...props} />}
  {question.type === 'short-text' && <ShortTextQuestion {...props} />}
  {question.type === 'multiple-choice' && <MultipleChoiceQuestion {...props} />}
  {question.type === 'checkbox' && <MultipleChoiceQuestion allowMultiple {...props} />}
  {question.type === 'file-upload' && <FileUploadQuestion {...props} />}
</QuestionWrapper>
```

---

### Level 5B: `components/questionnaire/question-types/question-wrapper.tsx`

**Imports:**
```typescript
import { HelpCircle, Clock } from 'lucide-react'
```

**Renders:**
```tsx
<div className="relative bg-[#1a1a1a] border rounded-xl p-6 mb-8">
  {/* Header Row */}
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-lg">
          Q{questionNumber}
        </span>
        {estimatedTime && (
          <span className="text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {estimatedTime}
          </span>
        )}
      </div>
      <p className="text-lg font-medium">
        {questionText}
        {isRequired && <span className="text-red-500">*</span>}
      </p>
    </div>

    {onHelpClick && (
      <button onClick={onHelpClick}>
        <HelpCircle className="w-5 h-5" />
      </button>
    )}
  </div>

  {/* Input Area */}
  <div className="mt-4">
    {children}
  </div>
</div>
```

---

### Level 6: Question Type Components (THE ACTUAL INPUTS)

#### `components/questionnaire/question-types/long-text-question.tsx`

**Imports:**
```typescript
import { AlertCircle } from 'lucide-react'
```

**Renders:**
```tsx
<div className="space-y-2">
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    rows={5}
    className="w-full min-h-[140px] bg-black/50 border rounded-lg p-4 text-white"
  />
  {error && (
    <span className="text-red-500">
      <AlertCircle className="w-3 h-3" />
      {error}
    </span>
  )}
</div>
```

---

#### `components/questionnaire/question-types/short-text-question.tsx`

**Imports:**
```typescript
import { AlertCircle } from 'lucide-react'
```

**Renders:**
```tsx
<div className="space-y-2">
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    className="w-full bg-black/50 border rounded-lg px-4 py-3 text-white"
  />
  {error && (
    <span className="text-red-500">
      <AlertCircle className="w-3 h-3" />
      {error}
    </span>
  )}
</div>
```

---

#### `components/questionnaire/question-types/multiple-choice-question.tsx`

**Imports:**
```typescript
import { Check, AlertCircle } from 'lucide-react'
```

**Renders:**
```tsx
<div className="space-y-3">
  {options.map(option => (
    <button
      key={option.value}
      onClick={() => handleSelect(option.value)}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border ${isSelected ? 'bg-red-500/10 border-red-500' : 'bg-black/30'}`}
    >
      <div className={`w-5 h-5 rounded-${allowMultiple ? 'md' : 'full'} border-2`}>
        {isSelected(option.value) && <Check className="w-3 h-3" />}
      </div>
      <span>{option.label}</span>
    </button>
  ))}
  {error && (
    <div className="text-red-500">
      <AlertCircle className="w-3 h-3" />
      {error}
    </div>
  )}
</div>
```

---

#### `components/questionnaire/question-types/file-upload-question.tsx`

**Imports:**
```typescript
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react'
```

**Renders:**
```tsx
<div className="space-y-4">
  {/* Drop zone */}
  <div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? 'border-red-500' : 'border-border'}`}
  >
    <Upload className="w-12 h-12 mx-auto mb-4" />
    <p>Drag files here or click to browse</p>
    <input
      type="file"
      multiple
      onChange={handleFileInput}
      accept={acceptedTypes.join(',')}
      className="hidden"
    />
  </div>

  {/* Uploaded files list */}
  {value.map(file => (
    <div key={file.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
      {getFileIcon(file.type)}
      <span>{file.name}</span>
      <span className="text-xs">{formatFileSize(file.size)}</span>
      <button onClick={() => removeFile(file.id)}>
        <X className="w-4 h-4" />
      </button>
    </div>
  ))}
</div>
```

---

### Level 4C: `components/questionnaire/help-system/help-panel.tsx`

**Imports:**
```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
```

**Renders:**
```tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="fixed right-0 w-[400px] bg-surface">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Help Guide</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

### Level 5C: `components/questionnaire/help-system/config-help-content.tsx`

**Imports:** None (pure content display)

**Renders:**
```tsx
<div className="space-y-6">
  <h3 className="text-lg font-bold">{question.helpTitle || question.text}</h3>

  {question.helpWhereToFind && (
    <div className="bg-surface p-4 rounded-lg">
      <h4 className="font-semibold">📍 WHERE TO FIND THIS</h4>
      <ul>
        {question.helpWhereToFind.map(item => <li>• {item}</li>)}
      </ul>
    </div>
  )}

  {question.helpHowToExtract && (
    <div className="bg-surface p-4 rounded-lg">
      <h4 className="font-semibold">🔍 HOW TO EXTRACT IT</h4>
      <ul>
        {question.helpHowToExtract.map(item => <li>• {item}</li>)}
      </ul>
    </div>
  )}

  {question.helpGoodExample && (
    <div className="bg-green-500/10 border-l-4 border-green-500 p-3">
      <h4 className="font-semibold text-green-600">✅ GOOD ANSWER</h4>
      <p>{question.helpGoodExample}</p>
    </div>
  )}

  {question.helpWeakExample && (
    <div className="bg-red-500/10 border-l-4 border-red-500 p-3">
      <h4 className="font-semibold text-red-600">❌ WEAK ANSWER</h4>
      <p>{question.helpWeakExample}</p>
    </div>
  )}

  {question.helpQuickTip && (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3">
      <h4 className="font-semibold text-yellow-600">💡 QUICK TIP</h4>
      <p>{question.helpQuickTip}</p>
    </div>
  )}
</div>
```

---

## PUBLIC FORM COMPONENT TREE (VISUAL)

```
app/form/[token]/page.tsx (Entry)
└── components/questionnaire/public-questionnaire-form.tsx
    ├── @/components/ui/button (Button - multiple instances)
    ├── @/components/ui/progress (Progress)
    ├── lucide-react (Icons: Building2, Moon, Sun, Loader2, Check, Circle, ChevronLeft, ChevronRight)
    ├── framer-motion (motion.div, AnimatePresence)
    │
    └── components/questionnaire/section-renderer.tsx
        ├── components/questionnaire/help-system/help-panel.tsx
        │   ├── framer-motion (motion.div, AnimatePresence)
        │   ├── lucide-react (X)
        │   └── components/questionnaire/help-system/config-help-content.tsx
        │       └── [Pure content display - no sub-components]
        │
        └── components/questionnaire/sections/section-container.tsx
            ├── components/questionnaire/sections/section-header.tsx
            │   └── lucide-react (Clock)
            │
            └── components/questionnaire/question-renderer.tsx (multiple instances)
                ├── components/questionnaire/question-types/question-wrapper.tsx
                │   └── lucide-react (HelpCircle, Clock)
                │
                └── [One of these based on question.type:]
                    ├── components/questionnaire/question-types/long-text-question.tsx
                    │   ├── lucide-react (AlertCircle)
                    │   └── <textarea> ← ACTUAL INPUT
                    │
                    ├── components/questionnaire/question-types/short-text-question.tsx
                    │   ├── lucide-react (AlertCircle)
                    │   └── <input type="text"> ← ACTUAL INPUT
                    │
                    ├── components/questionnaire/question-types/multiple-choice-question.tsx
                    │   ├── lucide-react (Check, AlertCircle)
                    │   └── <button> (multiple) ← ACTUAL INPUT
                    │
                    └── components/questionnaire/question-types/file-upload-question.tsx
                        ├── lucide-react (Upload, X, FileText, Image, File)
                        └── <input type="file"> ← ACTUAL INPUT
```

---

## TRACE 2: ADMIN FORM (/dashboard/clients/onboarding/[id])

### Entry Point: `app/dashboard/clients/onboarding/[id]/layout.tsx`

**Imports:**
```typescript
import { QuestionnaireConfigProvider } from '@/lib/questionnaire/questionnaire-config-context'
```

**Renders:**
```tsx
<QuestionnaireConfigProvider>
  {children}
</QuestionnaireConfigProvider>
```

---

### Level 2: `app/dashboard/clients/onboarding/[id]/page.tsx`

**Imports:**
```typescript
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper'
import { RichFooter } from '@/components/questionnaire/navigation/rich-footer'
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form'
import { QuestionnaireReview } from '@/components/questionnaire/review'
import { SectionRenderer } from '@/components/questionnaire/section-renderer'
import { useQuestionnaireConfig } from '@/lib/questionnaire/questionnaire-config-context'
import { Info, Loader2, Check, AlertCircle } from 'lucide-react'
import { CopyableCode } from '@/components/copyable-code'
```

**Renders:**
```tsx
<div className="min-h-screen bg-background pb-24">
  {/* Top Progress Stepper */}
  <ProgressStepper
    currentSection={currentSection}
    completedSections={completedSections}
    onSectionClick={handleStepClick}
    config={config}
  />

  {/* Main Content */}
  <main className="max-w-3xl mx-auto px-4 py-8">
    {loading ? (
      <Loader2 className="animate-spin" />
    ) : !showReview ? (
      <>
        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4" />
            You are editing existing responses
          </div>
        )}

        {/* Client Code + Header */}
        <div className="mb-8">
          {clientCode && <CopyableCode code={clientCode} />}
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Responses' : 'Onboarding'}
          </h1>
          
          {/* Auto-Save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <><Loader2 /> Saving...</>}
            {saveStatus === 'saved' && <><Check /> Saved</>}
            {saveStatus === 'error' && <><AlertCircle /> Save failed</>}
          </div>
        </div>

        {/* Config-driven section rendering */}
        {currentSectionConfig && (
          <SectionRenderer
            section={currentSectionConfig}
            formData={flatFormDataTyped}
            updateQuestion={updateQuestion}
            markQuestionCompleted={markQuestionCompleted}
            completedQuestions={completedQuestions}
            config={config}
          />
        )}
      </>
    ) : (
      <QuestionnaireReview clientId={clientId} mode={mode} />
    )}
  </main>

  {/* Bottom Navigation Footer */}
  {!showReview && (
    <RichFooter
      clientId={clientId}
      currentSection={currentSection}
      onPrevious={handlePrevious}
      onNext={handleNext}
      saveStatus={saveStatus}
      isLastSection={isLastSection}
      config={config}
    />
  )}
</div>
```

---

### Level 3A: `components/questionnaire/navigation/progress-stepper.tsx`

**Imports:**
```typescript
import { Check } from 'lucide-react'
import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context'
```

**Renders:**
```tsx
<div className="w-full bg-surface border-b">
  <div className="max-w-5xl mx-auto px-4 py-6">
    {/* Mobile: Horizontal scroll pills */}
    <div className="block lg:hidden">
      <div className="overflow-x-auto flex gap-2">
        {sections.map(section => (
          <button
            key={section.number}
            onClick={() => onSectionClick(section.number)}
            className={`px-3 py-2 rounded-lg ${isCompleted ? 'bg-green-500/10' : isCurrent ? 'bg-red-primary' : 'bg-surface-highlight'}`}
          >
            {isCompleted && <Check className="w-4 h-4" />}
            <span>{section.name}</span>
          </button>
        ))}
      </div>
      <div className="text-center mt-3">
        Step {currentPosition} of {totalSections}
      </div>
    </div>

    {/* Desktop: Full stepper track */}
    <div className="hidden lg:block">
      <div className="flex items-center justify-between">
        {sections.map((section, index) => (
          <>
            <button onClick={() => onSectionClick(section.number)}>
              <div className={`w-10 h-10 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-red-primary' : 'border-2'}`}>
                {isCompleted ? <Check /> : <span>{section.number}</span>}
              </div>
              <span className="mt-2 text-xs">{section.name}</span>
            </button>
            {index < sections.length - 1 && (
              <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-mid-gray'}`} />
            )}
          </>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

### Level 3B: `components/questionnaire/navigation/rich-footer.tsx`

**Imports:**
```typescript
import { ChevronLeft, ChevronRight, Check, Loader2, Circle, RotateCcw } from 'lucide-react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, ... } from '@/components/ui/alert-dialog'
import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context'
```

**Renders:**
```tsx
<footer className="fixed bottom-0 left-0 right-0 z-50">
  <div className="bg-surface/95 backdrop-blur-xl border-t">
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="flex items-center justify-center gap-4 mb-3">
          {saveStatus === 'saving' && <><Loader2 /> Saving...</>}
          {saveStatus === 'saved' && <><Check /> Saved</>}
          {saveStatus === 'idle' && <><Circle /> Draft</>}
          <span>Step {currentPosition}/{totalSections}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onPrevious} disabled={isFirstSection}>
            <ChevronLeft /> Previous
          </button>
          <button onClick={onNext}>
            {isLastSection ? 'Review' : 'Next'} <ChevronRight />
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-3 items-center gap-4">
        <button onClick={onPrevious}>
          <ChevronLeft /> Previous
          {previousName && <span className="text-xs">{previousName}</span>}
        </button>
        
        <div className="flex flex-col items-center">
          <span>Step {currentPosition} of {totalSections}</span>
          <div className="flex items-center gap-3">
            {/* Save status indicators */}
            <AlertDialog>
              <button className="flex items-center gap-1">
                <RotateCcw /> Reset
              </button>
              <AlertDialogContent>
                {/* Reset confirmation dialog */}
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <button onClick={onNext}>
          {isLastSection ? 'Review' : 'Next'} <ChevronRight />
          {nextName && <span className="text-xs">{nextName}</span>}
        </button>
      </div>
    </div>
  </div>
</footer>
```

---

### Level 3C: `components/questionnaire/review/questionnaire-review.tsx`

**Imports:**
```typescript
import { Loader2 } from 'lucide-react'
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form'
import { saveQuestionnaire } from '@/app/actions/questionnaire'
import ReviewSectionCard from './review-section-card'
```

**Renders:**
```tsx
<div className="max-w-4xl mx-auto p-8">
  <div className="mb-8">
    <h1 className="text-3xl font-bold">Review Your Answers</h1>
    <p className="text-silver">Review all responses before submitting</p>
  </div>

  {/* Progress */}
  <div className="mb-8 p-6 bg-surface rounded-lg">
    <span>Overall Progress</span>
    <span className="text-2xl font-bold">{progress}%</span>
    <div className="w-full bg-surface-highlight rounded-full h-3">
      <div className="bg-red-primary h-3 rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>

  {/* All sections */}
  <div className="space-y-4 mb-8">
    <ReviewSectionCard
      sectionNumber={1}
      title="Avatar Definition"
      questions={formData.avatar_definition}
      questionKeys={['q1', 'q2', 'q3', 'q4', 'q5']}
      requiredQuestions={REQUIRED_QUESTIONS}
      completedQuestions={completedQuestions}
      onEdit={() => handleEditSection(1)}
    />
    {/* ... 7 more ReviewSectionCard components */}
  </div>

  {/* Submit button */}
  <button onClick={handleSubmit} disabled={submitting || progress < 100}>
    {submitting && <Loader2 className="animate-spin" />}
    {submitting ? 'Submitting...' : 'Submit Questionnaire'}
  </button>
</div>
```

---

### Level 3D: `components/questionnaire/section-renderer.tsx`

**NOTE:** This is THE SAME component used in the public form. See TRACE 1 for details.

---

## ADMIN FORM COMPONENT TREE (VISUAL)

```
app/dashboard/clients/onboarding/[id]/layout.tsx (Entry)
└── lib/questionnaire/questionnaire-config-context.tsx (QuestionnaireConfigProvider)
    └── app/dashboard/clients/onboarding/[id]/page.tsx
        ├── components/questionnaire/navigation/progress-stepper.tsx
        │   └── lucide-react (Check)
        │
        ├── lucide-react (Info, Loader2, Check, AlertCircle)
        ├── components/copyable-code.tsx (CopyableCode)
        │
        ├── components/questionnaire/section-renderer.tsx [SHARED WITH PUBLIC]
        │   └── [See PUBLIC FORM TREE above for full breakdown]
        │
        ├── components/questionnaire/review/questionnaire-review.tsx
        │   ├── lucide-react (Loader2)
        │   └── components/questionnaire/review/review-section-card.tsx (multiple)
        │
        └── components/questionnaire/navigation/rich-footer.tsx
            ├── lucide-react (ChevronLeft, ChevronRight, Check, Loader2, Circle, RotateCcw)
            └── @/components/ui/alert-dialog (AlertDialog, AlertDialogContent, etc.)
```

---

## TRACE 3: CUSTOMIZE POPUP

### Entry Point: `components/questionnaire/share-questionnaire-popup.tsx`

**Imports:**
```typescript
import { ChevronDown, ChevronRight, Pencil, Copy, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { QuestionEditorModal } from './question-editor-modal'
```

**Renders:**
```tsx
<>
  <Dialog open={isOpen} onOpenChange={handleOpenChange}>
    <DialogContent className="max-w-2xl max-h-[85vh]">
      <DialogHeader>
        <DialogTitle>Customize Questionnaire</DialogTitle>
        <DialogDescription>for {clientName}</DialogDescription>
      </DialogHeader>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <div className="space-y-2">
            {sections.map(section => (
              <div key={section.id} className="border rounded-lg">
                {/* Section Header */}
                <div className="flex items-center gap-3 p-3 bg-muted/50">
                  <Checkbox
                    checked={section.enabled}
                    onCheckedChange={(checked) => handleSectionToggle(section, !!checked)}
                  />
                  <button onClick={() => toggleSection(section.id)}>
                    <span className={section.enabled ? '' : 'line-through'}>
                      {section.title}
                    </span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Questions */}
                {expandedSections.has(section.id) && section.enabled && (
                  <div className="border-t divide-y">
                    {section.questions.map(question => (
                      <div key={question.id} className="flex items-center gap-3 p-3">
                        <Checkbox
                          checked={question.enabled}
                          onCheckedChange={(checked) => handleQuestionToggle(question, section.id, !!checked)}
                        />
                        <div className="flex-1">
                          <p className={question.enabled ? '' : 'line-through'}>
                            {question.text}
                          </p>
                          {question._hasOverride && (
                            <span className="text-xs text-warning">Custom</span>
                          )}
                        </div>
                        <Button onClick={() => handleQuestionEdit(question)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={saveAndCopyLink} disabled={isSaving || pendingChanges.size === 0}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Copy />}
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
```

---

### Level 2: `components/questionnaire/question-editor-modal.tsx`

**Imports:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
```

**Renders:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Question</DialogTitle>
      <DialogDescription>Customize question for {clientName}</DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="original">Original Question</Label>
        <p className="text-sm text-muted-foreground">{question.text}</p>
      </div>

      <div>
        <Label htmlFor="custom">Custom Question Text (optional)</Label>
        <Textarea
          id="custom"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Leave empty to use original text"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          If provided, this text will be shown instead of the original question
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={() => onSave(question.id, customText || null)}>
        Save Custom Text
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## CUSTOMIZE POPUP COMPONENT TREE (VISUAL)

```
components/questionnaire/share-questionnaire-popup.tsx (Entry)
├── lucide-react (ChevronDown, ChevronRight, Pencil, Copy, Loader2)
├── @/components/ui/dialog (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
├── @/components/ui/button (Button - multiple instances)
├── @/components/ui/checkbox (Checkbox - multiple instances)
│
└── components/questionnaire/question-editor-modal.tsx
    ├── @/components/ui/dialog (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
    ├── @/components/ui/button (Button - multiple instances)
    ├── @/components/ui/textarea (Textarea)
    ├── @/components/ui/label (Label)
    └── [No actual form inputs - just displays checkboxes and text]
```

---

## COMPLETE FILE LIST

### Files That Render Questionnaire Forms

| File | Used In | Purpose | Type |
|------|---------|---------|------|
| **ENTRY POINTS** ||||
| `app/form/[token]/page.tsx` | Public | Public form route | Page |
| `app/dashboard/clients/onboarding/[id]/layout.tsx` | Admin | Context provider wrapper | Layout |
| `app/dashboard/clients/onboarding/[id]/page.tsx` | Admin | Admin form route | Page |
| `components/questionnaire/share-questionnaire-popup.tsx` | Customize | Popup modal | Component |
| **MAIN FORM COMPONENTS** ||||
| `components/questionnaire/public-questionnaire-form.tsx` | Public | Public form main component | Component |
| `components/questionnaire/section-renderer.tsx` | Public, Admin | Renders section with questions | Component |
| `components/questionnaire/question-renderer.tsx` | Public, Admin | Routes question to type component | Component |
| **QUESTION TYPE COMPONENTS (THE ACTUAL INPUTS)** ||||
| `components/questionnaire/question-types/question-wrapper.tsx` | Public, Admin | Wraps all question types | Component |
| `components/questionnaire/question-types/long-text-question.tsx` | Public, Admin | **TEXTAREA INPUT** | Component |
| `components/questionnaire/question-types/short-text-question.tsx` | Public, Admin | **TEXT INPUT** | Component |
| `components/questionnaire/question-types/multiple-choice-question.tsx` | Public, Admin | **RADIO/CHECKBOX INPUT** | Component |
| `components/questionnaire/question-types/file-upload-question.tsx` | Public, Admin | **FILE INPUT** | Component |
| **SECTION COMPONENTS** ||||
| `components/questionnaire/sections/section-container.tsx` | Public, Admin | Section layout wrapper | Component |
| `components/questionnaire/sections/section-header.tsx` | Public, Admin | Section header display | Component |
| `components/questionnaire/sections/section-header-card.tsx` | (Unused) | Alternative section header | Component |
| **HELP SYSTEM** ||||
| `components/questionnaire/help-system/help-panel.tsx` | Public, Admin | Help sidebar panel | Component |
| `components/questionnaire/help-system/config-help-content.tsx` | Public, Admin | Help content display | Component |
| **NAVIGATION (ADMIN ONLY)** ||||
| `components/questionnaire/navigation/progress-stepper.tsx` | Admin | Top progress bar | Component |
| `components/questionnaire/navigation/rich-footer.tsx` | Admin | Bottom navigation footer | Component |
| **REVIEW (ADMIN ONLY)** ||||
| `components/questionnaire/review/questionnaire-review.tsx` | Admin | Review step main component | Component |
| `components/questionnaire/review/review-section-card.tsx` | Admin | Review section card | Component |
| **CUSTOMIZE POPUP** ||||
| `components/questionnaire/question-editor-modal.tsx` | Customize | Edit question text modal | Component |
| **UI COMPONENTS** ||||
| `components/ui/button.tsx` | All | Button component | UI |
| `components/ui/progress.tsx` | Public | Progress bar | UI |
| `components/ui/dialog.tsx` | Customize | Dialog/modal | UI |
| `components/ui/checkbox.tsx` | Customize | Checkbox input | UI |
| `components/ui/textarea.tsx` | Customize | Textarea input | UI |
| `components/ui/label.tsx` | Customize | Form label | UI |
| `components/ui/alert-dialog.tsx` | Admin | Alert dialog | UI |
| **CONTEXT/HOOKS** ||||
| `lib/questionnaire/questionnaire-config-context.tsx` | Admin | React Context for config | Context |
| `lib/questionnaire/use-questionnaire-form.ts` | Admin | Form state hook | Hook |
| **UTILITIES** ||||
| `components/copyable-code.tsx` | Admin | Copyable code display | Component |

---

## SHARED vs UNIQUE FILES

### Files Used by BOTH Public and Admin Forms

**Core Rendering:**
- `components/questionnaire/section-renderer.tsx`
- `components/questionnaire/question-renderer.tsx`
- `components/questionnaire/question-types/question-wrapper.tsx`
- `components/questionnaire/question-types/long-text-question.tsx`
- `components/questionnaire/question-types/short-text-question.tsx`
- `components/questionnaire/question-types/multiple-choice-question.tsx`
- `components/questionnaire/question-types/file-upload-question.tsx`

**Section Components:**
- `components/questionnaire/sections/section-container.tsx`
- `components/questionnaire/sections/section-header.tsx`

**Help System:**
- `components/questionnaire/help-system/help-panel.tsx`
- `components/questionnaire/help-system/config-help-content.tsx`

**Total Shared:** 11 files

---

### Files ONLY Used by Public Form

- `app/form/[token]/page.tsx`
- `app/form/[token]/layout.tsx`
- `components/questionnaire/public-questionnaire-form.tsx`

**Total Public-Only:** 3 files

---

### Files ONLY Used by Admin Form

**Pages:**
- `app/dashboard/clients/onboarding/[id]/page.tsx`
- `app/dashboard/clients/onboarding/[id]/layout.tsx`

**Navigation:**
- `components/questionnaire/navigation/progress-stepper.tsx`
- `components/questionnaire/navigation/rich-footer.tsx`

**Review:**
- `components/questionnaire/review/questionnaire-review.tsx`
- `components/questionnaire/review/review-section-card.tsx`

**Context/Hooks:**
- `lib/questionnaire/questionnaire-config-context.tsx`
- `lib/questionnaire/use-questionnaire-form.ts`

**Utilities:**
- `components/copyable-code.tsx`

**UI:**
- `components/ui/alert-dialog.tsx`

**Total Admin-Only:** 10 files

---

### Files ONLY Used by Customize Popup

- `components/questionnaire/share-questionnaire-popup.tsx`
- `components/questionnaire/question-editor-modal.tsx`

**UI Components:**
- `components/ui/dialog.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/textarea.tsx`
- `components/ui/label.tsx`

**Total Customize-Only:** 6 files

---

## THE ACTUAL INPUT ELEMENTS

These are the ONLY files that render actual HTML form inputs:

| File | Input Type | HTML Element |
|------|------------|--------------|
| `components/questionnaire/question-types/long-text-question.tsx` | Long text | `<textarea>` |
| `components/questionnaire/question-types/short-text-question.tsx` | Short text | `<input type="text">` |
| `components/questionnaire/question-types/multiple-choice-question.tsx` | Radio/Checkbox | `<button>` (styled) |
| `components/questionnaire/question-types/file-upload-question.tsx` | File upload | `<input type="file">` |

**Everything else is layout, navigation, or display.**

---

## SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| **Total Files** | 29+ (excluding UI primitives) |
| **Shared Files** | 11 |
| **Public-Only Files** | 3 |
| **Admin-Only Files** | 10 |
| **Customize-Only Files** | 6 |
| **Actual Input Files** | 4 |
| **UI Primitive Files** | 7 |

---

## KEY INSIGHTS

1. **The actual form inputs are in ONLY 4 files** - everything else is wrapper components

2. **SectionRenderer is the hub** - both forms use this to render questions

3. **Public form is simpler** - fewer UI components, no context provider

4. **Admin form is feature-rich** - progress stepper, rich footer, auto-save, review step

5. **Customize popup doesn't render forms** - it just shows checkboxes for enable/disable

6. **11 files are shared** between public and admin forms

7. **QuestionRenderer routes to the correct input type** - it's the dispatcher

8. **QuestionWrapper standardizes layout** - all questions have same visual structure

---

## END OF TRACE

**No changes made to codebase.**  
**This is a pure audit documenting the component hierarchy.**



