# 🔧 TWO QUICK FIXES

## Issue 1: Header Shows Through When Scrolling
**Problem:** Content visible through navigation header

**Fix:** Add backdrop blur to nav

### Step 1: Update globals.css

Add this to the bottom of `app/globals.css`:

```css
/* Navigation backdrop fix */
nav {
  background: rgba(10, 10, 10, 0.95) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 50;
}

.sticky {
  position: sticky;
  top: 0;
  z-index: 50;
}

main {
  position: relative;
  z-index: 1;
}
```

---

## Issue 2: Drag-and-Drop Doesn't Work on Mobile
**Problem:** Can drag on desktop but not on mobile

**Fix:** Configure dnd-kit touch sensors properly

### Step 2: Update Projects Board Component

Find your Projects Board file (probably `app/dashboard/projects/board/page.tsx`)

**Add these imports at the top:**

```tsx
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
```

**Add sensor configuration BEFORE your return statement:**

```tsx
const sensors = useSensors(
  useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  }),
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10,
    },
  })
)
```

**Update your DndContext:**

```tsx
<DndContext
  sensors={sensors}  // <-- ADD THIS LINE
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
>
  {/* Your board */}
</DndContext>
```

**Make sure your draggable cards have `touch-none` class:**

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className="... touch-none"  // <-- ADD touch-none
>
  {/* Card content */}
</div>
```

---

## Quick Deploy

```bash
# After making changes:
git add .
git commit -m "fix: header transparency and mobile drag-and-drop"
git push origin main
```

---

## Test Checklist

After deploy:

**Desktop:**
- ✅ Header is solid (no see-through)
- ✅ Can drag cards

**Mobile:**
- ✅ Header is solid (no see-through)
- ✅ Can drag cards after 250ms press
- ✅ Can still scroll horizontally

---

## Why These Work

**Header Fix:**
- `backdrop-filter: blur(12px)` creates frosted glass effect
- `rgba(10, 10, 10, 0.95)` makes it 95% opaque
- `z-index: 50` keeps it on top

**Drag Fix:**
- `TouchSensor` enables mobile touch dragging
- `delay: 250` prevents accidental drags while scrolling
- `tolerance: 5` allows 5px movement before drag starts
- `touch-none` class prevents scroll conflicts

---

**2 small changes. Big UX improvement.** 🚀
