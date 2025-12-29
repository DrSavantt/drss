# DRSS Design System Reference

> **Quick Reference Guide for Component Development**  
> Always use theme variables, never hardcode colors.

## Table of Contents

1. [Theme Variables](#theme-variables)
2. [Color System](#color-system)
3. [Component Library](#component-library)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Layout Patterns](#layout-patterns)
7. [Best Practices](#best-practices)

---

## Theme Variables

### Core Concept

All colors use HSL format with CSS variables that automatically adapt to light/dark mode.

**CSS Variable Format:**
```css
:root {
  --background: 0 0% 4%;  /* HSL: hue saturation lightness */
}
```

**Usage in Tailwind:**
```tsx
<div className="bg-background">  {/* Uses hsl(var(--background)) */}
```

### Available CSS Variables

#### Background Variables

| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| `--background` | `#0a0a0a` | `#fafafa` | Main app background |
| `--card` | `#141414` | `#ffffff` | Card/panel backgrounds |
| `--popover` | `#1a1a1a` | `#ffffff` | Popovers, tooltips, dropdowns |
| `--muted` | `#141414` | `#f5f5f5` | Muted/disabled backgrounds |
| `--accent` | `#1a1a1a` | `#f5f5f5` | Hover states, subtle accents |
| `--secondary` | `#1a1a1a` | `#f5f5f5` | Secondary surfaces |
| `--surface` | `#171717` | `#ffffff` | Premium surface (legacy) |
| `--input` | `#141414` | `#ffffff` | Input field backgrounds |

#### Foreground Variables

| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| `--foreground` | `#fafafa` | `#0a0a0a` | Primary text |
| `--card-foreground` | `#fafafa` | `#0a0a0a` | Text on cards |
| `--popover-foreground` | `#fafafa` | `#0a0a0a` | Text in popovers |
| `--muted-foreground` | `#a1a1a1` | `#6b6b6b` | Secondary/muted text |
| `--accent-foreground` | `#fafafa` | `#0a0a0a` | Text on accent backgrounds |
| `--secondary-foreground` | `#fafafa` | `#0a0a0a` | Text on secondary backgrounds |

#### Brand Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#dc2626` | Primary brand red |
| `--primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--destructive` | `#ef4444` | Destructive actions, errors |
| `--destructive-foreground` | `#ffffff` | Text on destructive backgrounds |

#### Border & Focus

| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| `--border` | `#262626` | `#e5e5e5` | Default borders |
| `--ring` | `#dc2626` | `#dc2626` | Focus rings |

#### Status Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--success` | `#22c55e` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--info` | `#3b82f6` | Informational states |
| `--error` | `#ef4444` | Error states |

#### Chart Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--chart-1` | `#dc2626` | Primary chart color |
| `--chart-2` | `#22c55e` | Secondary chart color |
| `--chart-3` | `#3b82f6` | Tertiary chart color |
| `--chart-4` | `#f59e0b` | Quaternary chart color |
| `--chart-5` | `#a1a1a1` | Quinary chart color |

---

## Color System

### Semantic Color Classes

#### Backgrounds

```tsx
// Main surfaces
<div className="bg-background">      // Main app background
<div className="bg-card">            // Card backgrounds
<div className="bg-popover">         // Floating elements
<div className="bg-muted">           // Muted/disabled areas
<div className="bg-accent">          // Hover states
<div className="bg-secondary">       // Secondary surfaces

// Interactive
<div className="bg-primary">         // Primary actions (red)
<div className="bg-destructive">     // Destructive actions
<div className="hover:bg-accent">    // Hover states
<div className="hover:bg-primary/90"> // Button hover
```

#### Text Colors

```tsx
// Standard text
<p className="text-foreground">           // Primary text
<p className="text-muted-foreground">     // Secondary text
<p className="text-card-foreground">      // Text on cards

// Interactive text
<span className="text-primary">           // Brand red text
<span className="text-primary-foreground"> // White text
<span className="text-destructive">       // Error text

// Status text
<span className="text-success">           // Success (green)
<span className="text-warning">           // Warning (orange)
<span className="text-info">              // Info (blue)
```

#### Borders

```tsx
<div className="border border-border">     // Default border
<div className="border-input">             // Input borders
<div className="border-destructive">       // Error borders
<div className="focus:ring-ring">          // Focus rings
```

### Legacy Colors (Backward Compatibility)

The system includes legacy color names for gradual migration:

```tsx
// Grayscale (only use if necessary)
bg-pure-black, bg-charcoal, bg-dark-gray, bg-mid-gray
bg-slate, bg-silver, bg-light-gray, bg-pale-gray

// Whites (only use if necessary)
bg-pure-white, bg-off-white, bg-ghost-white

// Reds (prefer bg-primary instead)
bg-red-dark, bg-red-primary, bg-red-bright, bg-red-light

// Surfaces (prefer bg-card/bg-background)
bg-surface, bg-surface-highlight
```

**⚠️ Warning:** Only use legacy colors when updating existing components. Always use semantic variables for new components.

---

## Component Library

### Complete Component List

**Location:** `/components/ui/`

All components are from shadcn/ui and properly themed:

- `alert-dialog.tsx` - Confirmation dialogs
- `avatar.tsx` - User avatars
- `badge.tsx` - Status badges, tags
- `button.tsx` - All button variants
- `card.tsx` - Content cards
- `checkbox.tsx` - Checkboxes
- `collapsible.tsx` - Collapsible sections
- `dialog.tsx` - Modal dialogs
- `drawer.tsx` - Side drawers
- `dropdown-menu.tsx` - Dropdown menus
- `input.tsx` - Text inputs
- `label.tsx` - Form labels
- `progress.tsx` - Progress bars
- `radio-group.tsx` - Radio buttons
- `select.tsx` - Select dropdowns
- `sheet.tsx` - Side sheets
- `spotlight-card.tsx` - Special effect cards
- `stat-card.tsx` - Statistics display
- `switch.tsx` - Toggle switches
- `tabs.tsx` - Tab navigation
- `textarea.tsx` - Multi-line inputs

### Button Component

**Import:**
```tsx
import { Button } from "@/components/ui/button"
```

**Variants:**

```tsx
// Primary action (red background)
<Button variant="default">Primary</Button>

// Secondary action (gray background)
<Button variant="secondary">Secondary</Button>

// Destructive action (red, more aggressive)
<Button variant="destructive">Delete</Button>

// Subtle action (transparent, shows on hover)
<Button variant="ghost">Edit</Button>

// Outlined button
<Button variant="outline">Cancel</Button>

// Link style
<Button variant="link">Learn More</Button>
```

**Sizes:**

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>
<Button size="icon-sm"><IconComponent /></Button>
<Button size="icon-lg"><IconComponent /></Button>
```

**With Icons:**

```tsx
import { Plus, Trash2 } from 'lucide-react'

<Button>
  <Plus />
  Add Item
</Button>

<Button variant="destructive">
  <Trash2 />
  Delete
</Button>

// Icon only
<Button size="icon" variant="ghost">
  <Settings />
</Button>
```

**States:**

```tsx
// Disabled
<Button disabled>Disabled</Button>

// Loading state (custom)
<Button disabled={loading}>
  {loading ? <Spinner /> : 'Submit'}
</Button>

// As child (renders as anchor, div, etc.)
<Button asChild>
  <Link href="/path">Link Button</Link>
</Button>
```

### Dialog Component

**Import:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
```

**Basic Usage:**

```tsx
function MyDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Dialog content */}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Form Dialog:**

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogDescription>
        Fill in the details below
      </DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">
          Create
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Card Component

**Import:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
```

**Basic Card:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>
      Supporting description text
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Card with Action Button:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Client Name</CardTitle>
    <CardDescription>client@example.com</CardDescription>
    <CardAction>
      <Button size="icon" variant="ghost">
        <MoreVertical />
      </Button>
    </CardAction>
  </CardHeader>
  
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Interactive Card:**

```tsx
<Card className="hover:bg-accent cursor-pointer transition-colors">
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
  <CardContent>
    Click anywhere on this card
  </CardContent>
</Card>
```

### Form Components

**Input:**

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="you@example.com"
  />
</div>
```

**Textarea:**

```tsx
import { Textarea } from "@/components/ui/textarea"

<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea 
    id="message"
    placeholder="Type your message..."
    rows={4}
  />
</div>
```

**Checkbox:**

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label 
    htmlFor="terms" 
    className="text-sm text-muted-foreground"
  >
    Accept terms and conditions
  </Label>
</div>
```

**Select:**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

**Radio Group:**

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>
```

**Switch:**

```tsx
import { Switch } from "@/components/ui/switch"

<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

### Badge Component

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical />
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Typography

### Font System

**Font Families:**
- **Sans:** Inter (primary)
- **Mono:** Geist Mono (code blocks)

```tsx
// Default (Inter)
<p className="font-sans">Body text</p>

// Monospace
<code className="font-mono">Code text</code>
```

### Text Sizes

```tsx
// Tailwind text utilities
<p className="text-xs">Extra small</p>      // 12px
<p className="text-sm">Small</p>            // 14px
<p className="text-base">Base</p>           // 16px
<p className="text-lg">Large</p>            // 18px
<p className="text-xl">Extra large</p>      // 20px
<p className="text-2xl">2X large</p>        // 24px
<p className="text-3xl">3X large</p>        // 30px
<p className="text-4xl">4X large</p>        // 36px
```

### Heading Styles

```tsx
<h1 className="text-4xl font-bold text-foreground">
  Page Title
</h1>

<h2 className="text-3xl font-bold text-foreground">
  Section Title
</h2>

<h3 className="text-2xl font-semibold text-foreground">
  Subsection Title
</h3>

<h4 className="text-xl font-semibold text-foreground">
  Card Title
</h4>

<p className="text-base text-muted-foreground">
  Body text
</p>

<p className="text-sm text-muted-foreground">
  Supporting text
</p>
```

### Font Weights

```tsx
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

---

## Spacing

### Tailwind Spacing Scale

Uses 4px base unit:

```tsx
p-0   // 0px
p-1   // 4px
p-2   // 8px
p-3   // 12px
p-4   // 16px (most common)
p-5   // 20px
p-6   // 24px (cards, sections)
p-8   // 32px (large sections)
p-10  // 40px
p-12  // 48px
p-16  // 64px
```

### Common Spacing Patterns

```tsx
// Card padding
<Card className="p-6">

// Section spacing
<section className="space-y-8">

// Grid gaps
<div className="grid grid-cols-3 gap-4">

// Stack spacing
<div className="flex flex-col gap-4">

// Inline spacing
<div className="flex items-center gap-2">
```

---

## Layout Patterns

### Container Layouts

```tsx
// Full width container
<div className="w-full">

// Centered container with max width
<div className="container mx-auto max-w-7xl px-4">

// Two-column layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

### Flexbox Patterns

```tsx
// Horizontal stack with spacing
<div className="flex items-center gap-4">

// Vertical stack with spacing
<div className="flex flex-col gap-4">

// Space between
<div className="flex items-center justify-between">

// Centered content
<div className="flex items-center justify-center min-h-screen">
```

### Grid Patterns

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Auto-fit grid
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
```

### Card Grids

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {item.content}
      </CardContent>
    </Card>
  ))}
</div>
```

---

## Best Practices

### 1. Always Use Theme Variables

```tsx
// ✅ Good
<div className="bg-card text-card-foreground border-border">

// ❌ Bad
<div className="bg-zinc-900 text-zinc-100 border-zinc-800">
```

### 2. Use cn() for Conditional Classes

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "bg-card p-4 rounded-lg",
  isActive && "bg-accent",
  error && "border-destructive"
)} />
```

### 3. Mobile-First Responsive Design

```tsx
// ✅ Good - mobile first
<div className="text-sm md:text-base lg:text-lg">

// ❌ Bad - desktop first
<div className="lg:text-lg md:text-base text-sm">
```

### 4. Proper Component Composition

```tsx
// ✅ Good - use existing components
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>

// ❌ Bad - recreate component structure
<div className="bg-card border rounded-lg p-6">
  <h3 className="font-semibold">Title</h3>
</div>
```

### 5. Consistent Spacing

```tsx
// ✅ Good - consistent spacing scale
<div className="space-y-4">
  <div className="p-4">
  <div className="gap-4">

// ❌ Bad - arbitrary spacing
<div className="space-y-3">
  <div className="p-5">
  <div className="gap-3">
```

### 6. Accessibility

```tsx
// ✅ Good
<Button aria-label="Close dialog">
  <X />
</Button>

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ Bad
<button>
  <X />
</button>

<label>Email</label>
<input type="email" />
```

### 7. Light/Dark Mode Support

```tsx
// ✅ Good - automatically works in both modes
<div className="bg-background text-foreground">

// ⚠️ Use dark: prefix only for special overrides
<div className="bg-card dark:shadow-lg">

// ❌ Bad - breaks in light mode
<div className="bg-zinc-900 text-white">
```

### 8. TypeScript Types

```tsx
// ✅ Good
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'ghost'
}

export function MyButton({ onClick, children, variant }: ButtonProps) {
  return <Button variant={variant} onClick={onClick}>{children}</Button>
}

// ❌ Bad
export function MyButton({ onClick, children, variant }: any) {
```

---

## Quick Reference

### Color Decision Tree

1. **Background needed?**
   - Main surface → `bg-background`
   - Card/panel → `bg-card`
   - Muted area → `bg-muted`
   - Hover state → `hover:bg-accent`

2. **Text needed?**
   - Primary text → `text-foreground`
   - Secondary text → `text-muted-foreground`
   - On colored background → `text-[color]-foreground`

3. **Border needed?**
   - Default → `border-border`
   - Input → `border-input`
   - Error → `border-destructive`

4. **Interactive element?**
   - Primary action → `bg-primary`
   - Destructive → `bg-destructive`
   - Hover → `hover:bg-accent`
   - Focus → `focus:ring-ring`

### Component Decision Tree

1. **Need a button?** → `Button` component
2. **Need a modal?** → `Dialog` component
3. **Need a card?** → `Card` component
4. **Need a form input?** → `Input`/`Textarea`/`Select`/`Checkbox`
5. **Need a menu?** → `DropdownMenu` component
6. **Need a badge/tag?** → `Badge` component
7. **Need tabs?** → `Tabs` component

### File Locations

- **UI Components:** `components/ui/`
- **Feature Components:** `components/[feature]/`
- **Documentation:** `docs/`
- **Theme Config:** `app/globals.css`
- **Tailwind Config:** `tailwind.config.js`
- **Design System Examples:** `ui-design-system/`

---

**Remember:** The design system exists to ensure consistency, accessibility, and maintainability. Always prefer using existing components and theme variables over creating custom solutions.

