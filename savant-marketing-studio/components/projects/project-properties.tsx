'use client'

import { useState, useTransition } from 'react'
import { updateProjectData } from '@/app/actions/projects'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ProjectPropertiesProps {
  projectId: string
  status: 'backlog' | 'in_progress' | 'in_review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string | null
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
] as const

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
] as const

export function ProjectProperties({ projectId, status, priority, dueDate }: ProjectPropertiesProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [currentPriority, setCurrentPriority] = useState(priority)
  const [currentDueDate, setCurrentDueDate] = useState(dueDate)
  
  const [isStatusPending, startStatusTransition] = useTransition()
  const [isPriorityPending, startPriorityTransition] = useTransition()
  const [isDatePending, startDateTransition] = useTransition()

  const handleStatusChange = (newStatus: string) => {
    const prevStatus = currentStatus
    setCurrentStatus(newStatus as typeof status)
    
    startStatusTransition(async () => {
      const result = await updateProjectData(projectId, { status: newStatus })
      if (result.error) {
        setCurrentStatus(prevStatus)
        console.error('Failed to update status:', result.error)
      }
    })
  }

  const handlePriorityChange = (newPriority: string) => {
    const prevPriority = currentPriority
    setCurrentPriority(newPriority as typeof priority)
    
    startPriorityTransition(async () => {
      const result = await updateProjectData(projectId, { priority: newPriority })
      if (result.error) {
        setCurrentPriority(prevPriority)
        console.error('Failed to update priority:', result.error)
      }
    })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value || null
    const prevDate = currentDueDate
    setCurrentDueDate(newDate)
    
    startDateTransition(async () => {
      const result = await updateProjectData(projectId, { 
        due_date: newDate ? new Date(newDate).toISOString() : null 
      })
      if (result.error) {
        setCurrentDueDate(prevDate)
        console.error('Failed to update due date:', result.error)
      }
    })
  }

  const statusOption = STATUS_OPTIONS.find(s => s.value === currentStatus)
  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === currentPriority)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status Select */}
      <div className="relative">
        <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isStatusPending}>
          <SelectTrigger 
            className={cn(
              "h-7 px-2.5 text-xs font-medium rounded-full border-0 gap-1.5 w-auto",
              statusOption?.color,
              isStatusPending && "opacity-70"
            )}
          >
            <SelectValue />
            {isStatusPending && <Loader2 className="h-3 w-3 animate-spin" />}
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  option.color
                )}>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority Select */}
      <div className="relative">
        <Select value={currentPriority} onValueChange={handlePriorityChange} disabled={isPriorityPending}>
          <SelectTrigger 
            className={cn(
              "h-7 px-2.5 text-xs font-medium rounded-full border-0 gap-1.5 w-auto",
              priorityOption?.color,
              isPriorityPending && "opacity-70"
            )}
          >
            <SelectValue />
            {isPriorityPending && <Loader2 className="h-3 w-3 animate-spin" />}
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  option.color
                )}>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date Picker */}
      <div className="relative">
        <label 
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-full cursor-pointer transition-colors",
            "bg-muted/50 hover:bg-muted border border-border",
            isDatePending && "opacity-70"
          )}
        >
          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground">
            {currentDueDate 
              ? format(new Date(currentDueDate), 'MMM d, yyyy')
              : 'Set due date'
            }
          </span>
          {isDatePending && <Loader2 className="h-3 w-3 animate-spin" />}
          <input
            type="date"
            value={currentDueDate ? currentDueDate.split('T')[0] : ''}
            onChange={handleDateChange}
            disabled={isDatePending}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  )
}
