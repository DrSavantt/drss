'use client'

import { useState, useEffect } from 'react'
import { RotateCcw, Check } from 'lucide-react'
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { type QuestionWithHelp } from '@/app/actions/questionnaire-config'

interface QuestionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  question: QuestionWithHelp
  clientName: string
  onSave: (questionId: string, customText: string | null) => void
}

export function QuestionEditorModal({
  isOpen,
  onClose,
  question,
  clientName,
  onSave
}: QuestionEditorModalProps) {
  const [mode, setMode] = useState<'global' | 'custom'>('global')
  const [customText, setCustomText] = useState(question.text)

  // Reset state when question changes
  useEffect(() => {
    setMode('global')
    setCustomText(question.text)
  }, [question])

  const handleSave = () => {
    if (mode === 'global') {
      onSave(question.id, null) // Reset to global
    } else {
      onSave(question.id, customText)
    }
  }

  const handleResetToGlobal = () => {
    setMode('global')
    setCustomText(question.text)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>for {clientName}</DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'global' ? 'secondary' : 'outline'}
              className={cn(
                'flex-1',
                mode === 'global' && 'ring-1 ring-border'
              )}
              onClick={() => setMode('global')}
            >
              Using Global
            </Button>
            <Button
              type="button"
              variant={mode === 'custom' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('custom')}
            >
              Custom
            </Button>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={mode === 'global'}
              rows={3}
              className={cn(
                'resize-none',
                mode === 'global' && 'opacity-60 cursor-not-allowed'
              )}
            />
            {mode === 'global' && (
              <p className="text-xs text-muted-foreground">
                Switch to &quot;Custom&quot; to edit this question for this client
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResetToGlobal}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Global
          </Button>
          <Button type="button" onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
