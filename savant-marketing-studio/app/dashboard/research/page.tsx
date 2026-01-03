'use client'

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Send,
  Settings2,
  ChevronDown,
  Check,
  Zap,
  Target,
  Brain,
  ClipboardList,
  Pencil,
  Play,
  Loader2,
  Clock,
  CheckCircle,
  FileText,
  Save,
  Plus,
  ExternalLink,
  Sparkles,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/sanitize-html"
import { performDeepResearch, generateResearchPlan, type ResearchResult } from "@/app/actions/research"
import { createGoogleDoc } from "@/app/actions/google-docs"
import { getClientsForDropdown } from "@/app/actions/ai"

type ResearchPhase = 'idle' | 'planning' | 'plan-ready' | 'researching' | 'complete'
type ResearchMode = 'quick' | 'standard' | 'comprehensive'

interface LiveUpdate {
  text: string
  status: 'complete' | 'loading' | 'pending'
}

interface ResearchPlan {
  items: string[]
  estimatedTime: string
  estimatedSources: string
}

export default function DeepResearchPage() {
  const [phase, setPhase] = useState<ResearchPhase>('idle')
  const [mode, setMode] = useState<ResearchMode>('standard')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<ResearchPlan | null>(null)
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([])
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ResearchResult | null>(null)
  
  // Track intervals and timeouts for cleanup
  const intervalsRef = useRef<{ progress?: NodeJS.Timeout; update?: NodeJS.Timeout }>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
      if (intervalsRef.current.update) clearInterval(intervalsRef.current.update)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleStartPlanning = async () => {
    if (!query.trim()) return
    
    setPhase('planning')
    
    try {
      const planResult = await generateResearchPlan(query, mode)
      setPlan(planResult)
      setPhase('plan-ready')
    } catch (error) {
      console.error('Planning failed:', error)
      alert('Failed to generate plan. Please try again.')
      setPhase('idle')
    }
  }

  const handleStartResearch = async () => {
    setPhase('researching')
    setProgress(0)
    setLiveUpdates([])

    // Simulate live updates for UX
    const updates: LiveUpdate[] = [
      { text: 'Initializing research...', status: 'loading' },
      { text: 'Generating search queries...', status: 'pending' },
      { text: 'Searching the web...', status: 'pending' },
      { text: 'Analyzing sources...', status: 'pending' },
      { text: 'Synthesizing findings...', status: 'pending' },
    ]

    setLiveUpdates(updates)

    // Simulate progress - store interval for cleanup
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 500)
    intervalsRef.current.progress = progressInterval

    // Update statuses - store interval for cleanup
    const updateInterval = setInterval(() => {
      setLiveUpdates(prev => {
        const nextLoading = prev.findIndex(u => u.status === 'loading')
        if (nextLoading >= 0 && nextLoading < prev.length - 1) {
          return prev.map((u, i) => 
            i === nextLoading 
              ? { ...u, status: 'complete' }
              : i === nextLoading + 1
              ? { ...u, status: 'loading' }
              : u
          )
        }
        return prev
      })
    }, 1500)
    intervalsRef.current.update = updateInterval

    try {
      const researchResult = await performDeepResearch({
        topic: query,
        depth: mode,
        useWebSearch: true,
      })

      clearInterval(progressInterval)
      clearInterval(updateInterval)
      intervalsRef.current = {}
      
      setProgress(100)
      setLiveUpdates(prev => prev.map(u => ({ ...u, status: 'complete' })))
      
      // Store timeout for cleanup
      timeoutRef.current = setTimeout(() => {
        setResult(researchResult)
        setPhase('complete')
        timeoutRef.current = null
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      clearInterval(updateInterval)
      intervalsRef.current = {}
      console.error('Research failed:', error)
      alert(error instanceof Error ? error.message : 'Research failed')
      setPhase('idle')
    }
  }

  const handleExportGoogleDocs = async () => {
    if (!result) return
    
    try {
      // Copy content to clipboard
      await navigator.clipboard.writeText(result.report)
      
      // Open Google Docs
      const { url } = await createGoogleDoc(
        `Research: ${query.substring(0, 50)}`,
        result.report
      )
      window.open(url, '_blank')
      
      // Show success message
      alert('✅ Content copied to clipboard!\n\nPaste it into your new Google Doc (Cmd+V or Ctrl+V)')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export to Google Docs')
    }
  }

  const handleNewResearch = () => {
    setPhase('idle')
    setQuery('')
    setPlan(null)
    setResult(null)
    setLiveUpdates([])
    setProgress(0)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <IdleState
            key="idle"
            query={query}
            setQuery={setQuery}
            mode={mode}
            setMode={setMode}
            onSubmit={handleStartPlanning}
          />
        )}

        {phase === 'planning' && (
          <PlanningState key="planning" />
        )}

        {phase === 'plan-ready' && plan && (
          <PlanReadyState
            key="plan-ready"
            query={query}
            plan={plan}
            mode={mode}
            onEdit={() => setPhase('idle')}
            onConfirm={handleStartResearch}
          />
        )}

        {phase === 'researching' && (
          <ResearchingState
            key="researching"
            updates={liveUpdates}
            progress={progress}
          />
        )}

        {phase === 'complete' && result && (
          <CompleteState
            key="complete"
            query={query}
            result={result}
            onExportGoogleDocs={handleExportGoogleDocs}
            onNewResearch={handleNewResearch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// IDLE STATE - Chat Input
function IdleState({ query, setQuery, mode, setMode, onSubmit }: {
  query: string
  setQuery: (q: string) => void
  mode: ResearchMode
  setMode: (m: ResearchMode) => void
  onSubmit: () => void
}) {
  const [showTools, setShowTools] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      {/* Icon and Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Deep Research</h1>
        <p className="text-muted-foreground">AI-powered research with live web search</p>
      </div>

      {/* Chat Input */}
      <div className="relative">
        <div className="border border-border rounded-2xl bg-card p-4 shadow-lg">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to research?"
            className="w-full bg-transparent resize-none outline-none min-h-[100px] text-foreground placeholder:text-muted-foreground"
            rows={4}
          />

          <div className="flex items-center justify-between mt-2">
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                Tools
                <ChevronDown className={cn("w-3 h-3 transition-transform", showTools && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showTools && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-0 w-72 bg-card border border-border rounded-xl shadow-xl p-2 z-50"
                  >
                    <div className="text-xs text-muted-foreground px-2 py-1 mb-1 font-medium">
                      🔍 Research Mode
                    </div>

                    {[
                      { id: 'quick' as const, icon: Zap, label: 'Quick', desc: 'Fast, key insights', time: '~30 seconds' },
                      { id: 'standard' as const, icon: Target, label: 'Standard', desc: 'Balanced depth', time: '~1-2 minutes' },
                      { id: 'comprehensive' as const, icon: Brain, label: 'Comprehensive', desc: 'Full analysis', time: '~3-5 minutes' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setMode(option.id)
                          setShowTools(false)
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                          mode === option.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <option.icon className="w-5 h-5 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {option.time}
                          </div>
                        </div>
                        {mode === option.id && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Send Button */}
            <button
              onClick={onSubmit}
              disabled={!query.trim()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl transition-all",
                query.trim() 
                  ? "hover:bg-primary/90" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode indicator pills */}
        <div className="flex justify-center gap-2 mt-4">
          {[
            { id: 'quick' as const, label: 'Quick', icon: '⚡' },
            { id: 'standard' as const, label: 'Standard', icon: '🎯' },
            { id: 'comprehensive' as const, label: 'Comprehensive', icon: '🧠' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "text-sm px-4 py-1.5 rounded-full transition-all",
                mode === m.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="mr-1.5">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// PLANNING STATE
function PlanningState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="border border-border rounded-2xl bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 blur-xl" />
          </div>
          <h2 className="text-xl font-semibold mt-6 mb-2">Drafting Research Plan</h2>
          <p className="text-muted-foreground text-center">
            Analyzing your query and planning the research approach...
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// PLAN READY STATE
function PlanReadyState({ query, plan, mode, onEdit, onConfirm }: {
  query: string
  plan: ResearchPlan
  mode: ResearchMode
  onEdit: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="border border-border rounded-2xl bg-card shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-primary/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Research Plan</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {query}
          </p>
        </div>

        {/* Plan Items */}
        <div className="p-6">
          <p className="text-muted-foreground mb-4">
            I'll research this topic with focus on:
          </p>

          <ul className="space-y-3 mb-6">
            {plan.items.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </motion.li>
            ))}
          </ul>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Estimated: {plan.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Sources: {plan.estimatedSources}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Query
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Research
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// RESEARCHING STATE
function ResearchingState({ updates, progress }: {
  updates: LiveUpdate[]
  progress: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="border border-border rounded-2xl bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <div className="absolute inset-0 bg-primary/20 blur-lg" />
            </div>
            <h2 className="font-semibold text-lg">Researching...</h2>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Live updates */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {updates.map((update, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              {update.status === 'complete' && (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
              )}
              {update.status === 'loading' && (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              )}
              {update.status === 'pending' && (
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "transition-colors",
                  update.status === 'complete' && 'text-muted-foreground line-through',
                  update.status === 'loading' && 'text-foreground font-medium',
                  update.status === 'pending' && 'text-muted-foreground'
                )}
              >
                {update.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// COMPLETE STATE
function CompleteState({ query, result, onExportGoogleDocs, onNewResearch }: {
  query: string
  result: ResearchResult
  onExportGoogleDocs: () => void
  onNewResearch: () => void
}) {
  const [showFullReport, setShowFullReport] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl"
    >
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold">Research Complete</h2>
          </div>

          <h3 className="text-xl font-semibold mb-4">{query}</h3>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {result.webSources && result.webSources.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="font-medium">{result.webSources.length} sources</span>
              </div>
            )}
            {result.groundingSupport !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>📊</span>
                <span>{Math.round(result.groundingSupport * 100)}% grounded</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-mono text-xs">{result.modelUsed}</span>
            </div>
            <div className="flex items-center gap-1.5 text-success">
              <span>${result.cost.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div
            className={cn(
              "prose prose-sm prose-invert max-w-none overflow-hidden transition-all",
              showFullReport ? "max-h-none" : "max-h-64"
            )}
          >
            <div
              className="whitespace-pre-wrap text-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  result.report
                    .replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-6 mb-3 text-primary">$1</h2>')
                    .replace(/### (.*)/g, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                )
              }}
            />
          </div>

          {!showFullReport && (
            <div className="mt-4">
              <button
                onClick={() => setShowFullReport(true)}
                className="text-sm text-primary hover:underline"
              >
                Show full report →
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExportGoogleDocs}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Open in Google Docs
            </button>
            <button
              onClick={onNewResearch}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Research
            </button>
          </div>
        </div>

        {/* Sources */}
        {result.webSources && result.webSources.length > 0 && (
          <div className="p-6 border-t border-border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Sources ({result.webSources.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.webSources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-primary/20 transition-all group"
                >
                  <span className="text-xs font-mono text-muted-foreground mt-1">
                    [{i + 1}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm group-hover:text-primary truncate transition-colors">
                      {source.title}
                    </div>
                    {source.snippet && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {source.snippet}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {source.url}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                </a>
              ))}
            </div>

            {result.searchQueries && result.searchQueries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Search queries performed:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.searchQueries.map((query, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-full border border-border"
                    >
                      {query}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
