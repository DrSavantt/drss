"use client"

import { useState } from "react"
import { Plus, Upload, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FrameworkCard } from "./framework-card"
import { NewFrameworkDialog } from "./new-framework-dialog"
import { cn } from "@/lib/utils"

const categories = ["All", "Copywriting", "Email", "Ads", "Funnel", "Landing Page", "Social"]

const mockFrameworks = [
  {
    id: "1",
    name: "AIDA Framework",
    description: "Classic attention, interest, desire, action formula for persuasive copywriting",
    category: "Copywriting",
    characterCount: 2450,
    chunkCount: 3,
  },
  {
    id: "2",
    name: "PAS Formula",
    description: "Problem-Agitate-Solution formula for sales copy that converts",
    category: "Copywriting",
    characterCount: 1890,
    chunkCount: 2,
  },
  {
    id: "3",
    name: "RMBC Method",
    description: "Stefan Georgi's Research, Mechanism, Brief, Copy method for long-form sales letters",
    category: "Copywriting",
    characterCount: 5200,
    chunkCount: 6,
  },
  {
    id: "4",
    name: "7-Part Welcome Sequence",
    description: "Complete email sequence template for onboarding new subscribers",
    category: "Email",
    characterCount: 3100,
    chunkCount: 4,
  },
  {
    id: "5",
    name: "Facebook Ad Templates",
    description: "Collection of high-converting Facebook ad formats for different awareness levels",
    category: "Ads",
    characterCount: 2800,
    chunkCount: 3,
  },
  {
    id: "6",
    name: "Tripwire Funnel Blueprint",
    description: "Complete funnel structure from lead magnet to tripwire to core offer",
    category: "Funnel",
    characterCount: 4100,
    chunkCount: 5,
  },
  {
    id: "7",
    name: "Hero Section Formula",
    description: "Proven structure for landing page hero sections that capture attention",
    category: "Landing Page",
    characterCount: 1650,
    chunkCount: 2,
  },
  {
    id: "8",
    name: "Social Proof Blocks",
    description: "Templates for testimonials, case studies, and trust indicators",
    category: "Social",
    characterCount: 2200,
    chunkCount: 3,
  },
]

export function FrameworkLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredFrameworks = mockFrameworks.filter((framework) => {
    const matchesSearch =
      framework.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      framework.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || framework.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Framework Library</h1>
          <p className="text-muted-foreground">Your copywriting frameworks power AI generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            New Framework
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search frameworks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Framework Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFrameworks.map((framework) => (
          <FrameworkCard key={framework.id} framework={framework} />
        ))}
      </div>

      {filteredFrameworks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No frameworks found</p>
          <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
            Create your first framework
          </Button>
        </div>
      )}

      <NewFrameworkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
