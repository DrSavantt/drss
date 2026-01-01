// Force rebuild: v2.0 - January 2026
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Clock,
  Users,
  FolderKanban,
  FileText,
  Sparkles,
  ChevronRight,
  Send,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, startOfWeek, isSameDay, isToday, formatDistanceToNow } from 'date-fns'
import { createJournalEntry, getOrCreateInbox } from '@/app/actions/journal'
import { getClients } from '@/app/actions/clients'
import { getAllProjects, getAllContentAssets } from '@/app/actions/content'
import Link from 'next/link'
import { PulsingDot } from '@/components/dashboard/pulsing-dot'

interface DashboardData {
  totalClients: number
  totalProjects: number
  totalContent: number
  projectsByStatus: { backlog: number; in_progress: number; in_review: number; done: number }
  urgentItems: Array<{ id: string; title: string; subtitle?: string; dueDate?: string; type: string; href: string }>
  recentActivity: any[]
  contentThisWeek: number
  activeClients: number
  dueThisWeek: number
  overdue: number
  completionPercentage: number
  weeklyContent: number
  completedThisMonth: number
  storageUsed: number
  filesCount: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickCapture, setQuickCapture] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string; clientName?: string }>>([])
  const [contentItems, setContentItems] = useState<Array<{ id: string; title: string; clientName?: string }>>([])
  const [showMentionPopup, setShowMentionPopup] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [filteredClients, setFilteredClients] = useState<Array<{ id: string; name: string }>>([])
  const [filteredProjects, setFilteredProjects] = useState<Array<{ id: string; name: string; clientName?: string }>>([])
  const [filteredContent, setFilteredContent] = useState<Array<{ id: string; title: string; clientName?: string }>>([])
  const [mentionedClientIds, setMentionedClientIds] = useState<string[]>([])
  const [mentionedProjectIds, setMentionedProjectIds] = useState<string[]>([])
  const [mentionedContentIds, setMentionedContentIds] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchDashboard()
    fetchMentionableItems()
  }, [])

  async function fetchMentionableItems() {
    try {
      const [clientsData, projectsData, contentData] = await Promise.all([
        getClients(),
        getAllProjects(),
        getAllContentAssets()
      ])
      
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })))
      
      setProjects(projectsData.map(p => {
        const clientName = Array.isArray(p.clients) && p.clients.length > 0 
          ? (p.clients[0] as any)?.name 
          : undefined
        return {
          id: p.id,
          name: p.name,
          clientName
        }
      }))
      
      setContentItems(contentData.map(c => {
        const clientName = Array.isArray(c.clients) && c.clients.length > 0 
          ? (c.clients[0] as any)?.name 
          : undefined
        return {
          id: c.id,
          title: c.title,
          clientName
        }
      }))
    } catch (error) {
      console.error('Failed to fetch mentionable items:', error)
    }
  }

  // Filter all items based on mention search
  useEffect(() => {
    const search = mentionSearch.toLowerCase()
    setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(search)))
    setFilteredProjects(projects.filter(p => p.name.toLowerCase().includes(search)))
    setFilteredContent(contentItems.filter(c => (c.title || '').toLowerCase().includes(search)))
  }, [mentionSearch, clients, projects, contentItems])

  // Handle keyboard shortcuts and click outside for mention popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMentionPopup) {
        setShowMentionPopup(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showMentionPopup && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (!target.closest('.mention-popup')) {
          setShowMentionPopup(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMentionPopup])

  async function fetchDashboard() {
    try {
      const response = await fetch('/api/dashboard')
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuickCapture(value)

    // Check for @ mention trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
      
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && 
          !textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt)
        setShowMentionPopup(true)
        return
      }
    }
    setShowMentionPopup(false)
  }

  const insertMention = (
    type: 'client' | 'project' | 'content', 
    item: { id: string; name?: string; title?: string }
  ) => {
    const name = 'name' in item && item.name ? item.name : (item as any).title
    const cursorPos = inputRef.current?.selectionStart || 0
    const textBeforeCursor = quickCapture.substring(0, cursorPos)
    const textAfterCursor = quickCapture.substring(cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    const before = quickCapture.substring(0, lastAtIndex)
    const after = textAfterCursor
    const newText = `${before}@${name} ${after}`
    
    setQuickCapture(newText)
    setShowMentionPopup(false)
    
    // Track by type
    if (type === 'client') {
      setMentionedClientIds(prev => [...new Set([...prev, item.id])])
    } else if (type === 'project') {
      setMentionedProjectIds(prev => [...new Set([...prev, item.id])])
    } else if (type === 'content') {
      setMentionedContentIds(prev => [...new Set([...prev, item.id])])
    }
    
    // Focus input and set cursor position after mention
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = lastAtIndex + name.length + 2 // @ + name + space
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickCapture.trim() || submitting) return

    setSubmitting(true)
    try {
      const inboxId = await getOrCreateInbox()
      const tags = (quickCapture.match(/#(\w+)/g) || []).map(tag => tag.slice(1))
      await createJournalEntry(
        quickCapture, 
        inboxId, 
        mentionedClientIds, 
        mentionedProjectIds, 
        mentionedContentIds, 
        tags
      )
      setQuickCapture('')
      setMentionedClientIds([])
      setMentionedProjectIds([])
      setMentionedContentIds([])
    } catch (error) {
      console.error('Failed to save capture:', error)
      alert('Failed to save capture')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Calculate AI spend (estimate from generations)
  const estimatedAISpend = Math.round(data.totalProjects * 0.15 * 100) / 100

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">{greeting}</h1>
          <p className="text-muted-foreground">
            {data.urgentItems.length > 0 
              ? `You have ${data.urgentItems.length} ${data.urgentItems.length === 1 ? 'item' : 'items'} that need attention` 
              : "Everything's on track today"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* At A Glance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active Clients"
          value={data.activeClients}
          color="text-blue-500"
          trend={data.activeClients > 0 ? `${data.totalClients} total` : undefined}
        />
        <StatCard
          icon={<FolderKanban className="h-4 w-4" />}
          label="Active Projects"
          value={data.projectsByStatus.in_progress + data.projectsByStatus.in_review}
          color="text-purple-500"
          trend={data.completedThisMonth > 0 ? `${data.completedThisMonth} done this month` : undefined}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Content This Month"
          value={data.weeklyContent}
          color="text-green-500"
          trend={data.contentThisWeek > 0 ? `+${data.contentThisWeek} this week` : undefined}
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Storage Used"
          value={`${data.storageUsed}MB`}
          color="text-amber-500"
          trend={data.filesCount > 0 ? `${data.filesCount} files` : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Needs Attention + This Week */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className={cn(
              "transition-all",
              data.overdue > 0 && "border-destructive/50 shadow-destructive/10 shadow-lg"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {data.overdue > 0 && <PulsingDot color="red" />}
                    {data.overdue === 0 && data.urgentItems.length > 0 && <AlertCircle className="h-5 w-5 text-amber-500" />}
                    {data.urgentItems.length === 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    Needs Attention
                  </CardTitle>
                  <Badge 
                    variant={data.overdue > 0 ? "destructive" : data.urgentItems.length > 0 ? "secondary" : "outline"}
                    className={cn(data.overdue > 0 && "animate-pulse")}
                  >
                    {data.urgentItems.length}
                  </Badge>
                </div>
              </CardHeader>
            <CardContent>
              {data.urgentItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">All clear! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.urgentItems.slice(0, 5).map((item, i) => {
                    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date()
                    const isDueToday = item.dueDate && isToday(new Date(item.dueDate))
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm",
                          isOverdue 
                            ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10" 
                            : isDueToday
                            ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isOverdue ? (
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          ) : (
                            <Clock className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isDueToday ? "text-amber-500" : "text-muted-foreground"
                            )} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                            )}
                            {item.dueDate && (
                              <p className={cn(
                                "text-xs font-medium",
                                isOverdue ? "text-destructive" : isDueToday ? "text-amber-600" : "text-muted-foreground"
                              )}>
                                {isOverdue 
                                  ? 'Overdue' 
                                  : isDueToday 
                                  ? 'Due today' 
                                  : `Due ${format(new Date(item.dueDate), 'MMM d')}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link href={item.href}>
                          <Button 
                            size="sm" 
                            variant={isOverdue ? "destructive" : "ghost"} 
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </motion.div>
                    )
                  })}
                  {data.urgentItems.length > 5 && (
                    <Link href="/dashboard/projects/board">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View all {data.urgentItems.length} items
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* This Week Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day) => {
                  const dayProjects = data.urgentItems.filter(item => 
                    item.dueDate && isSameDay(new Date(item.dueDate), day)
                  )
                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "text-center p-2 rounded-lg border transition-colors",
                        isToday(day) 
                          ? "bg-primary/10 border-primary" 
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <p className="text-xs text-muted-foreground">
                        {format(day, 'EEE')}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        isToday(day) ? "text-primary" : "text-foreground"
                      )}>
                        {format(day, 'd')}
                      </p>
                      {dayProjects.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {dayProjects.slice(0, 3).map((_, i) => (
                            <div key={i} className="h-1 w-1 rounded-full bg-destructive" />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Today's Tasks */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                {data.urgentItems
                  .filter(item => item.dueDate && isToday(new Date(item.dueDate)))
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded border border-border">
                      <Checkbox />
                      <span className="text-sm flex-1">{item.title}</span>
                      <Link href={item.href}>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                {data.urgentItems.filter(item => item.dueDate && isToday(new Date(item.dueDate))).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks due today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Right Column: Quick Capture + Recent Activity */}
        <div className="space-y-6">
          {/* Quick Capture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Quick Capture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickCapture} className="space-y-3">
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    placeholder="Capture a quick thought... Use @client or #tag"
                    value={quickCapture}
                    onChange={handleInputChange}
                    className="min-h-[120px] resize-none"
                    disabled={submitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !showMentionPopup) {
                        e.preventDefault()
                        handleQuickCapture(e)
                      }
                    }}
                  />
                  
                  {/* Mention Autocomplete Popup */}
                  {showMentionPopup && (filteredClients.length > 0 || filteredProjects.length > 0 || filteredContent.length > 0) && (
                    <div className="mention-popup absolute bottom-full left-0 mb-2 w-full max-w-sm bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs text-muted-foreground">
                          {mentionSearch ? `Searching "${mentionSearch}"` : 'Link to...'}
                        </span>
                      </div>
                      
                      {/* Categories */}
                      <div className="max-h-64 overflow-y-auto">
                        {/* Clients Section */}
                        {filteredClients.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <Users className="w-3 h-3" />
                              Clients
                            </div>
                            {filteredClients.slice(0, 4).map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => insertMention('client', client)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                                <span className="text-foreground truncate">{client.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Projects Section */}
                        {filteredProjects.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <FolderKanban className="w-3 h-3" />
                              Projects
                            </div>
                            {filteredProjects.slice(0, 4).map(project => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => insertMention('project', project)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-foreground truncate">{project.name}</span>
                                  {project.clientName && (
                                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{project.clientName}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Content Section */}
                        {filteredContent.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <FileText className="w-3 h-3" />
                              Content
                            </div>
                            {filteredContent.slice(0, 4).map(content => (
                              <button
                                key={content.id}
                                type="button"
                                onClick={() => insertMention('content', content)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-foreground truncate">{content.title}</span>
                                  {content.clientName && (
                                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{content.clientName}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Empty state */}
                        {filteredClients.length === 0 && filteredProjects.length === 0 && filteredContent.length === 0 && mentionSearch && (
                          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                            No matches found for "{mentionSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!quickCapture.trim() || submitting}
                >
                  {submitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Save to Journal
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {data.recentActivity.slice(0, 6).map((activity, i) => (
                    <Link key={activity.id} href={activity.href}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                      >
                        <div className={cn(
                          "mt-0.5 p-1.5 rounded-md flex-shrink-0",
                          activity.type === 'project' ? "bg-purple-500/10" : "bg-green-500/10"
                        )}>
                          {activity.type === 'project' ? (
                            <FolderKanban className="h-3.5 w-3.5 text-purple-500" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {activity.client && (
                              <p className="text-xs text-muted-foreground truncate">
                                {activity.client}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/clients" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  {data.activeClients} Active Clients
                </Button>
              </Link>
              <Link href="/dashboard/projects/board" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  {data.projectsByStatus.in_progress} In Progress
                </Button>
              </Link>
              <Link href="/dashboard/content" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  {data.totalContent} Content Items
                </Button>
              </Link>
              <Link href="/dashboard/journal" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Open Journal
                </Button>
              </Link>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  trend?: string
}

function StatCard({ icon, label, value, color = 'text-primary', trend }: StatCardProps) {
  const isPositiveTrend = trend && trend.includes('+')
  const isNegativeTrend = trend && trend.includes('-')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2 rounded-lg bg-muted/50", color)}>
              {icon}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                isPositiveTrend && "bg-green-500/10 text-green-600",
                isNegativeTrend && "bg-red-500/10 text-red-600",
                !isPositiveTrend && !isNegativeTrend && "bg-muted text-muted-foreground"
              )}>
                {isPositiveTrend && <TrendingUp className="h-3 w-3" />}
                {isNegativeTrend && <TrendingDown className="h-3 w-3" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
