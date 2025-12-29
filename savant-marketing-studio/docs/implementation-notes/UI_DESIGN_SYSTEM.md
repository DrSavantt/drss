# DRSS UI Design System

> **Master Source of Truth** for all UI development in the DRSS Marketing Studio
> 
> Last Updated: December 24, 2025
> v0 Source: `/Users/rocky/Downloads/ui-design-system/`

---

## Quick Stats

| Metric | Value |
|--------|-------|
| v0 Design Folder | `/Users/rocky/Downloads/ui-design-system/` |
| Active UI Components | 57 in v0, 22 in production |
| Feature Components | 22 in v0, 26 in production |
| Pages Using v0 Design | 9/9 (100%) |
| Design Compliance | High (CSS variables aligned) |

---

## Table of Contents

1. [Component Audit](#component-audit)
2. [Page Audit](#page-audit)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library](#component-library)
7. [Page Templates](#page-templates)
8. [Backend Wiring Reference](#backend-wiring-reference)
9. [Migration Checklist](#migration-checklist)

---

## Component Audit

### UI Components (shadcn/radix)

| Component | Purpose | v0 Has | Production Has | Status |
|-----------|---------|--------|----------------|--------|
| `accordion` | Expandable content sections | ✅ | ❌ | Add to production |
| `alert-dialog` | Confirmation dialogs | ✅ | ✅ | ✅ Synced |
| `alert` | Status/notification alerts | ✅ | ❌ | Add to production |
| `aspect-ratio` | Responsive media containers | ✅ | ❌ | Add if needed |
| `avatar` | User/client profile images | ✅ | ✅ | ✅ Synced |
| `badge` | Status/tag indicators | ✅ | ✅ | ✅ Synced |
| `breadcrumb` | Navigation breadcrumbs | ✅ | ❌ | Add to production |
| `button-group` | Grouped button actions | ✅ | ❌ | Add if needed |
| `button` | Primary action buttons | ✅ | ✅ | ✅ Synced |
| `calendar` | Date picker calendar | ✅ | ❌ | Add if needed |
| `card` | Content containers | ✅ | ✅ | ✅ Synced |
| `carousel` | Image/content carousel | ✅ | ❌ | Add if needed |
| `chart` | Data visualization | ✅ | ❌ | Add for analytics |
| `checkbox` | Boolean inputs | ✅ | ✅ | ✅ Synced |
| `collapsible` | Expandable sections | ✅ | ✅ | ✅ Synced |
| `command` | Command palette | ✅ | ❌ | Custom implementation |
| `context-menu` | Right-click menus | ✅ | ❌ | Add if needed |
| `dialog` | Modal dialogs | ✅ | ✅ | ✅ Synced |
| `drawer` | Slide-out panels | ✅ | ✅ | ✅ Synced |
| `dropdown-menu` | Dropdown menus | ✅ | ✅ | ✅ Synced |
| `empty` | Empty state component | ✅ | ❌ | Add to production |
| `field` | Form field wrapper | ✅ | ❌ | Add if needed |
| `form` | React Hook Form wrapper | ✅ | ❌ | Add if needed |
| `hover-card` | Hover preview cards | ✅ | ❌ | Add if needed |
| `input-group` | Input with addons | ✅ | ❌ | Add if needed |
| `input-otp` | OTP input fields | ✅ | ❌ | Add if needed |
| `input` | Text input fields | ✅ | ✅ | ✅ Synced |
| `item` | List item component | ✅ | ❌ | Add if needed |
| `kbd` | Keyboard shortcut display | ✅ | ❌ | Add to production |
| `label` | Form labels | ✅ | ✅ | ✅ Synced |
| `menubar` | Menu bar navigation | ✅ | ❌ | Not needed |
| `navigation-menu` | Navigation component | ✅ | ❌ | Custom sidebar |
| `pagination` | Page navigation | ✅ | ❌ | Add for lists |
| `popover` | Popover overlays | ✅ | ❌ | Add if needed |
| `progress` | Progress bars | ✅ | ✅ | ✅ Synced |
| `radio-group` | Radio button groups | ✅ | ✅ | ✅ Synced |
| `resizable` | Resizable panels | ✅ | ❌ | Add if needed |
| `scroll-area` | Custom scrollbars | ✅ | ❌ | Add if needed |
| `select` | Dropdown select | ✅ | ✅ | ✅ Synced |
| `separator` | Visual separators | ✅ | ❌ | Add to production |
| `sheet` | Side sheet panels | ✅ | ✅ | ✅ Synced |
| `sidebar` | App sidebar | ✅ | ❌ | Custom implementation |
| `skeleton` | Loading skeletons | ✅ | ❌ | Custom implementation |
| `slider` | Range sliders | ✅ | ❌ | Add if needed |
| `sonner` | Toast notifications | ✅ | ❌ | Add to production |
| `spinner` | Loading spinner | ✅ | ❌ | Custom implementation |
| `stat-card` | Dashboard stat cards | ✅ | ✅ | ✅ Synced |
| `switch` | Toggle switches | ✅ | ✅ | ✅ Synced |
| `table` | Data tables | ✅ | ❌ | Add to production |
| `tabs` | Tab navigation | ✅ | ✅ | ✅ Synced |
| `textarea` | Multi-line text input | ✅ | ✅ | ✅ Synced |
| `toast` | Toast notifications | ✅ | ❌ | Custom implementation |
| `toaster` | Toast container | ✅ | ❌ | Add to production |
| `toggle-group` | Toggle button groups | ✅ | ❌ | Add if needed |
| `toggle` | Toggle buttons | ✅ | ❌ | Add if needed |
| `tooltip` | Hover tooltips | ✅ | ❌ | Add to production |

### Feature Components

| Component | Purpose | v0 Location | Production Location | Status |
|-----------|---------|-------------|---------------------|--------|
| `AppShell` | Main layout wrapper | `components/layout/app-shell.tsx` | ✅ Identical | ✅ Active |
| `Sidebar` | Navigation sidebar | `components/layout/sidebar.tsx` | ✅ Identical (route adjusted) | ✅ Active |
| `TopNav` | Top navigation bar | `components/layout/top-nav.tsx` | ✅ Identical | ✅ Active |
| `ClientList` | Client list view | `components/clients/client-list.tsx` | ✅ With data fetching | ✅ Active |
| `ClientCard` | Client card display | `components/clients/client-card.tsx` | ✅ Identical | ✅ Active |
| `NewClientDialog` | Add client modal | `components/clients/new-client-dialog.tsx` | ✅ With server action | ✅ Active |
| `ContentLibrary` | Content list view | `components/content/content-library.tsx` | ✅ With data fetching | ✅ Active |
| `FrameworkLibrary` | Framework list | `components/frameworks/framework-library.tsx` | ✅ With data fetching | ✅ Active |
| `FrameworkCard` | Framework card | `components/frameworks/framework-card.tsx` | ✅ Identical | ✅ Active |
| `ProjectsKanban` | Kanban board | `components/projects/projects-kanban.tsx` | ✅ With data fetching | ✅ Active |
| `ProjectCard` | Project card | `components/projects/project-card.tsx` | ✅ Identical | ✅ Active |
| `KanbanColumn` | Kanban column | `components/projects/kanban-column.tsx` | ✅ Identical | ✅ Active |
| `AIStudio` | AI generation UI | `components/ai-studio/ai-studio.tsx` | ✅ With API wiring | ✅ Active |
| `Journal` | Journal/notes view | `components/journal/journal.tsx` | ✅ With data fetching | ✅ Active |
| `Settings` | Settings page | `components/settings/settings.tsx` | ✅ With auth | ✅ Active |
| `StatCard` | Dashboard metrics | `components/ui/stat-card.tsx` | ✅ Identical | ✅ Active |

---

## Page Audit

| Page | Route | v0 Components Used | Custom Components | Backend Wired | Design Match |
|------|-------|-------------------|-------------------|---------------|--------------|
| Dashboard | `/dashboard` | StatCard, Card, Badge | MetricCards, UrgentItems | ✅ Yes | ✅ Full |
| Clients List | `/dashboard/clients` | ClientList, ClientCard, NewClientDialog | None | ✅ Yes | ✅ Full |
| Client Detail | `/dashboard/clients/[id]` | Card, Badge, Button | QuestionnaireStatus | ✅ Yes | ✅ Full |
| Content Library | `/dashboard/content` | ContentLibrary | CreateContentModal | ✅ Yes | ✅ Full |
| Content Detail | `/dashboard/content/[id]` | Card, Badge | FilePreview, TiptapEditor | ✅ Yes | ⚠️ Partial |
| Frameworks | `/dashboard/frameworks` | FrameworkLibrary, FrameworkCard | None | ✅ Yes | ✅ Full |
| Projects Board | `/dashboard/projects/board` | ProjectsKanban, ProjectCard, KanbanColumn | None | ✅ Yes | ✅ Full |
| AI Studio | `/dashboard/ai/generate` | AIStudio | None | ✅ Yes | ✅ Full |
| Journal | `/dashboard/journal` | Journal | MentionAutocomplete | ✅ Yes | ✅ Full |
| Settings | `/dashboard/settings` | Settings | QuestionnaireSettings | ✅ Yes | ✅ Full |
| Analytics | `/dashboard/analytics` | Card, StatCard | Chart components | ✅ Yes | ⚠️ Custom |
| Archive | `/dashboard/archive` | Card | ArchiveList | ✅ Yes | ✅ Full |

---

## Color Palette

### Dark Mode (Primary - Default)

| Name | CSS Variable | Hex Value | Tailwind Class | Usage |
|------|-------------|-----------|----------------|-------|
| Background | `--background` | `#0a0a0a` | `bg-background` | Main app background |
| Foreground | `--foreground` | `#fafafa` | `text-foreground` | Primary text |
| Card | `--card` | `#141414` | `bg-card` | Cards, panels, surfaces |
| Card Foreground | `--card-foreground` | `#fafafa` | `text-card-foreground` | Text on cards |
| Popover | `--popover` | `#1a1a1a` | `bg-popover` | Dropdowns, tooltips |
| **Primary (Red)** | `--primary` | `#dc2626` | `bg-primary` | Brand accent, CTAs |
| Primary Foreground | `--primary-foreground` | `#ffffff` | `text-primary-foreground` | Text on primary |
| Secondary | `--secondary` | `#1a1a1a` | `bg-secondary` | Secondary surfaces |
| Muted | `--muted` | `#141414` | `bg-muted` | Muted backgrounds |
| Muted Foreground | `--muted-foreground` | `#a1a1a1` | `text-muted-foreground` | Secondary text |
| Accent | `--accent` | `#1a1a1a` | `bg-accent` | Hover states |
| **Destructive** | `--destructive` | `#ef4444` | `bg-destructive` | Errors, delete actions |
| Border | `--border` | `#262626` | `border-border` | All borders |
| Input | `--input` | `#141414` | `bg-input` | Form input backgrounds |
| Ring | `--ring` | `#dc2626` | `ring-ring` | Focus rings |

### Status Colors

| Name | CSS Variable | Hex Value | Tailwind Class | Usage |
|------|-------------|-----------|----------------|-------|
| Success | `--success` | `#22c55e` | `text-success` | Completed, positive |
| Warning | `--warning` | `#f59e0b` | `text-warning` | Caution, in-progress |
| Info | `--info` | `#3b82f6` | `text-info` | Informational, new |
| Error | `--error` | `#ef4444` | `text-destructive` | Errors, critical |

### Sidebar Colors

| Name | CSS Variable | Hex Value | Usage |
|------|-------------|-----------|-------|
| Sidebar BG | `--sidebar` | `#0a0a0a` | Sidebar background |
| Sidebar Border | `--sidebar-border` | `#262626` | Sidebar borders |
| Sidebar Accent | `--sidebar-accent` | `rgba(220, 38, 38, 0.1)` | Active nav item bg |
| Sidebar Primary | `--sidebar-primary` | `#dc2626` | Active nav accent |

### Light Mode

| Name | CSS Variable | Hex Value | Usage |
|------|-------------|-----------|-------|
| Background | `--background` | `#fafafa` | Main app background |
| Foreground | `--foreground` | `#0a0a0a` | Primary text |
| Card | `--card` | `#ffffff` | Cards, panels |
| Border | `--border` | `#e5e5e5` | All borders |
| Muted | `--muted` | `#f5f5f5` | Muted backgrounds |

---

## Typography

### Font Families

| Type | Font | CSS Variable | Fallback |
|------|------|--------------|----------|
| Sans Serif | Inter | `--font-inter` | system-ui, sans-serif |
| Monospace | JetBrains Mono | `--font-jetbrains` | monospace |

### Text Sizes

| Element | Classes | Usage |
|---------|---------|-------|
| Page Title | `text-3xl font-bold tracking-tight` | Main page headings |
| Section Title | `text-2xl font-bold tracking-tight` | Section headings |
| Card Title | `font-semibold leading-none` | Card headers |
| Card Description | `text-muted-foreground text-sm` | Card subtitles |
| Body Text | `text-sm` | General content |
| Small Text | `text-xs` | Timestamps, metadata |
| Muted Text | `text-muted-foreground` | Secondary information |

### Heading Hierarchy

```tsx
// Page Title
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<p className="text-muted-foreground">Page description</p>

// Section Title
<h2 className="text-2xl font-bold tracking-tight mb-4">Section Title</h2>

// Card Title
<CardTitle className="flex items-center gap-2">
  <Icon className="h-5 w-5 text-muted-foreground" />
  Card Title
</CardTitle>
<CardDescription>Card description text</CardDescription>
```

---

## Spacing & Layout

### Spacing Scale

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| XS | 4px | `gap-1`, `p-1` | Tight spacing |
| SM | 8px | `gap-2`, `p-2` | Small gaps |
| MD | 16px | `gap-4`, `p-4` | Default spacing |
| LG | 24px | `gap-6`, `p-6` | Section spacing |
| XL | 32px | `gap-8`, `p-8` | Large gaps |

### Layout Patterns

```tsx
// Page Layout
<div className="space-y-6">  {/* Main content wrapper */}
  <div>  {/* Header section */}
    <h1>...</h1>
    <p>...</p>
  </div>
  <div>...</div>  {/* Content sections */}
</div>

// Grid Layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">  {/* Stats grid */}
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">  {/* Card grid */}
<div className="grid gap-6 lg:grid-cols-2">  {/* 2-column layout */}
<div className="grid gap-6 lg:grid-cols-[280px_1fr]">  {/* Sidebar layout */}
```

### Border Radius

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| Base | 0.5rem | `rounded-lg` | Buttons, inputs |
| Large | 0.75rem | `rounded-xl` | Cards, dialogs |
| Full | 50% | `rounded-full` | Avatars, pills |

---

## Component Library

### Cards

```tsx
// Standard Card
<Card className="border-border bg-card">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
      Card Title
    </CardTitle>
    <CardDescription>Description text here</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Interactive Card (hover effect)
<div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
  {/* Content */}
</div>

// Stat Card
<StatCard
  title="Active Clients"
  value={12}
  icon={Users}
  trend={{ value: 8, isPositive: true }}
/>
```

### Buttons

```tsx
// Primary Button (Red)
<Button className="bg-primary hover:bg-primary/90">
  <Plus className="mr-2 h-4 w-4" />
  New Item
</Button>

// Secondary/Outline Button
<Button variant="outline">
  <Upload className="mr-2 h-4 w-4" />
  Import
</Button>

// Ghost Button
<Button variant="ghost" size="icon">
  <Settings className="h-5 w-5" />
</Button>

// Destructive Button
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</Button>

// Link Button
<Button variant="link" className="text-primary">
  Learn more
</Button>
```

### Button Variants

| Variant | Classes | Usage |
|---------|---------|-------|
| Default | `bg-primary text-primary-foreground hover:bg-primary/90` | Primary actions |
| Destructive | `bg-destructive text-white hover:bg-destructive/90` | Delete, danger |
| Outline | `border bg-background hover:bg-accent` | Secondary actions |
| Secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80` | Tertiary actions |
| Ghost | `hover:bg-accent hover:text-accent-foreground` | Icon buttons |
| Link | `text-primary underline-offset-4 hover:underline` | Text links |

### Button Sizes

| Size | Classes | Usage |
|------|---------|-------|
| Default | `h-9 px-4 py-2` | Standard buttons |
| SM | `h-8 px-3` | Compact buttons |
| LG | `h-10 px-6` | Large CTAs |
| Icon | `size-9` | Icon-only buttons |

### Forms

```tsx
// Text Input with Search Icon
<div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9"
  />
</div>

// Form Field with Label
<div className="grid gap-2">
  <Label htmlFor="name">Company Name</Label>
  <Input id="name" placeholder="Acme Corporation" required />
</div>

// Select Dropdown
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-[140px]">
    <Filter className="mr-2 h-4 w-4" />
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Items</SelectItem>
    <SelectItem value="active">Active</SelectItem>
  </SelectContent>
</Select>

// Switch with Label
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="auto-save">Auto-save to library</Label>
    <p className="text-xs text-muted-foreground">Description text</p>
  </div>
  <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
</div>
```

### Badges

```tsx
// Default Badge (Primary)
<Badge>Active</Badge>

// Status Badges
<Badge variant="outline" className="bg-success/10 text-success border-success/20">
  Onboarded
</Badge>
<Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
  Onboarding
</Badge>
<Badge variant="outline" className="bg-info/10 text-info border-info/20">
  New
</Badge>
<Badge variant="destructive">Overdue</Badge>

// AI Badge
<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
  <Sparkles className="mr-1 h-3 w-3" />
  AI
</Badge>
```

### Dialogs/Modals

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Description text explaining the modal purpose.
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {/* Form fields */}
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

### Empty States

```tsx
// Empty State Pattern
<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
  <FileText className="h-12 w-12 text-muted-foreground/50" />
  <p className="mt-4 text-muted-foreground">No items found</p>
  <Button variant="link" onClick={handleCreate} className="mt-2 text-primary">
    Create your first item
  </Button>
</div>

// Inline Empty State
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-muted-foreground">No entries yet</p>
    <p className="text-sm text-muted-foreground">Start typing below to add your first note</p>
  </div>
)}
```

### Bulk Actions Bar

```tsx
{selectedItems.length > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-3 shadow-lg">
    <span className="text-sm font-medium">{selectedItems.length} selected</span>
    <div className="h-4 w-px bg-border" />
    <Button variant="outline" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
    <Button variant="outline" size="sm">
      Move to...
    </Button>
    <Button variant="outline" size="sm">
      Export
    </Button>
  </div>
)}
```

### Navigation Active States

```tsx
// Sidebar Navigation Item
<Link
  href={item.href}
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
    isActive
      ? "border-l-2 border-primary bg-sidebar-accent text-sidebar-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
  )}
