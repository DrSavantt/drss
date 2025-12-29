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

interface NewFrameworkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewFrameworkDialog({ open, onOpenChange }: NewFrameworkDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
              <Input id="name" placeholder="e.g., AIDA Framework" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select required>
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
              <Input id="description" placeholder="Brief description of this framework" required />
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
