# Cursor UI Instructions for DRSS Marketing Studio

> **IMPORTANT**: This file defines how Cursor should build UI for this project.
> Always follow these patterns for consistency.

> **⚠️ CRITICAL**: Always read `.cursorrules` in the project root before creating UI.
> The rules file enforces the v0 design system and theme variables.

---

## Core Principles

1. **Use v0 Design Patterns** - All UI follows patterns from `docs/DESIGN_SYSTEM.md`
2. **Theme Variables Only** - NEVER use hardcoded colors (bg-zinc-*, bg-black, etc.)
3. **Dark-First Design** - Default to dark mode with red (`#dc2626`) accent
4. **Tailwind Only** - No inline styles, CSS modules, or styled-components
5. **Component Reuse** - Always check existing components before creating new ones
6. **Backend Integration** - All data flows through server actions or API routes

---

## Required Imports

```tsx
// ALWAYS import UI components from @/components/ui/*
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { StatCard } from "@/components/ui/stat-card"

// ALWAYS import utilities
import { cn } from "@/lib/utils"

// ALWAYS import icons from lucide-react
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
```

---

## Styling Rules

### Colors - ALWAYS Use These Classes

| Purpose | Class | NEVER Use |
|---------|-------|-----------|
| Primary actions | `bg-primary hover:bg-primary/90` | `bg-red-600` |
| Text primary | `text-foreground` | `text-white` |
| Text muted | `text-muted-foreground` | `text-gray-400` |
| Backgrounds | `bg-background` or `bg-card` | `bg-black` |
| Borders | `border-border` | `border-gray-800` |
| Success | `text-success` | `text-green-500` |
| Warning | `text-warning` | `text-yellow-500` |
| Destructive | `bg-destructive` or `text-destructive` | `bg-red-500` |

### Typography - Use These Patterns

```tsx
// Page Title - ALWAYS use this pattern
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<p className="text-muted-foreground">Page description</p>

// Section Title
<h2 className="text-2xl font-bold tracking-tight mb-4">Section Title</h2>

// Card Title (inside CardHeader)
<CardTitle className="flex items-center gap-2">
  <Icon className="h-5 w-5 text-muted-foreground" />
  Title
</CardTitle>
```

### Spacing - Follow These Patterns

```tsx
// Page layout
<div className="space-y-6">  {/* or space-y-8 for dashboard */}

// Grid layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">  {/* 4-column grid */}
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">  {/* 3-column grid */}
<div className="grid gap-6 lg:grid-cols-2">  {/* 2-column grid */}

// Flex with gap
<div className="flex items-center gap-2">
<div className="flex flex-col gap-4">
```

---

## Component Patterns

### Page Header Pattern

```tsx
// ALWAYS use this header pattern for list pages
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">Description of the page</p>
  </div>
  <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
    <Plus className="mr-2 h-4 w-4" />
    New Item
  </Button>
</div>
```

### Filter Bar Pattern

```tsx
// ALWAYS use this filter pattern
<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-9"
    />
  </div>
  <div className="flex gap-2">
    <Select value={filter} onValueChange={setFilter}>
      <SelectTrigger className="w-[140px]">
        <Filter className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {/* More options */}
      </SelectContent>
    </Select>
  </div>
</div>
```

### Card Pattern

```tsx
// Standard content card
<Card className="border-border bg-card">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
      Card Title
    </CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>

// Interactive card (for clickable items)
<div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
  {/* Content here */}
</div>
```

### Button Patterns

```tsx
// Primary action (ALWAYS use for main CTA)
<Button className="bg-primary hover:bg-primary/90">
  <Plus className="mr-2 h-4 w-4" />
  Create New
</Button>

// Secondary action
<Button variant="outline">
  <Upload className="mr-2 h-4 w-4" />
  Import
</Button>

// Destructive action
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-5 w-5" />
</Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      Generate
    </>
  )}
</Button>
```

### Badge Status Patterns

