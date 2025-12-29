# Journal Pin Feature - Visual Guide

## 🎨 Visual Design

### Pinned Entry Appearance

```
┌─────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Amber top border (2px)
├─────────────────────────────────────────────────────────┤
│ ☑️  Dec 27, 3:45 PM                    📌  🗑️           │
│                                                          │
│ This is a pinned journal entry with important notes     │
│ about the project. It stays at the top of the list.     │
│                                                          │
│ #important #followup @ClientName                        │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Border: `border-amber-500/50` (subtle amber glow)
- Top Border: `border-t-2 border-t-amber-500` (prominent accent)
- Background: `bg-amber-500/5` (very subtle amber tint)
- Pin Icon: `text-amber-500 fill-amber-500` (filled amber pin)

### Unpinned Entry Appearance

```
┌─────────────────────────────────────────────────────────┐
│ ☑️  Dec 27, 2:30 PM                    📍  🗑️           │
│                                        ↑                 │
│ Regular journal entry without pin.    (hover only)      │
│                                                          │
│ #research @AnotherClient                                │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Border: `border-border` (default theme border)
- Background: `bg-background` (default card background)
- Pin Icon: `text-muted-foreground` (outline only, shows on hover)

## 🎯 User Interactions

### 1. Individual Pin Toggle

**Unpinned → Pinned:**
```
User hovers → Pin icon appears (outline)
User clicks → Entry moves to top + amber styling + filled pin icon
```

**Pinned → Unpinned:**
```
Pin icon always visible (filled amber)
User clicks → Entry returns to chronological position + default styling
```

### 2. Bulk Pin Actions

**Select Multiple Entries:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 3 entries selected                                    │
│                                                          │
│  [Delete] [Pin] [Add Tags] [Cancel]                     │
└─────────────────────────────────────────────────────────┘
```

**When Some Are Pinned:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 3 entries selected                                    │
│                                                          │
│  [Delete] [Unpin] [Add Tags] [Cancel]                   │
│            ↑                                             │
│         (button changes)                                 │
└─────────────────────────────────────────────────────────┘
```

## 📊 Entry Sorting Logic

```
┌─────────────────────────────────────────────────────────┐
│                    PINNED ENTRIES                        │
│  (sorted by timestamp, newest first)                    │
├─────────────────────────────────────────────────────────┤
│ 📌 Dec 27, 4:00 PM - Pinned entry #1                    │
│ 📌 Dec 27, 3:45 PM - Pinned entry #2                    │
│ 📌 Dec 26, 2:30 PM - Pinned entry #3                    │
├─────────────────────────────────────────────────────────┤
│                   REGULAR ENTRIES                        │
│  (sorted by timestamp, newest first)                    │
├─────────────────────────────────────────────────────────┤
│ 📍 Dec 27, 3:30 PM - Regular entry #1                   │
│ 📍 Dec 27, 2:15 PM - Regular entry #2                   │
│ 📍 Dec 26, 5:00 PM - Regular entry #3                   │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Color Palette

### Amber Accent (Pinned State)
- **Primary:** `#F59E0B` (amber-500)
- **Border:** `rgba(245, 158, 11, 0.5)` (50% opacity)
- **Background:** `rgba(245, 158, 11, 0.05)` (5% opacity)
- **Top Border:** `#F59E0B` (solid, 2px)

### Default State
- **Border:** Theme `border-border`
- **Background:** Theme `bg-background`
- **Text:** Theme `text-foreground`
- **Icon:** Theme `text-muted-foreground`

## 🔧 Component Hierarchy

```
Journal Component
├── Entry List (sorted)
│   ├── Pinned Entries
│   │   ├── Checkbox (bulk select)
│   │   ├── Pin Button (filled, always visible)
│   │   ├── Delete Button (hover)
│   │   └── Content
│   └── Regular Entries
│       ├── Checkbox (bulk select)
│       ├── Pin Button (outline, hover only)
│       ├── Delete Button (hover)
│       └── Content
└── Bulk Action Bar (bottom)
    ├── Selection Count
    └── Actions: [Delete] [Pin/Unpin] [Add Tags] [Cancel]
```

## 📱 Responsive Behavior

### Desktop (hover states work)
- Pin icon appears on hover for unpinned entries
- Always visible for pinned entries
- Smooth opacity transitions

### Mobile (touch-friendly)
- Pin icon always visible on all entries
- Larger touch targets
- No hover states needed

## ✨ Animations & Transitions

### Current Implementation:
```css
/* Pin button opacity transition */
transition-opacity

/* Hover effects */
hover:bg-amber-500/20  /* Pin button */
hover:bg-destructive/10  /* Delete button */
```

### Future Enhancements:
```css
/* Entry movement animation */
transition: transform 0.3s ease-in-out;

/* Pin icon fill animation */
transition: fill 0.2s ease;

/* Border glow pulse */
@keyframes pulse-amber {
  0%, 100% { border-color: rgba(245, 158, 11, 0.5); }
  50% { border-color: rgba(245, 158, 11, 0.8); }
}
```

## 🎯 Use Cases

### 1. Important Client Notes
```
📌 "Client wants to see 3 design concepts by Friday"
   #urgent #followup @ClientName
```

### 2. Action Items
```
📌 "Remember to send invoice for December deliverables"
   #billing #action
```

### 3. Reference Information
```
📌 "Brand colors: Primary #FF6B6B, Secondary #4ECDC4"
   #reference @ClientName
```

### 4. Project Milestones
```
📌 "Phase 1 completed - moving to Phase 2 next week"
   #milestone @ProjectName
```

## 🔄 State Flow

```
┌─────────────┐
│   Unpinned  │
│   (default) │
└──────┬──────┘
       │
       │ Click Pin Button
       │ or Bulk Pin
       ↓
┌─────────────┐
│   Pinned    │
│  (amber)    │
└──────┬──────┘
       │
       │ Click Pin Button
       │ or Bulk Unpin
       ↓
┌─────────────┐
│   Unpinned  │
│   (default) │
└─────────────┘
```

## 💾 Database State

```typescript
// Journal Entry in Database
{
  id: "uuid",
  content: "Entry text...",
  is_pinned: true,  // ← Pin state persists here
  created_at: "2024-12-27T15:45:00Z",
  user_id: "user-uuid",
  chat_id: "chat-uuid",
  // ... other fields
}
```

## 🎨 Theme Integration

### Works with DRSS Theme:
- ✅ Dark mode compatible
- ✅ Uses theme color variables
- ✅ Respects border-radius settings
- ✅ Matches existing card styling
- ✅ Consistent with other accent colors

### Amber Choice Rationale:
- **Visibility:** Stands out without being aggressive
- **Meaning:** Gold/amber traditionally indicates "important" or "valuable"
- **Contrast:** Works well on both light and dark backgrounds
- **Harmony:** Complements existing red primary and blue accents
- **Accessibility:** Good contrast ratio for WCAG compliance

## 📋 Keyboard Shortcuts (Future)

```
Cmd/Ctrl + P          → Pin selected entry
Cmd/Ctrl + Shift + P  → Pin all selected entries
Cmd/Ctrl + U          → Unpin selected entry
```

## 🎉 Success Indicators

✅ Pin icon changes from outline to filled
✅ Entry moves to top of list immediately
✅ Amber border and background appear
✅ State persists after page refresh
✅ Bulk action bar shows correct button
✅ Sorting maintains chronological order within pinned/unpinned groups

