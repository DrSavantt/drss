'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Users, Zap, FileText, HardDrive, Gauge,
  ChevronDown, RefreshCw, AlertCircle
} from 'lucide-react'

// ============================================================================
// DATA INTERFACES
// ============================================================================

interface MetricData {
  clientHealth: {
    health: number
    total: number
    active: number
    activePercent: number
    questionnairesCompleted: number
    questionnairePercent: number
    inactive: number
    overdueProjects: number
  } | null
  projectVelocity: {
    avgVelocity: number
    total: number
    backlog: number
    inProgress: number
    inReview: number
    done: number
    completedThisWeek: number
    stuck: number
    completionRate: number
  } | null
  contentOutput: {
    thisMonth: number
    thisWeek: number
    total: number
    byType: Record<string, number>
  } | null
  storage: {
    totalMB: number
    filesCount: number
    filesThisWeek: number
  } | null
  capacity: {
    currentClients: number
    maxCapacity: number
    capacityPercent: number
    clientsCanAdd: number
    hoursPerWeek: number
    avgHoursPerClient: number
  } | null
}

interface MetricCardsProps {
  autoExpand?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetricCards({ autoExpand }: MetricCardsProps) {
  const [metrics, setMetrics] = useState<MetricData | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    // Skip fetch if tab is hidden
    if (document.hidden) return
    
    try {
      const res = await fetch('/api/metrics', { signal })
      
      // Check if aborted
      if (signal?.aborted) return
      
      if (!res.ok) throw new Error('Failed to fetch metrics')
      const data = await res.json()
      
      // Only update state if not aborted
      if (!signal?.aborted) {
        setMetrics(data)
        setError(null)
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to fetch metrics:', err)
      if (!signal?.aborted) {
        setError('Failed to load metrics')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Create abort controller for initial fetch
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    // Initial fetch
    fetchMetrics(abortController.signal)
    
    // Set up interval with visibility check
    const interval = setInterval(() => {
      // Only fetch if tab is visible
      if (!document.hidden) {
        // Abort previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        const newController = new AbortController()
        abortControllerRef.current = newController
        fetchMetrics(newController.signal)
      }
    }, 30000) // Auto-refresh every 30s
    
    // Visibility change handler - fetch immediately when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        const newController = new AbortController()
        abortControllerRef.current = newController
        fetchMetrics(newController.signal)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibility)
    
    // Cleanup
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchMetrics])

  useEffect(() => {
    if (autoExpand) {
      setExpanded(prev => ({ ...prev, [autoExpand]: true }))
    }
  }, [autoExpand])

  const toggleExpand = (metricKey: string) => {
    setExpanded(prev => ({ ...prev, [metricKey]: !prev[metricKey] }))
  }

  const getHealthColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-500'
    if (value >= threshold * 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return <MetricCardsSkeleton />
  }

  if (error || !metrics) {
    return <MetricCardsError message={error} onRetry={fetchMetrics} />
  }

  return (
    <div className="flex flex-col gap-3 max-w-5xl">
      {/* METRIC 1: CLIENT HEALTH */}
      {metrics.clientHealth && (
        <MetricCard
          id="clientHealth"
          title="Client Health"
          icon={Users}
          value={`${metrics.clientHealth.health}%`}
          valueColor={getHealthColor(metrics.clientHealth.health, 80)}
          isExpanded={expanded.clientHealth || false}
          onToggle={() => toggleExpand('clientHealth')}
        >
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <MetricRow label="Total Clients" value={metrics.clientHealth.total} />
            <MetricRow 
              label="Active (30d)" 
              value={metrics.clientHealth.active}
              valueColor="text-green-500"
            />
            <MetricRow 
              label="Questionnaires Done" 
              value={metrics.clientHealth.questionnairesCompleted}
            />
            {metrics.clientHealth.inactive > 0 && (
              <MetricRow 
                label="Inactive" 
                value={metrics.clientHealth.inactive}
                valueColor="text-yellow-500"
              />
            )}
            {metrics.clientHealth.overdueProjects > 0 && (
              <MetricRow 
                label="With Overdue Projects" 
                value={metrics.clientHealth.overdueProjects}
                valueColor="text-red-500"
              />
            )}
          </div>
        </MetricCard>
      )}

      {/* METRIC 2: PROJECT VELOCITY */}
      {metrics.projectVelocity && (
        <MetricCard
          id="projectVelocity"
          title="Project Velocity"
          icon={Zap}
          value={
            <>
              {metrics.projectVelocity.avgVelocity}{' '}
              <span className="text-sm text-muted-foreground">days</span>
            </>
          }
          isExpanded={expanded.projectVelocity || false}
          onToggle={() => toggleExpand('projectVelocity')}
        >
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <MetricRow label="Backlog" value={metrics.projectVelocity.backlog} />
            <MetricRow 
              label="In Progress" 
              value={metrics.projectVelocity.inProgress}
              valueColor="text-blue-500"
            />
            <MetricRow 
              label="In Review" 
              value={metrics.projectVelocity.inReview}
              valueColor="text-yellow-500"
            />
            <MetricRow 
              label="Done" 
              value={metrics.projectVelocity.done}
              valueColor="text-green-500"
            />
            {metrics.projectVelocity.stuck > 0 && (
              <MetricRow 
                label="Stuck (7+ days)" 
                value={metrics.projectVelocity.stuck}
                valueColor="text-red-500"
              />
            )}
          </div>
        </MetricCard>
      )}

      {/* METRIC 3: CONTENT OUTPUT */}
      {metrics.contentOutput && (
        <MetricCard
          id="contentOutput"
          title="Content Output"
          icon={FileText}
          value={
            <>
              {metrics.contentOutput.thisMonth}{' '}
              <span className="text-sm text-muted-foreground">this month</span>
            </>
          }
          isExpanded={expanded.contentOutput || false}
          onToggle={() => toggleExpand('contentOutput')}
        >
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <MetricRow label="This Week" value={metrics.contentOutput.thisWeek} />
            <MetricRow label="Total" value={metrics.contentOutput.total} />
            {Object.entries(metrics.contentOutput.byType).map(([type, count]) => (
              <MetricRow
                key={type}
                label={type.replace('_', ' ')}
                value={count as number}
                capitalize
              />
            ))}
          </div>
        </MetricCard>
      )}

      {/* METRIC 4: STORAGE */}
      {metrics.storage && (
        <MetricCard
          id="storage"
          title="Storage Used"
          icon={HardDrive}
          value={
            <>
              {metrics.storage.totalMB}{' '}
              <span className="text-sm text-muted-foreground">MB</span>
            </>
          }
          isExpanded={expanded.storage || false}
          onToggle={() => toggleExpand('storage')}
        >
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <MetricRow label="Total Files" value={metrics.storage.filesCount} />
            <MetricRow label="Files This Week" value={metrics.storage.filesThisWeek} />
          </div>
        </MetricCard>
      )}

      {/* METRIC 5: CAPACITY */}
      {metrics.capacity && (
        <MetricCard
          id="capacity"
          title="Capacity"
          icon={Gauge}
          value={
            <>
              {metrics.capacity.capacityPercent}%{' '}
              <span className="text-sm text-muted-foreground">used</span>
            </>
          }
          valueColor={getHealthColor(100 - metrics.capacity.capacityPercent, 50)}
          isExpanded={expanded.capacity || false}
          onToggle={() => toggleExpand('capacity')}
        >
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <MetricRow label="Current Clients" value={metrics.capacity.currentClients} />
            <MetricRow 
              label="Can Add" 
              value={metrics.capacity.clientsCanAdd}
              valueColor="text-green-500"
            />
            <MetricRow 
              label="Hours Per Client" 
              value={`${metrics.capacity.avgHoursPerClient}h`}
            />
          </div>
        </MetricCard>
      )}
    </div>
  )
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  id: string
  title: string
  icon: React.ElementType
  value: React.ReactNode
  valueColor?: string
  isExpanded: boolean
  onToggle: () => void
  children?: React.ReactNode
}

function MetricCard({ 
  title, 
  icon: Icon, 
  value, 
  valueColor, 
  isExpanded, 
  onToggle,
  children 
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 cursor-pointer",
        isExpanded && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onToggle}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueColor || "text-foreground")}>
          {value}
        </div>
        <div 
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded 
              ? "grid-rows-[1fr] opacity-100" 
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// METRIC ROW COMPONENT
// ============================================================================

interface MetricRowProps {
  label: string
  value: string | number
  valueColor?: string
  capitalize?: boolean
}

function MetricRow({ label, value, valueColor, capitalize }: MetricRowProps) {
  return (
    <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <span className={cn(
        "text-sm text-muted-foreground",
        capitalize && "capitalize"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm font-medium",
        valueColor || "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MetricCardsSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-5xl">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function MetricCardsError({ 
  message, 
  onRetry 
}: { 
  message: string | null
  onRetry: () => void 
}) {
  return (
    <Card className="max-w-5xl">
      <CardContent className="flex items-center justify-center gap-4 py-8">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-muted-foreground">
          {message || 'Failed to load metrics'}
        </span>
        <button 
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </CardContent>
    </Card>
  )
}

