# Feature 2.7: Bulk Actions - Visual Guide

## 📸 Component Layouts

### 1. Select All Checkbox (Top of Page)
```
┌─────────────────────────────────────────────────────┐
│ ☑ Select All (12 items)                            │
└─────────────────────────────────────────────────────┘
```
- Appears at the top of content list
- Shows total number of items available
- Toggles all items on/off

---

### 2. Content Cards with Checkboxes

#### Unselected State:
```
┌─────────────────────────────────────────────────────┐
│ ☐  Blog Post Title                                  │
│    ───────────────                                  │
│    [blog_post] [Client Name] [Project Name]         │
│    Created Nov 15, 2025                             │
│                                                     │
│ Border: Gray                                        │
└─────────────────────────────────────────────────────┘
```

#### Selected State:
```
┌═════════════════════════════════════════════════════┐
║ ☑  Blog Post Title                                  ║
║    ───────────────                                  ║
║    [blog_post] [Client Name] [Project Name]         ║
║    Created Nov 15, 2025                             ║
║                                                     ║
║ Border: RED | Background: Light Red Tint            ║
└═════════════════════════════════════════════════════┘
```

---

### 3. Bulk Action Bar (Sticky Bottom)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ● 3 items selected                                  ┃
┃                                                     ┃
┃  [🗑 Delete] [📦 Archive] [🔀 Change Project] [✕ Cancel] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Features:**
- Red top border (2px)
- Charcoal background
- Pulsing red dot indicator
- Appears only when items selected
- Sticks to bottom of viewport
- Buttons stack vertically on mobile

**Button Colors:**
- Delete: RED background
- Archive: Dark gray with border
- Change Project: Dark gray with border
- Cancel: Transparent with gray text

---

### 4. Delete Confirmation Modal

```
        ╔══════════════════════════════════╗
        ║ Delete Items                     ║
        ║                                  ║
        ║ Are you sure you want to delete  ║
        ║ 3 items? This action cannot be   ║
        ║ undone.                          ║
        ║                                  ║
        ║        [Cancel]  [Delete]        ║
        ╚══════════════════════════════════╝
```

**Styles:**
- Charcoal background
- Gray border
- Delete button: RED
- Cancel button: Gray border
- Backdrop: Black with blur

---

### 5. Archive Confirmation Modal

```
        ╔══════════════════════════════════╗
        ║ Archive Items                    ║
        ║                                  ║
        ║ Are you sure you want to archive ║
        ║ 3 items?                         ║
        ║                                  ║
        ║        [Cancel]  [Archive]       ║
        ╚══════════════════════════════════╝
```

**Styles:**
- Charcoal background
- Gray border
- Archive button: BLUE (info color)
- Cancel button: Gray border

---

### 6. Project Selector Modal

```
    ╔══════════════════════════════════════════╗
    ║ Change Project                           ║
    ║ Select a project to move selected items  ║
    ║─────────────────────────────────────────║
    ║ 🔍 [Search projects or clients...]      ║
    ║─────────────────────────────────────────║
    ║ ○ No Project                             ║
    ║   Remove project association             ║
    ║                                          ║
    ║ ○ Website Redesign                       ║
    ║   Client: Acme Corp                      ║
    ║                                          ║
    ║ ● Brand Strategy                         ║
    ║   Client: Tech Startup                   ║
    ║                                          ║
    ║ ○ Social Media Campaign                  ║
    ║   Client: Retail Store                   ║
    ║─────────────────────────────────────────║
    ║           [Cancel] [Move to Project]     ║
    ╚══════════════════════════════════════════╝
```

**Features:**
- Scrollable list (max-height 80vh)
- Search bar at top
- Radio buttons for selection
- Shows client name under each project
- "No Project" option to remove association
- Selected project has red border
- Move button disabled until selection made

---

### 7. Toast Notifications

#### Success Toast (slides in from right):
```
┌─────────────────────────────────┐
│ ✓ 3 items deleted          [✕] │
└─────────────────────────────────┘
    GREEN background
```

#### Error Toast:
```
┌─────────────────────────────────┐
│ ✗ Failed to delete items   [✕] │
└─────────────────────────────────┘
    RED background
```

#### Info Toast:
```
┌─────────────────────────────────┐
│ ⓘ Processing...            [✕] │
└─────────────────────────────────┘
    BLUE background
```

**Features:**
- Fixed position: top-right
- Slides in from right (0.3s animation)
- Auto-dismisses after 3 seconds
- Manual close button
- Multiple toasts stack vertically
- z-index: 100 (above everything)

---

## 🎬 User Flow Animations

### Step 1: Selecting Items
```
Click checkbox → Border turns RED → Background tints red
```

### Step 2: Action Bar Appears
```
1+ items selected → Bar slides up from bottom → Pulsing dot appears
```

### Step 3: Click Delete
```
Click Delete → Modal fades in → Backdrop blurs background
```

### Step 4: Confirm
```
Click Confirm → Button shows spinner → "Processing..."
```

### Step 5: Success
```
Modal closes → Toast slides in → Items disappear → Selection clears → Bar hides
```

---

## 📱 Mobile Layout

### Action Bar on Mobile (< 640px):
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ● 3 items selected        ┃
┃                           ┃
┃    [🗑 Delete]            ┃
┃    [📦 Archive]           ┃
┃    [🔀 Change Project]    ┃
┃    [✕ Cancel]             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Buttons stack vertically
- Full width buttons
- More thumb-friendly spacing
- Same color scheme

### Cards on Mobile:
```
┌─────────────────────────┐
│ ☑ Title                 │
│   [Type] [Client]       │
│   Created Nov 15        │
└─────────────────────────┘
```
- Single column grid
- Checkbox slightly larger
- Badges wrap if needed

---

## 🎨 Color Reference

### Buttons:
- **Delete**: `bg-red-primary` (#FF4444)
- **Archive**: `bg-dark-gray` with `border-mid-gray`
- **Change Project**: `bg-dark-gray` with `border-mid-gray`
- **Cancel**: Transparent with `text-silver`

### States:
- **Selected Card Border**: `border-red-primary` (2px)
- **Selected Card Background**: `bg-red-primary/5`
- **Hover**: `border-red-bright`
- **Action Bar Top Border**: `border-red-primary` (2px)

### Toasts:
- **Success**: `bg-success` (#00DD88)
- **Error**: `bg-error` (#FF4444)
- **Info**: `bg-info` (#4488FF)

---

## ⚡ Performance Notes

### Smooth Animations:
- Toast slide-in: 300ms
- Border color transitions: 200ms
- Modal fade-in: 150ms
- Button hover: 200ms

### Loading States:
- Spinner appears during API calls
- Buttons disabled during processing
- Backdrop prevents interaction
- Toast confirms completion

---

## 🔥 Key Interactions

1. **Click checkbox** → Item selected (immediate feedback)
2. **Click "Select All"** → All items toggle at once
3. **Click action button** → Modal opens (smooth fade)
4. **Click backdrop** → Modal closes (no action)
5. **Press Escape** → Modal closes (keyboard accessible)
6. **Confirm action** → Loading spinner → Success toast
7. **Click Cancel** → Selection clears → Bar disappears

---

This visual guide shows exactly what users will see and interact with! 🎯