```tsx
// Status badges - ALWAYS use these exact patterns
const statusConfig = {
  onboarded: { label: "Onboarded", className: "bg-success/10 text-success border-success/20" },
  onboarding: { label: "Onboarding", className: "bg-warning/10 text-warning border-warning/20" },
  new: { label: "New", className: "bg-info/10 text-info border-info/20" },
}

<Badge variant="outline" className={cn("text-xs", statusConfig[status].className)}>
  {statusConfig[status].label}
</Badge>

// Priority badges
const priorityConfig = {
  low: { label: "Low", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

// AI badge
<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
  <Sparkles className="mr-1 h-3 w-3" />
  AI
</Badge>
```

### Empty State Pattern

```tsx
// ALWAYS use this pattern for empty states
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
    <FileText className="h-12 w-12 text-muted-foreground/50" />
    <p className="mt-4 text-muted-foreground">No items found</p>
    <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
      Create your first item
    </Button>
  </div>
)}
```

### Loading State Pattern

```tsx
// Skeleton loading for cards
{loading && (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
    ))}
  </div>
)}

// Skeleton loading for list
{loading && (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
    ))}
  </div>
)}
```

### Modal/Dialog Pattern

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Description explaining what this modal does.
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Field Name</Label>
          <Input id="name" placeholder="Placeholder" required />
        </div>
        {/* More fields */}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Bulk Actions Pattern

```tsx
// Fixed bottom bar for bulk actions
{selectedItems.length > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-3 shadow-lg">
    <span className="text-sm font-medium">{selectedItems.length} selected</span>
    <div className="h-4 w-px bg-border" />
    <Button variant="outline" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
    <Button variant="outline" size="sm">
      Export
    </Button>
  </div>
)}
```

---

## Data Fetching Patterns

### Client-Side Fetch

```tsx
// ALWAYS use this pattern for client-side data fetching
"use client"

import { useState, useEffect } from "react"

export function ComponentName() {
  const [data, setData] = useState<DataType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/endpoint')
        const result = await res.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSkeleton />
  }

  return <ActualContent data={data} />
}
```

### Server Action Mutations

```tsx
// ALWAYS use server actions for mutations
import { createItem } from "@/app/actions/items"
import { useRouter } from "next/navigation"

const router = useRouter()

const handleSubmit = async (formData: FormData) => {
  try {
    setIsLoading(true)
    await createItem(formData)
    router.refresh()
    onClose()
  } catch (error) {
    console.error('Failed to create:', error)
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}
```

---

## File Structure Rules

### New Page Files

```
app/dashboard/[feature]/
├── page.tsx          # Main page (minimal, imports component)
├── [id]/
│   └── page.tsx      # Detail page
└── new/
    └── page.tsx      # Create page (if separate from dialog)
```

### New Component Files

```
components/[feature]/
├── feature-list.tsx       # Main list component
├── feature-card.tsx       # Individual card component
├── feature-detail.tsx     # Detail view component
└── new-feature-dialog.tsx # Create/edit modal
```

### Page File Pattern

```tsx
// pages should be minimal, just import and render
import { FeatureComponent } from "@/components/feature/feature-component"

export default function FeaturePage() {
  return <FeatureComponent />
}
```

---

## Icon Usage

### Standard Icon Mappings

| Icon Name | Usage |
|-----------|-------|
| `Plus` | Add/Create actions |
| `Search` | Search inputs |
| `Filter` | Filter controls |
| `ArrowUpDown` | Sort controls |
| `Settings` | Settings links |
| `Trash2` | Delete actions |
| `RefreshCw` | Reload/regenerate |
| `Copy` | Copy to clipboard |
| `Check` | Success/completion |
| `AlertCircle` | Warnings |
| `Clock` | Time/timestamps |
| `Users` | Client-related |
| `FolderKanban` | Projects |
| `FileText` | Content/documents |
| `Sparkles` | AI features |
| `BookOpen` | Frameworks |
| `BookMarked` | Journal |
| `ChevronLeft` | Back navigation |
| `ChevronDown` | Expand/collapse |
| `MoreHorizontal` | More options |

### Icon Sizing

