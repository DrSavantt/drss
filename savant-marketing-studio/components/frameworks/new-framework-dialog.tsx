"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createFramework } from "@/app/actions/frameworks"
import { useRouter } from "next/navigation"

// ============================================================================
// EXACT v0 CODE - Only form submission wired to real server action
// ============================================================================

interface NewFrameworkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewFrameworkDialog({ open, onOpenChange }: NewFrameworkDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('content', content)
      formData.set('category', category)
      
      const result = await createFramework(formData)
      
      if ('error' in result) {
        alert(result.error)
      } else {
        onOpenChange(false)
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setContent("")
        setCategory("")
        // Trigger refetch
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create framework:', error)
      alert('Failed to create framework')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Framework</DialogTitle>
          <DialogDescription>
            Create a new copywriting framework that will be embedded and used for AI content generation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Framework Name</Label>
              <Input id="name" name="name" placeholder="e.g., AIDA Framework" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copywriting">Copywriting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                  <SelectItem value="funnel">Funnel</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Brief description of this framework" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Framework Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your framework content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                {content.length.toLocaleString()} characters - Will be chunked and embedded for RAG
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Framework"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

