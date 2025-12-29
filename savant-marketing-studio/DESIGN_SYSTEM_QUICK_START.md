# Design System Quick Start Guide

> **🎯 TL;DR:** Always use theme variables like `bg-card` and `text-foreground`. Never use hardcoded colors like `bg-zinc-900` or `text-white`.

---

## 🚀 Quick Reference

### Where to Look

1. **Rules File:** `.cursorrules` (project root)
2. **Full Documentation:** `docs/DESIGN_SYSTEM.md`
3. **UI Patterns:** `docs/implementation-notes/CURSOR_UI_INSTRUCTIONS.md`

---

## ✅ DO THIS

```tsx
// Use theme variables
<div className="bg-card text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
  <Button className="bg-primary hover:bg-primary/90">Click me</Button>
</div>
```

---

## ❌ NOT THIS

```tsx
// Don't use hardcoded colors
<div className="bg-zinc-900 text-white border-zinc-800">
  <p className="text-zinc-400">Secondary text</p>
  <button className="bg-red-600 hover:bg-red-700">Click me</button>
</div>
```

---

## 🎨 Common Colors

| Need | Use This |
|------|----------|
| Background | `bg-background` |
| Card | `bg-card` |
| Text | `text-foreground` |
| Muted text | `text-muted-foreground` |
| Border | `border-border` |
| Primary button | `bg-primary` |
| Hover | `hover:bg-accent` |

---

## 📦 Import Components

```tsx
// Always import from @/components/ui/
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
```

---

## 🔍 Available Components

**21 Ready-to-Use Components in `/components/ui/`:**

- alert-dialog
- avatar
- badge
- button ⭐
- card ⭐
- checkbox
- collapsible
- dialog ⭐
- drawer
- dropdown-menu
- input ⭐
- label
- progress
- radio-group
- select
- sheet
- spotlight-card
- stat-card
- switch
- tabs
- textarea

⭐ = Most commonly used

---

## 📖 Learn More

- **Complete CSS variables:** `docs/DESIGN_SYSTEM.md#theme-variables`
- **Component examples:** `docs/DESIGN_SYSTEM.md#component-library`
- **UI patterns:** `docs/implementation-notes/CURSOR_UI_INSTRUCTIONS.md`
- **Migration guide:** `.cursorrules#color-migration-guide`

---

## 🎯 Before Creating UI

**Checklist:**

1. ✅ Read `.cursorrules`
2. ✅ Check if component exists in `/components/ui/`
3. ✅ Use theme variables (not hardcoded colors)
4. ✅ Import from `@/components/ui/*`
5. ✅ Test in light AND dark mode

---

**Questions?** Check `docs/DESIGN_SYSTEM.md` for the complete reference.

