'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UrgentProject {
  id?: string
  name: string
  client?: string
  client_name?: string
  client_id?: string
  due?: string
  due_date?: string
  priority?: string
  sortOrder?: number
}

interface UrgentItemsProps {
  projects: UrgentProject[]
  className?: string
}

interface DaysInfo {
  text: string
  isOverdue: boolean
  urgency: 'critical' | 'high' | 'medium' | 'low'
  daysCount: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UrgentItems({ projects, className }: UrgentItemsProps) {
  const getDaysInfo = (dueDate: string): DaysInfo => {
    const due = new Date(dueDate)
    const now = new Date()
    // Reset time part for accurate day calculation
    due.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays)
      return { 
        text: daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`, 
        isOverdue: true,
        urgency: 'critical',
        daysCount: diffDays
      }
    } else if (diffDays === 0) {
      return { 
        text: 'Due today', 
        isOverdue: false, 
        urgency: 'high',
        daysCount: 0
      }
    } else if (diffDays === 1) {
      return { 
        text: 'Due tomorrow', 
        isOverdue: false, 
        urgency: 'high',
        daysCount: 1
      }
    } else if (diffDays <= 3) {
      return { 
        text: `Due in ${diffDays} days`, 
        isOverdue: false, 
        urgency: 'medium',
        daysCount: diffDays
      }
    } else {
      return { 
        text: `Due in ${diffDays} days`, 
        isOverdue: false, 
        urgency: 'low',
        daysCount: diffDays
      }
    }
  }

  // Empty state - all clear
  if (!projects || projects.length === 0) {
    return (
      <Card className={cn("border-border bg-card", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            All Clear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No urgent or overdue projects. Great work! 🎉
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort projects by urgency (overdue first, then by days)
  const sortedProjects = [...projects].sort((a, b) => {
    const aDate = a.due_date || a.due || ''
    const bDate = b.due_date || b.due || ''
    if (!aDate || !bDate) return 0
    const aInfo = getDaysInfo(aDate)
    const bInfo = getDaysInfo(bDate)
    
    // Overdue projects first
    if (aInfo.isOverdue && !bInfo.isOverdue) return -1
    if (!aInfo.isOverdue && bInfo.isOverdue) return 1
    
    // Then by days count (ascending)
    return aInfo.daysCount - bInfo.daysCount
  })

  const overdueCount = sortedProjects.filter(p => {
    const dueDate = p.due_date || p.due
    return dueDate && getDaysInfo(dueDate).isOverdue
  }).length

  return (
    <Card className={cn(
      "border-border bg-card",
      overdueCount > 0 && "border-destructive/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
            )}
            {overdueCount === 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            Needs Your Attention
          </CardTitle>
          <Badge 
            variant={overdueCount > 0 ? "destructive" : "default"}
            className={cn(
              overdueCount === 0 && "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {projects.length} {projects.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedProjects.map((project, index) => {
          const dueDate = project.due_date || project.due
          if (!dueDate) return null
          
          const daysInfo = getDaysInfo(dueDate)
          const clientName = project.client_name || project.client || 'Unknown Client'
          const clientId = project.client_id
          
          return (
            <div
              key={project.id || index}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg border transition-all",
                "hover:bg-muted/50 hover:shadow-sm cursor-pointer",
                daysInfo.isOverdue 
                  ? "border-destructive/50 bg-destructive/5" 
                  : daysInfo.urgency === 'high'
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon/Indicator */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  daysInfo.isOverdue 
                    ? "bg-destructive/10" 
                    : daysInfo.urgency === 'high'
                    ? "bg-orange-500/10"
                    : "bg-yellow-500/10"
                )}>
                  {daysInfo.isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className={cn(
                      "h-5 w-5",
                      daysInfo.urgency === 'high' ? "text-orange-500" : "text-yellow-500"
                    )} />
                  )}
                </div>
                
                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {clientName}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5 font-medium",
                    daysInfo.isOverdue 
                      ? "text-destructive" 
                      : daysInfo.urgency === 'high'
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  )}>
                    {daysInfo.text}
                  </p>
                </div>
              </div>
              
              {/* Action button - appears on hover */}
              <Link href={clientId ? `/dashboard/clients/${clientId}` : '/dashboard/projects/board'}>
                <Button 
                  size="sm" 
                  variant={daysInfo.isOverdue ? "destructive" : "default"}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    !daysInfo.isOverdue && daysInfo.urgency === 'high' && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  Handle
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )
        })}
        
        {/* Footer CTA */}
        <div className="pt-2 mt-2 border-t border-border">
          <Link href="/dashboard/projects/board" className="block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between hover:bg-muted/50"
            >
              <span className="text-sm">View all projects</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

