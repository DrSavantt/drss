'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Sparkles,
  Search,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Scale,
  Target,
  ChevronDown,
  History,
  ExternalLink,
  BookOpen,
  Brain,
  FileText,
  Layers,
  ArrowRight,
  Clock,
  User,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getClientsForDropdown } from "@/app/actions/ai"
import { performDeepResearch, getRecentResearch, saveResearchToClient, ResearchResult } from "@/app/actions/research"

// Research depth options
const depthOptions = [
  {
    value: "quick" as const,
    label: "Quick",
    icon: Zap,
    description: "Fast, key insights only",
    time: "~30 seconds",
  },
  {
    value: "standard" as const,
    label: "Standard",
    icon: Scale,
    description: "Balanced depth & speed",
    time: "~1 minute",
  },
  {
    value: "comprehensive" as const,
    label: "Comprehensive",
    icon: Target,
    description: "Full analysis & strategy",
    time: "~2 minutes",
  },
]

// Research phases for progress
const researchPhases = [
  { key: "initializing", label: "Initializing", icon: Brain },
  { key: "searching_frameworks", label: "Searching Frameworks", icon: BookOpen },
  { key: "gathering_client_data", label: "Gathering Client Data", icon: User },
  { key: "generating_report", label: "Generating Report", icon: FileText },
  { key: "complete", label: "Complete", icon: Check },
]

// Quick research templates
const quickTemplates = [
  {
    label: "Audience Analysis",
    prompt: "Analyze the target audience for [product/service]. Include demographics, psychographics, pain points, and buying behavior patterns.",
  },
  {
    label: "Competitive Landscape",
    prompt: "Research the competitive landscape for [industry/niche]. Identify top 5 competitors, their positioning, strengths, weaknesses, and opportunities for differentiation.",
  },
  {
    label: "Content Strategy",
    prompt: "Develop a content strategy framework for [business type]. Include content pillars, formats, channels, and a sample content calendar approach.",
  },
  {
    label: "Email Campaign Ideas",
    prompt: "Research and recommend email marketing campaign strategies for [goal]. Include sequence types, subject line approaches, and conversion optimization tactics.",
  },
  {
    label: "Social Media Trends",
    prompt: "Research current social media trends and best practices for [industry]. Include platform-specific recommendations and content ideas.",
  },
  {
    label: "Sales Funnel Optimization",
    prompt: "Analyze and recommend improvements for a [type] sales funnel. Include stage-by-stage optimization tactics and conversion rate benchmarks.",
  },
]

interface HistoryItem {
  id: string;
  topic: string;
  report: string;
  modelUsed: string;
  tokens: number;
  cost: number;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
}