>
  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
  <span>{item.label}</span>
</Link>
```

### Loading States

```tsx
// Skeleton Cards
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
  ))}
</div>

// Skeleton List Items
<div className="space-y-2">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
  ))}
</div>

// Button Loading State
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

---

## Page Templates

### Dashboard Page

```tsx
export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Jay</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>...</Card>
        <Card>...</Card>
      </div>
    </div>
  )
}
```

### List Page (Clients, Content, etc.)

```tsx
export function EntityList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Title</h1>
          <p className="text-muted-foreground">Description</p>
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
          <Input placeholder="Search..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select><SelectTrigger>...</SelectTrigger></Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>

      {/* Empty State */}
      {items.length === 0 && <EmptyState />}

      {/* Dialog */}
      <NewItemDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
```

### Detail Page

```tsx
export default function DetailPage({ params }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/dashboard/items" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Items
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Main Content</CardTitle>
          </CardHeader>
          <CardContent>...</CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Content</CardTitle>
            </CardHeader>
            <CardContent>...</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

### Settings Page with Tabs

```tsx
export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form fields */}
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Backend Wiring Reference

### Server Actions Location

All server actions are in `/app/actions/`:

| File | Actions | Used By |
|------|---------|---------|
| `clients.ts` | `createClient`, `updateClient`, `deleteClient` | Client pages |
| `content.ts` | `createContent`, `updateContent`, `deleteContent`, `bulkDeleteContent` | Content pages |
| `projects.ts` | `createProject`, `updateProject`, `deleteProject`, `updateProjectStatus` | Project pages |
| `frameworks.ts` | `createFramework`, `updateFramework`, `deleteFramework` | Framework pages |
| `journal.ts` | `createEntry`, `updateEntry`, `deleteEntry` | Journal page |
| `questionnaire.ts` | `submitQuestionnaire`, `resetQuestionnaire` | Questionnaire pages |
| `ai.ts` | `generateContent` | AI Studio |
| `auth.ts` | `verifyPin`, `logout` | Auth flows |