```tsx
// In buttons/inputs
<Icon className="h-4 w-4" />

// In card headers
<Icon className="h-5 w-5 text-muted-foreground" />

// In stat cards/large displays
<Icon className="h-6 w-6 text-primary" />

// In empty states
<Icon className="h-12 w-12 text-muted-foreground/50" />
```

---

## Anti-Patterns - NEVER Do These

### ❌ Don't Use Hard-Coded Colors

```tsx
// BAD
<div className="bg-[#1a1a1a] text-white border-gray-700">

// GOOD
<div className="bg-card text-card-foreground border-border">
```

### ❌ Don't Create Inline Styles

```tsx
// BAD
<div style={{ padding: '24px', marginBottom: '16px' }}>

// GOOD
<div className="p-6 mb-4">
```

### ❌ Don't Skip Loading States

```tsx
// BAD
export function Component() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(...) }, [])
  return <div>{data.map(...)}</div>  // Crashes when data is null
}

// GOOD
export function Component() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  if (loading) return <Skeleton />
  return <div>{data.map(...)}</div>
}
```

### ❌ Don't Create Duplicate Components

```tsx
// BAD - Creating a new card component
export function MyCustomCard() { ... }

// GOOD - Use existing Card from @/components/ui/card
import { Card, CardHeader, CardContent } from "@/components/ui/card"
```

### ❌ Don't Skip Empty States

```tsx
// BAD
{items.map(item => <ItemCard />)}

// GOOD
{items.length > 0 ? (
  items.map(item => <ItemCard />)
) : (
  <EmptyState />
)}
```

### ❌ Don't Use Different Button Styles

```tsx
// BAD - Inconsistent button styling
<button className="rounded bg-red-500 px-4 py-2">Click</button>

// GOOD - Use Button component
<Button className="bg-primary hover:bg-primary/90">Click</Button>
```

---

## Quick Templates

### When Asked to Build a List Page

```tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Item {
  id: string
  // ... properties
}

export function ItemList() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/items')
        const data = await res.json()
        setItems(data)
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || item.status === filter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Items</h1>
            <p className="text-muted-foreground">Manage your items</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Manage your items</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-muted-foreground">No items found</p>
          <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
            Add your first item
          </Button>
        </div>
      )}

      <NewItemDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
```

### When Asked to Build a Card Component

```tsx
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Icon, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  name: string
  status: "active" | "inactive" | "pending"
  // ... more properties
}

interface ItemCardProps {
  item: Item
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-muted" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
}

export function ItemCard({ item }: ItemCardProps) {
  const status = statusConfig[item.status]

  return (
    <Link href={`/dashboard/items/${item.id}`}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              <span className="font-medium text-card-foreground">{item.count}</span>
              <span className="text-muted-foreground"> items</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

### When Asked to Build a Dialog

```tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createItem } from "@/app/actions/items"
import { useRouter } from "next/navigation"

interface NewItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewItemDialog({ open, onOpenChange }: NewItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    setIsLoading(true)
    try {
      await createItem(formData)
      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your collection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Item name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Brief description" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="active">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Checklist Before Submitting UI Changes

- [ ] Uses components from `@/components/ui/*`
- [ ] Uses CSS variables for colors (not hardcoded)
- [ ] Follows spacing patterns (`space-y-6`, `gap-4`)
- [ ] Has loading state
- [ ] Has empty state
- [ ] Page header follows pattern
- [ ] Buttons use correct variants
- [ ] Icons are from `lucide-react`
- [ ] Data fetching uses established patterns
- [ ] Mobile responsive (uses responsive grid)

---

## Reference Files

When building new UI, reference these files:

- **🔴 REQUIRED: Cursor Rules**: `.cursorrules` (project root - enforces design system)
- **🔴 REQUIRED: Design System**: `docs/DESIGN_SYSTEM.md` (complete component reference)
- **Dashboard Example**: `app/dashboard/page.tsx`
- **List Page Example**: `components/clients/client-list.tsx`
- **Card Example**: `components/clients/client-card.tsx`
- **Dialog Example**: `components/clients/new-client-dialog.tsx`
- **CSS Variables**: `app/globals.css`
- **UI Design System Examples**: `ui-design-system/` (v0 patterns)

