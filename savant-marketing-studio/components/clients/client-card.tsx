import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Building2, FolderKanban, FileText, Sparkles } from "lucide-react"
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
}

const statusConfig = {
  onboarded: { label: "Onboarded", className: "bg-success/10 text-success border-success/20" },
  onboarding: { label: "Onboarding", className: "bg-warning/10 text-warning border-warning/20" },
  new: { label: "New", className: "bg-info/10 text-info border-info/20" },
}

export function ClientCard({ client }: ClientCardProps) {
  const status = statusConfig[client.status]

  return (
    <Link href={`/dashboard/clients/${client.id}`}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
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
  )
}