export default function DeepResearchPage() {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClient, setSelectedClient] = useState("none")
  const [topic, setTopic] = useState("")
  const [depth, setDepth] = useState<"quick" | "standard" | "comprehensive">("standard")
  const [isResearching, setIsResearching] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<number>(0)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveClientId, setSaveClientId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Fetch clients on mount
  useEffect(() => {
    async function loadClients() {
      const clientList = await getClientsForDropdown()
      setClients(clientList)
    }
    loadClients()
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const data = await getRecentResearch(10)
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleResearch = async () => {
    if (!topic.trim()) return

    setIsResearching(true)
    setCurrentPhase(0)
    setResult(null)

    // Simulate phase progression for UX
    const phaseInterval = setInterval(() => {
      setCurrentPhase(prev => Math.min(prev + 1, 3))
    }, 1500)

    try {
      const researchResult = await performDeepResearch({
        topic,
        clientId: selectedClient === "none" ? undefined : selectedClient,
        depth,
      })

      clearInterval(phaseInterval)
      setCurrentPhase(4) // Complete
      setResult(researchResult)
      loadHistory()
    } catch (error) {
      clearInterval(phaseInterval)
      console.error('Research failed:', error)
      alert(error instanceof Error ? error.message : 'Research failed')
    } finally {
      setIsResearching(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTemplateClick = (template: string) => {
    setTopic(template)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setTopic(item.topic)
    setResult({
      report: item.report,
      modelUsed: item.modelUsed,
      cost: item.cost,
      inputTokens: 0,
      outputTokens: item.tokens,
      frameworksUsed: [],
      clientContext: item.clientName ? {
        name: item.clientName,
        hasIntakeData: false,
        hasBrandData: false,
      } : undefined,
    })
    if (item.clientId) {
      setSelectedClient(item.clientId)
    }
  }

  const handleSaveToClient = async () => {
    if (!result || !saveClientId) return
    
    setIsSaving(true)
    try {
      await saveResearchToClient(result.report, topic, saveClientId, {
        model_used: result.modelUsed,
        cost_usd: result.cost,
        depth,
      })
      setSaveModalOpen(false)
      alert('Research saved to client library!')
    } catch (error) {
      alert('Failed to save research')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Search className="h-8 w-8 text-primary" />
          Deep Research
        </h1>
        <p className="text-muted-foreground">AI-powered research using your frameworks and client context</p>
      </div>

      {/* Main Interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Research Configuration
            </CardTitle>
            <CardDescription>Define your research topic and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="client">Client Context (Optional)</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Research without client context..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client - General research</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a client to include their brand data and intake responses in the research
              </p>
            </div>

            {/* Research Depth */}
            <div className="space-y-2">
              <Label>Research Depth</Label>
              <div className="grid grid-cols-3 gap-2">
                {depthOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDepth(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-4 transition-all",
                      depth === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <option.icon
                      className={cn("h-6 w-6", depth === option.value ? "text-primary" : "text-muted-foreground")}
                    />
                    <span
                      className={cn("font-medium", depth === option.value ? "text-primary" : "text-foreground")}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">{option.description}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {option.time}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Research Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">
                Research Topic <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="topic"
                placeholder="What do you want to research? Be specific for better results...

Example: Analyze the best email marketing strategies for SaaS companies targeting enterprise clients, focusing on onboarding sequences and reducing churn."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">{topic.length} characters</p>
            </div>

            {/* Start Research Button */}
            <Button
              onClick={handleResearch}
              disabled={!topic.trim() || isResearching}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isResearching ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Research
                </>
              )}
            </Button>

            {/* Research Progress */}
            {isResearching && (
              <div className="space-y-3 pt-2">
                <Label className="text-sm text-muted-foreground">Research Progress</Label>
                <div className="space-y-2">
                  {researchPhases.slice(0, 4).map((phase, index) => (
                    <div
                      key={phase.key}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-all",
                        currentPhase > index
                          ? "border-primary/30 bg-primary/5"
                          : currentPhase === index
                          ? "border-primary bg-primary/10"
                          : "border-border opacity-50"
                      )}
                    >
                      {currentPhase > index ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : currentPhase === index ? (
                        <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <phase.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm",
                        currentPhase >= index ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {phase.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Research Results
            </CardTitle>
            <CardDescription>Your AI-generated research report</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-4 text-muted-foreground">Your research report will appear here</p>
                <p className="text-sm text-muted-foreground">Enter a topic and click Start Research</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{result.modelUsed}</Badge>
                  <Badge variant="outline" className="text-success border-success/20">
                    ${result.cost.toFixed(4)}
                  </Badge>
                  <Badge variant="outline">{result.inputTokens + result.outputTokens} tokens</Badge>
                  {result.frameworksUsed.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {result.frameworksUsed.length} frameworks
                    </Badge>
                  )}
                  {result.clientContext && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {result.clientContext.name}
                    </Badge>
                  )}
                  {result.savedAssetId && (
                    <Badge variant="outline" className="text-success border-success/20">
                      <Check className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>

                {/* Report Content */}
                <div className="rounded-lg border border-border bg-background p-4 max-h-[500px] overflow-y-auto">
                  <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                    <div 
                      className="whitespace-pre-wrap font-sans text-sm text-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: result.report
                          .replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-6 mb-3 text-primary">$1</h2>')
                          .replace(/### (.*)/g, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
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
                  
                  {!result.savedAssetId && (
                    <Button variant="outline" onClick={() => setSaveModalOpen(true)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Client
                    </Button>
                  )}

                  <Button variant="outline" onClick={handleResearch} disabled={isResearching}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isResearching && "animate-spin")} />
                    Regenerate
                  </Button>

                  <Link href="/dashboard/ai/generate">
                    <Button className="bg-primary hover:bg-primary/90">
                      Generate Content
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Research Templates
          </CardTitle>
          <CardDescription>Click a template to pre-fill your research topic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateClick(template.prompt)}
                className="hover:border-primary/50 hover:text-primary h-auto py-2 text-center"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Research History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Research History
              </CardTitle>
              <CardDescription>Your recent research sessions</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              {showHistory ? 'Hide' : 'Show'}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")} />
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No research history yet</p>
                <p className="text-sm">Your research sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate mb-1">
                          {item.topic.substring(0, 80)}
                          {item.topic.length > 80 && '...'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {item.modelUsed}
                          </Badge>
                          {item.clientName && (
                            <>
                              <span>•</span>
                              <span>{item.clientName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(item.createdAt || '').toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{item.tokens} tokens</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-success border-success/20 shrink-0">
                        ${item.cost.toFixed(4)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Save Research to Client</CardTitle>
              <CardDescription>Select a client to save this research report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={saveClientId} onValueChange={setSaveClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveToClient} 
                  disabled={!saveClientId || isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

