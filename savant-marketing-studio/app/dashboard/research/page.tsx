'use client'

import { useState, useRef, useEffect, useCallback } from "react"
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
  History,
  Trash2,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  ChevronsUpDown,
  X,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/sanitize-html"
import { performDeepResearch, generateResearchPlan, saveResearchToContent, getResearchHistory, deleteResearchFromContent, getResearchPromptTemplates, type ResearchResult } from "@/app/actions/research"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createGoogleDoc } from "@/app/actions/google-docs"
import { getClientsForDropdown } from "@/app/actions/ai"
import { reassignContentToClient } from "@/app/actions/content"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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

interface ResearchHistoryItem {
  id: string
  title: string
  content_json: { content?: Array<{ content?: Array<{ text?: string }> }> } | null
  metadata: {
    research_topic?: string
    research_depth?: string
    model_used?: string
    cost_usd?: number
    sources?: Array<{ title: string; url: string; snippet?: string }>
    search_queries?: string[]
    grounding_support?: number
  } | null
  created_at: string
  client_id: string | null
  user_id: string | null
  clients: { id: string; name: string }[] | null
}

interface ClientDropdownItem {
  id: string
  name: string
}

export default function DeepResearchPage() {
  const [phase, setPhase] = useState<ResearchPhase>('idle')
  const [mode, setMode] = useState<ResearchMode>('standard')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<ResearchPlan | null>(null)
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([])
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ResearchResult | null>(null)
  
  // History panel state
  const [history, setHistory] = useState<ResearchHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)
  
  // Save state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [clients, setClients] = useState<ClientDropdownItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [savedAssetId, setSavedAssetId] = useState<string | null>(null)
  
  // Prompt template state
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([])
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<{ name: string; content: string } | null>(null)
  
  // Track intervals and timeouts for cleanup
  const intervalsRef = useRef<{ progress?: NodeJS.Timeout; update?: NodeJS.Timeout }>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch history on mount
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await getResearchHistory()
      setHistory(data as ResearchHistoryItem[])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])
  
  useEffect(() => {
    refreshHistory()
    // Fetch clients for dropdown
    getClientsForDropdown().then(setClients).catch(console.error)
    // Fetch prompt templates for dropdown
    getResearchPromptTemplates().then(setTemplates).catch(console.error)
  }, [refreshHistory])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
      if (intervalsRef.current.update) clearInterval(intervalsRef.current.update)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('researchDraft')
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.query) setQuery(draft.query)
        if (draft.selectedClientId) setSelectedClientId(draft.selectedClientId)
        if (draft.selectedTemplateIds) setSelectedTemplateIds(draft.selectedTemplateIds)
        if (draft.mode) setMode(draft.mode)
      } catch (e) {
        console.error('[Research] Failed to load draft:', e)
      }
    }
  }, [])

  // Save to localStorage when state changes
  useEffect(() => {
    // Only save if we're in idle or plan-ready phase (not during research)
    if (phase === 'idle' || phase === 'plan-ready') {
      const draft = {
        query,
        selectedClientId,
        selectedTemplateIds,
        mode,
      }
      localStorage.setItem('researchDraft', JSON.stringify(draft))
    }
  }, [query, selectedClientId, selectedTemplateIds, mode, phase])

  const handleStartPlanning = async () => {
    if (!query.trim()) return
    
    setPhase('planning')
    
    try {
      const planResult = await generateResearchPlan(
        query, 
        mode,
        selectedTemplateIds.length > 0 ? selectedTemplateIds : undefined,
        selectedClientId || undefined
      )
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
        clientId: selectedClientId || undefined,
        promptTemplateIds: selectedTemplateIds.length > 0 ? selectedTemplateIds : undefined,
      })

      clearInterval(progressInterval)
      clearInterval(updateInterval)
      intervalsRef.current = {}
      
      setProgress(100)
      setLiveUpdates(prev => prev.map(u => ({ ...u, status: 'complete' })))
      
      // Capture savedAssetId for later reassignment if needed
      if (researchResult.savedAssetId) {
        setSavedAssetId(researchResult.savedAssetId)
      }
      
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
    // Clear localStorage draft when starting fresh
    localStorage.removeItem('researchDraft')
    
    setPhase('idle')
    setQuery('')
    setPlan(null)
    setResult(null)
    setLiveUpdates([])
    setProgress(0)
    setSelectedClientId('')
    setSelectedTemplateIds([])
    setSaved(false)
    setSelectedHistoryId(null)
    setSelectedClientId('')
    setSavedAssetId(null)
    setSelectedTemplateIds([])
  }
  
  // Save research to content library
  const handleSaveToLibrary = async () => {
    if (!result) return
    
    setSaving(true)
    try {
      await saveResearchToContent({
        title: `Research: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`,
        content: result.report,
        sources: result.webSources,
        searchQueries: result.searchQueries,
        clientId: selectedClientId || undefined,
        metadata: {
          research_topic: query,
          research_depth: mode,
          model_used: result.modelUsed,
          cost_usd: result.cost,
          grounding_support: result.groundingSupport,
        }
      })
      
      setSaved(true)
      toast.success('Research saved to content library')
      refreshHistory()
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save research')
    } finally {
      setSaving(false)
    }
  }
  
  // Load research from history
  const handleLoadFromHistory = (item: ResearchHistoryItem) => {
    setSelectedHistoryId(item.id)
    
    // Extract content from content_json
    const content = item.content_json?.content?.[0]?.content?.[0]?.text || ''
    
    setQuery(item.metadata?.research_topic || item.title.replace('Research: ', ''))
    setMode((item.metadata?.research_depth as ResearchMode) || 'standard')
    setResult({
      report: content,
      modelUsed: item.metadata?.model_used || 'unknown',
      cost: item.metadata?.cost_usd || 0,
      inputTokens: 0,
      outputTokens: 0,
      frameworksUsed: [],
      webSources: item.metadata?.sources || [],
      searchQueries: item.metadata?.search_queries || [],
      groundingSupport: item.metadata?.grounding_support,
    })
    setPhase('complete')
    setSaved(true) // Already saved since it's from history
    setSavedAssetId(item.id) // Set asset ID for potential reassignment
    setSelectedClientId(item.client_id || '') // Set current client association
  }
  
  // Delete research from history
  const handleDeleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger load
    
    if (!confirm('Delete this research?')) return
    
    try {
      await deleteResearchFromContent(id)
      toast.success('Research deleted')
      refreshHistory()
      
      if (selectedHistoryId === id) {
        handleNewResearch()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Failed to delete research')
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-border flex flex-col bg-card/50 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Research History</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {historyLoading ? (
                <div className="p-4 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No saved research yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Research will appear here when saved
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-accent/50 transition-colors group relative cursor-pointer",
                        selectedHistoryId === item.id && "bg-accent"
                      )}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="font-medium text-sm truncate pr-8">
                        {item.metadata?.research_topic || item.title.replace('Research: ', '')}
                      </p>
                      {item.clients?.[0]?.name && (
                        <p className="text-xs text-primary/80 mt-1 truncate">
                          {item.clients[0].name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                      {item.metadata?.sources && item.metadata.sources.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {item.metadata.sources.length} sources
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDeleteFromHistory(item.id, e)}
                        className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toggle button when sidebar is hidden */}
      {!showHistory && (
        <button
          onClick={() => setShowHistory(true)}
          className="absolute left-4 top-20 p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors z-10"
        >
          <PanelLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <IdleState
              key="idle"
              query={query}
              setQuery={setQuery}
              mode={mode}
              setMode={setMode}
              onSubmit={handleStartPlanning}
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              templates={templates}
              selectedTemplateIds={selectedTemplateIds}
              setSelectedTemplateIds={setSelectedTemplateIds}
              previewTemplate={previewTemplate}
              setPreviewTemplate={setPreviewTemplate}
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
              onSaveToLibrary={handleSaveToLibrary}
              saving={saving}
              saved={saved}
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              savedAssetId={savedAssetId}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// IDLE STATE - Chat Input
function IdleState({ query, setQuery, mode, setMode, onSubmit, clients, selectedClientId, setSelectedClientId, templates, selectedTemplateIds, setSelectedTemplateIds, previewTemplate, setPreviewTemplate }: {
  query: string
  setQuery: (q: string) => void
  mode: ResearchMode
  setMode: (m: ResearchMode) => void
  onSubmit: () => void
  clients: ClientDropdownItem[]
  selectedClientId: string
  setSelectedClientId: (id: string) => void
  templates: { id: string; name: string; content: string }[]
  selectedTemplateIds: string[]
  setSelectedTemplateIds: (ids: string[]) => void
  previewTemplate: { name: string; content: string } | null
  setPreviewTemplate: (template: { name: string; content: string } | null) => void
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

      {/* Client Selector - select before research */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Research for client (optional)
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full p-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          <option value="">General (no client)</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Research Template Multi-Select */}
      <div className="mb-4 space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Research Templates (optional)
        </label>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between h-auto min-h-10 font-normal rounded-xl"
            >
              {selectedTemplateIds.length === 0 ? (
                <span className="text-muted-foreground">Select templates...</span>
              ) : (
                <div className="flex flex-wrap gap-1 py-1">
                  {selectedTemplateIds.map((id) => {
                    const template = templates.find((t) => t.id === id);
                    if (!template) return null;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {template.name.replace(' Prompt', '').replace(' Research', '')}
                        <span
                          role="button"
                          tabIndex={0}
                          className="ml-1 hover:text-destructive cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplateIds(selectedTemplateIds.filter(t => t !== id));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              setSelectedTemplateIds(selectedTemplateIds.filter(t => t !== id));
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {templates.map((template) => {
                const isSelected = selectedTemplateIds.includes(template.id);
                
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                      "hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => {
                      setSelectedTemplateIds(
                        isSelected
                          ? selectedTemplateIds.filter(id => id !== template.id)
                          : [...selectedTemplateIds, template.id]
                      );
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                    <span className="flex-1 text-sm">
                      {template.name.replace(' Prompt', '')}
                    </span>
                    
                    {/* Info Button - Opens Dialog */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate({ name: template.name, content: template.content });
                      }}
                      className="p-1 rounded hover:bg-background"
                      title="View full template"
                    >
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
            
            {selectedTemplateIds.length > 0 && (
              <>
                <div className="border-t my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setSelectedTemplateIds([])}
                >
                  Clear all ({selectedTemplateIds.length} selected)
                </Button>
              </>
            )}
          </PopoverContent>
        </Popover>
        
        {/* Template Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted text-foreground p-4 rounded-lg overflow-x-auto">
                  {previewTemplate?.content}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
function CompleteState({ 
  query, 
  result, 
  onExportGoogleDocs, 
  onNewResearch,
  onSaveToLibrary,
  saving,
  saved,
  clients,
  selectedClientId,
  setSelectedClientId,
  savedAssetId,
}: {
  query: string
  result: ResearchResult
  onExportGoogleDocs: () => void
  onNewResearch: () => void
  onSaveToLibrary: () => void
  saving: boolean
  saved: boolean
  clients: ClientDropdownItem[]
  selectedClientId: string
  setSelectedClientId: (id: string) => void
  savedAssetId: string | null
}) {
  const [showFullReport, setShowFullReport] = useState(false)
  const [reassigning, setReassigning] = useState(false)

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
          <div className="flex flex-wrap items-center gap-3">
            {/* Client Selector - can change before or after saving */}
            <select
              value={selectedClientId}
              onChange={async (e) => {
                const newClientId = e.target.value || null
                const previousClientId = selectedClientId
                setSelectedClientId(e.target.value)
                
                // If research was saved, reassign it (cascades to ai_executions)
                if (savedAssetId && newClientId !== previousClientId) {
                  setReassigning(true)
                  try {
                    await reassignContentToClient(savedAssetId, newClientId)
                    toast.success(newClientId 
                      ? `Research reassigned to ${clients.find(c => c.id === newClientId)?.name || 'client'}`
                      : 'Research unassigned from client'
                    )
                  } catch (error) {
                    toast.error('Failed to reassign research')
                    console.error(error)
                    // Revert selection on error
                    setSelectedClientId(previousClientId)
                  } finally {
                    setReassigning(false)
                  }
                }
              }}
              disabled={reassigning}
              className="h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50"
            >
              <option value="">General (no client)</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            
            {/* Save to Library Button - no longer requires client */}
            <button
              onClick={onSaveToLibrary}
              disabled={saving || saved}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
                saved
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save to Library
                </>
              )}
            </button>
            
            <div className="h-6 w-px bg-border mx-1" />
            
            <button
              onClick={onExportGoogleDocs}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
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
