"use client"

import { useState } from "react"
import {
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  Check,
  Zap,
  Scale,
  Target,
  ChevronDown,
  Mail,
  Megaphone,
  FileText,
  PenTool,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const contentTypes = [
  { value: "email", label: "Email", icon: Mail },
  { value: "ad", label: "Ad Copy", icon: Megaphone },
  { value: "landing", label: "Landing Page", icon: FileText },
  { value: "blog", label: "Blog Post", icon: PenTool },
  { value: "social", label: "Social Media", icon: MessageSquare },
]

const mockClients = [
  { id: "1", name: "Acme Corporation" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "NewCo Industries" },
  { id: "4", name: "Growth Labs" },
]

const quickTemplates = [
  {
    label: "Email Subject Lines",
    prompt:
      "Generate 10 compelling email subject lines for a [product/service] targeting [audience]. Focus on curiosity, urgency, and benefits.",
  },
  {
    label: "Facebook Ad",
    prompt:
      "Write a Facebook ad for [product/service] targeting [audience]. Include a hook, agitate the problem, and present the solution with a clear CTA.",
  },
  {
    label: "Landing Page Hero",
    prompt:
      "Create hero section copy for a landing page selling [product/service]. Include headline, subheadline, and 3 bullet points.",
  },
  {
    label: "Blog Introduction",
    prompt:
      "Write an engaging introduction for a blog post about [topic] that hooks the reader and establishes authority.",
  },
  {
    label: "Social Caption",
    prompt:
      "Create an engaging social media caption for [platform] promoting [product/service] with relevant hashtags.",
  },
]

type ComplexityLevel = "fast" | "balanced" | "best"

const complexityOptions = [
  {
    value: "fast" as ComplexityLevel,
    label: "Fast",
    icon: Zap,
    model: "Gemini Flash / Haiku",
    description: "Quick generations, lower cost",
  },
  {
    value: "balanced" as ComplexityLevel,
    label: "Balanced",
    icon: Scale,
    model: "Claude Sonnet",
    description: "Best balance of speed & quality",
  },
  {
    value: "best" as ComplexityLevel,
    label: "Best",
    icon: Target,
    model: "Claude Opus",
    description: "Highest quality output",
  },
]

export function AIStudio() {
  const [selectedClient, setSelectedClient] = useState("")
  const [contentType, setContentType] = useState("email")
  const [complexity, setComplexity] = useState<ComplexityLevel>("balanced")
  const [prompt, setPrompt] = useState("")
  const [autoSave, setAutoSave] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [copied, setCopied] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleGenerate = async () => {
    if (!selectedClient || !prompt.trim()) return

    setIsGenerating(true)
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setGeneratedContent(`# Black Friday Email Sequence

## Subject Line Options:
1. "You're about to miss out on something big..."
2. "⚡ 48 hours left: Your exclusive deal expires"
3. "We saved the best for last (open now)"

---

## Email Body:

**Preview Text:** This is your final chance to grab our biggest discount of the year.

Hey [First Name],

I'll be honest with you.

When we first created [Product], we never imagined it would help over 10,000 businesses transform their marketing results.

But here we are.

And right now, for the next 48 hours only, you have a chance to join them at our lowest price ever.

**Here's what you'll get:**

✅ Full access to [Product] ($997 value)
✅ Premium support for 12 months ($497 value)  
✅ Exclusive bonus training ($297 value)

**Total Value: $1,791**
**Your Price Today: Just $497**

That's a 72% savings—but only until Friday at midnight.

[CTA BUTTON: Claim Your Discount →]

After Friday, this deal disappears. No exceptions. No extensions.

Click below to secure your spot before it's too late.

Best,
[Signature]

P.S. Remember, this offer expires in 48 hours. Don't let this opportunity slip away.`)

    setIsGenerating(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTemplateClick = (template: string) => {
    setPrompt(template)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Content Studio
        </h1>
        <p className="text-muted-foreground">Generate content powered by your frameworks and client data</p>
      </div>

      {/* Main Interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set up your content generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="grid grid-cols-5 gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all",
                      contentType === type.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    <type.icon className="h-5 w-5" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div className="space-y-2">
              <Label>Complexity</Label>
              <div className="grid grid-cols-3 gap-2">
                {complexityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setComplexity(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-4 transition-all",
                      complexity === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <option.icon
                      className={cn("h-6 w-6", complexity === option.value ? "text-primary" : "text-muted-foreground")}
                    />
                    <span
                      className={cn("font-medium", complexity === option.value ? "text-primary" : "text-foreground")}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.model}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">
                Your Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prompt"
                placeholder="Describe what you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">{prompt.length} characters</p>
            </div>

            {/* Auto-save Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Auto-save to library</Label>
                <p className="text-xs text-muted-foreground">Automatically save generated content</p>
              </div>
              <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedClient || !prompt.trim() || isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Content
                </>
              )}
            </Button>

            {/* Advanced Options */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Advanced Options
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="force-model">Force Specific Model</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto (based on complexity)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (based on complexity)</SelectItem>
                      <SelectItem value="claude-opus">Claude Opus 4</SelectItem>
                      <SelectItem value="claude-sonnet">Claude Sonnet 4</SelectItem>
                      <SelectItem value="claude-haiku">Claude Haiku 4</SelectItem>
                      <SelectItem value="gemini-flash">Gemini 2.0 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Select defaultValue="0.7">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">0.3 - More focused</SelectItem>
                      <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                      <SelectItem value="0.7">0.7 - Creative</SelectItem>
                      <SelectItem value="0.9">0.9 - Very creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Your AI-generated content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedContent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-4 text-muted-foreground">Your AI-generated content will appear here</p>
                <p className="text-sm text-muted-foreground">Select a client and enter a prompt to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Claude Sonnet 4</Badge>
                  <Badge variant="outline" className="text-success border-success/20">
                    $0.0024
                  </Badge>
                  <Badge variant="outline">1,245 tokens</Badge>
                  {autoSave && (
                    <Badge variant="outline" className="text-success border-success/20">
                      <Check className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{generatedContent}</pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  {!autoSave && (
                    <Button variant="outline">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Click a template to pre-fill your prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateClick(template.prompt)}
                className="hover:border-primary/50 hover:text-primary"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