### API Routes Location

All API routes are in `/app/api/`:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/clients` | GET, POST | Client CRUD |
| `/api/clients/[id]` | GET, PUT, DELETE | Single client |
| `/api/content` | GET, POST | Content CRUD |
| `/api/projects` | GET, POST | Project CRUD |
| `/api/frameworks` | GET, POST | Framework CRUD |
| `/api/metrics` | GET | Dashboard metrics |
| `/api/activity-log` | GET | Activity feed |
| `/api/analytics` | GET | Analytics data |
| `/api/search` | GET | Global search |
| `/api/user` | GET | Current user |

### Data Fetching Patterns

```tsx
// Client-side fetch (most pages)
useEffect(() => {
  async function fetchData() {
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
  fetchData()
}, [dependencies])

// Server Action Mutation
import { createItem } from '@/app/actions/items'

const handleSubmit = async (formData) => {
  try {
    await createItem(formData)
    router.refresh()
    onClose()
  } catch (error) {
    setError(error.message)
  }
}
```

---

## Migration Checklist

### Components to Add to Production

- [ ] `accordion` - For expandable FAQ/settings sections
- [ ] `alert` - For status notifications
- [ ] `breadcrumb` - For deep navigation
- [ ] `chart` - For analytics visualizations
- [ ] `empty` - Structured empty state component
- [ ] `kbd` - For keyboard shortcut display
- [ ] `pagination` - For long lists
- [ ] `separator` - For visual dividers
- [ ] `sonner` - For toast notifications
- [ ] `table` - For data tables
- [ ] `tooltip` - For hover hints

### Pages Fully v0 Compliant ✅

- [x] Dashboard - Complete with data fetching
- [x] Clients List - Complete with data fetching
- [x] Client Detail - Complete with data fetching
- [x] Content Library - Complete with data fetching
- [x] Frameworks - Complete with data fetching
- [x] Projects Board - Complete with data fetching
- [x] AI Studio - Complete with API wiring
- [x] Journal - Complete with data fetching
- [x] Settings - Complete with auth

### Pages Needing Attention ⚠️

- [ ] Content Detail - Add v0 file preview patterns
- [ ] Analytics - Add v0 chart components
- [ ] Questionnaire Config - Review layout consistency

### CSS Variables Alignment ✅

The production `globals.css` is aligned with v0 design:
- Same color scheme (dark primary with red accent)
- Same spacing patterns
- Same border radius values
- Same typography setup

---

## Quick Reference

### Import Patterns

```tsx
// UI Components
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

// Custom Components
import { StatCard } from "@/components/ui/stat-card"
import { AppShell } from "@/components/layout/app-shell"

// Icons (Lucide)
import { Plus, Search, Filter, ArrowUpDown, Settings, Users, Sparkles } from "lucide-react"

// Utilities
import { cn } from "@/lib/utils"
```

### Common Icon Mappings

| Icon | Usage |
|------|-------|
| `Plus` | Add/Create buttons |
| `Search` | Search inputs |
| `Filter` | Filter dropdowns |
| `ArrowUpDown` | Sort controls |
| `Settings` | Settings links |
| `Users` | Client-related |
| `FolderKanban` | Projects |
| `FileText` | Content/Documents |
| `Sparkles` | AI features |
| `BookOpen` | Frameworks |
| `BookMarked` | Journal |
| `Trash2` | Delete actions |
| `RefreshCw` | Regenerate/Reload |
| `Copy` | Copy actions |
| `Check` | Success/Complete |
| `AlertCircle` | Warnings |
| `Clock` | Time/Activity |

