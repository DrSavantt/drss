import { memo, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, FolderKanban, FileText, Sparkles, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  email: string
  status: "onboarded" | "onboarding" | "new"
  projectCount: number
  contentCount: number
  aiSpend: number
  industry: string
}

interface ClientCardProps {
  client: Client
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  onboarded: { label: "Onboarded", className: "bg-success/10 text-success border-success/20" },
  onboarding: { label: "Onboarding", className: "bg-warning/10 text-warning border-warning/20" },
  new: { label: "New", className: "bg-info/10 text-info border-info/20" },
}

// PERFORMANCE OPTIMIZATION: Memoized to prevent re-renders when parent state changes
// Only re-renders when the specific client prop changes
export const ClientCard = memo(function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  // Memoize status lookup to prevent recalculation every render
  const status = useMemo(() => statusConfig[client.status], [client.status])

  return (
    <div className="group relative">
      <Link href={`/dashboard/clients/${client.id}`}>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {client.name}
                </h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium text-card-foreground">{client.projectCount}</span>
                <span className="text-muted-foreground"> projects</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium text-card-foreground">{client.contentCount}</span>
                <span className="text-muted-foreground"> content</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-card-foreground">${client.aiSpend.toFixed(0)}</span>
            </div>
          </div>

          {/* Industry Tag */}
          <div className="mt-4">
            <span className="text-xs text-muted-foreground">{client.industry}</span>
          </div>
        </div>
      </Link>

      {/* 3-dot dropdown menu - appears on hover */}
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-muted z-10"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit(client.id)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Client
              </DropdownMenuItem>
            )}
            {onEdit && onDelete && <DropdownMenuSeparator />}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(client.id)
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
})

ClientCard.displayName = 'ClientCard'
