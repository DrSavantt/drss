"use client"

import { useState } from "react"
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientCard } from "./client-card"
import { NewClientDialog } from "./new-client-dialog"

const mockClients = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "hello@acme.com",
    status: "onboarded" as const,
    projectCount: 5,
    contentCount: 23,
    aiSpend: 125.5,
    industry: "SaaS",
  },
  {
    id: "2",
    name: "TechStart Inc",
    email: "contact@techstart.io",
    status: "onboarding" as const,
    projectCount: 2,
    contentCount: 8,
    aiSpend: 45.0,
    industry: "Technology",
  },
  {
    id: "3",
    name: "NewCo Industries",
    email: "info@newco.com",
    status: "new" as const,
    projectCount: 1,
    contentCount: 3,
    aiSpend: 12.25,
    industry: "Manufacturing",
  },
  {
    id: "4",
    name: "Growth Labs",
    email: "team@growthlabs.co",
    status: "onboarded" as const,
    projectCount: 8,
    contentCount: 45,
    aiSpend: 234.8,
    industry: "Marketing",
  },
  {
    id: "5",
    name: "Velocity Ventures",
    email: "hello@velocity.vc",
    status: "onboarding" as const,
    projectCount: 3,
    contentCount: 12,
    aiSpend: 67.9,
    industry: "Finance",
  },
]

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredClients = mockClients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "projects":
          return b.projectCount - a.projectCount
        case "content":
          return b.contentCount - a.contentCount
        case "spend":
          return b.aiSpend - a.aiSpend
        default:
          return 0
      }
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client portfolio</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="onboarded">Onboarded</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="projects">Most Projects</SelectItem>
              <SelectItem value="content">Most Content</SelectItem>
              <SelectItem value="spend">AI Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-muted-foreground">No clients found</p>
          <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
            Add your first client
          </Button>
        </div>
      )}

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
