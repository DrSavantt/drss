# Mobile vs Desktop Code Paths Audit Report

**Date:** January 1, 2026  
**Goal:** Mobile should be IDENTICAL to desktop, just formatted for smaller screens - NOT a different app.

---

## 📊 EXECUTIVE SUMMARY

### Inventory
| Metric | Count |
|--------|-------|
| Files with desktop/mobile splits | **8** |
| Total conditional renders found | **25** |
| Mobile-only components | **1** (`mobile-nav.tsx`) |
| Desktop-only features | **1** (Image zoom controls) |

### Overall Assessment
The codebase is **mostly well-architected** for responsive design. The main issue is the **dashboard layout**, which renders **completely different navigation systems** for mobile vs desktop. Most other responsive patterns are acceptable (grid layouts, text truncation).

---

## 🚨 CRITICAL ISSUES

### 1. Dashboard Layout - DUAL LAYOUT SYSTEM

**File:** `app/dashboard/layout.tsx`

```tsx
// Lines 36-54: COMPLETELY DIFFERENT DESKTOP/MOBILE LAYOUTS

// Mobile Navigation - Only shown on mobile
<div className="lg:hidden">
  <MobileNav userEmail={userEmail} />
</div>

// Desktop Layout with new AppShell
<div className="hidden lg:block">
  <ErrorBoundary>
    <AppShell>{children}</AppShell>
  </ErrorBoundary>
</div>

// Mobile Layout - Direct rendering  
<div className="lg:hidden">
  <ErrorBoundary>
    <main className="min-h-screen p-4 pt-20">
      {children}
    </main>
  </ErrorBoundary>
</div>
```

**Issue:** 
- Desktop gets `<AppShell>` with persistent sidebar
- Mobile gets `<MobileNav>` hamburger menu + bare `<main>` wrapper
- **Two completely different DOM structures**

**Impact:** 
- ❌ Different navigation UX
- ❌ Desktop sidebar features (collapse, search) not available on mobile
- ❌ Two codebases to maintain

**Status:** ❌ PROBLEMATIC

---

### 2. Mobile Nav Component - SEPARATE CODEBASE

**File:** `components/mobile-nav.tsx` (199 lines)

```tsx
// Entire file is mobile-only
export function MobileNav({ userEmail }: MobileNavProps) {
  // Complete hamburger menu implementation
  // Centered blur modal overlay
  // Separate nav items list (duplicated from sidebar)
}
```

**Nav Items Comparison:**

| Desktop Sidebar | Mobile Nav |
|----------------|------------|
| Dashboard ✅ | Dashboard ✅ |
| Clients ✅ | Analytics ✅ (different order) |
| Projects ✅ | Clients ✅ |
| Deep Research ✅ | Projects ✅ |
| Frameworks ✅ | Content ✅ |
| AI Studio ✅ | Journal ✅ |
| Content ✅ | AI Studio ✅ |
| Journal ✅ | Deep Research ✅ |
| Analytics ✅ | Frameworks ✅ |
| Archive ✅ | Archive ✅ |
| Settings ✅ | Settings ✅ |

**Issue:** Nav items are in **different order** between desktop and mobile.

**Status:** ❌ PROBLEMATIC

---

## ⚠️ QUESTIONABLE PATTERNS

### 3. Questionnaire Progress Stepper

**File:** `components/questionnaire/navigation/progress-stepper.tsx`

```tsx
// Lines 70-113: Mobile horizontal scroll pills
<div className="block lg:hidden">
  <div className="overflow-x-auto pb-2">
    {/* Horizontal scrollable pills */}
  </div>
</div>

// Lines 116-187: Desktop full stepper track
<div className="hidden lg:block">
  {/* Full circle stepper with connecting lines */}
</div>
```

**Issue:** Different visual representation
- Mobile: Horizontal scroll pills
- Desktop: Full stepper with connecting lines

**Assessment:** Same functionality, different presentation for space constraints. 

**Status:** ⚠️ QUESTIONABLE (but acceptable given space constraints)

---

### 4. Questionnaire Rich Footer

**File:** `components/questionnaire/navigation/rich-footer.tsx`

```tsx
// Lines 71-135: Mobile Layout - Two column with status above
<div className="block md:hidden">
  {/* Save status row */}
  {/* Two-button row */}
</div>

// Lines 138-276: Desktop Layout - Three column
<div className="hidden md:grid grid-cols-3 items-center gap-4">
  {/* Previous | Step Counter | Next */}
  {/* More detailed layout with section names */}
</div>
```

**Issue:** 
- Mobile: Simplified 2-column layout, no "Reset" button visible
- Desktop: 3-column layout with Reset option, section name previews

**Feature Gap:** Reset button only visible on desktop!

**Status:** ⚠️ QUESTIONABLE (missing Reset on mobile)

---

### 5. Responsive Modal

**File:** `components/responsive-modal.tsx`

```tsx
// Line 23: Desktop check
const isDesktop = useMediaQuery('(min-width: 768px)')

// Line 35-43: Desktop renders Dialog
if (isDesktop) {
  return <Dialog>...</Dialog>
}

// Lines 47-84: Mobile renders centered blur modal
return (
  <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]">...
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">...
  </>
)
```

**Issue:** Different modal implementations
- Desktop: Uses Radix Dialog component
- Mobile: Custom centered blur modal

**Assessment:** Same UX goal, different implementation for better mobile experience.

**Status:** ⚠️ QUESTIONABLE (but behavior is similar)

---

## ✅ ACCEPTABLE PATTERNS

### 6. Responsive File Preview

**File:** `components/responsive-file-preview.tsx`

```tsx
// Line 20: Check for mobile
const isMobile = useMobile()

// Lines 44-78: Image zoom controls hidden on mobile
{isImage && !isMobile && (
  <>
    <button onClick={() => setZoom(...)}>Zoom out</button>
    <span>{zoom}%</span>
    <button onClick={() => setZoom(...)}>Zoom in</button>
    <button>Reset</button>
  </>
)}
```

**Issue:** Zoom controls hidden on mobile
- Desktop: Full zoom in/out/reset controls
- Mobile: Only fullscreen toggle available

**Assessment:** Pinch-to-zoom on mobile replaces button controls. However, this IS a feature gap.

**Status:** ⚠️ QUESTIONABLE (zoom could work on mobile)

---

### 7. Responsive Grids (ACCEPTABLE)

These are proper responsive patterns that just adjust layout, not functionality:

```tsx
// AI Studio - 2 column on desktop, stacked on mobile
<div className="grid gap-6 lg:grid-cols-2">

// Dashboard stats - 4 columns desktop, 2 on mobile
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// Content library grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Status:** ✅ ACCEPTABLE (responsive layout, same content)

---

### 8. Text Label Truncation (ACCEPTABLE)

**File:** `components/clients/client-questionnaire.tsx`

```tsx
<TabsTrigger value="view">
  <span className="hidden sm:inline">View Responses</span>
  <span className="sm:hidden">View</span>
</TabsTrigger>
```

**Assessment:** Same functionality, shorter labels on mobile for space.

**Status:** ✅ ACCEPTABLE

---

### 9. Date Hidden on Mobile (ACCEPTABLE)

**File:** `app/dashboard/page.tsx`

```tsx
// Line 278: Date only shows on larger screens
<p className="text-sm text-muted-foreground hidden sm:block">
  {format(new Date(), 'EEEE, MMMM d, yyyy')}
</p>
```

**Assessment:** Decorative element, not functional.

**Status:** ✅ ACCEPTABLE

---

## 📋 COMPLETE INVENTORY

### Files with Mobile/Desktop Splits

| File | Pattern | Category |
|------|---------|----------|
| `app/dashboard/layout.tsx` | `lg:hidden` / `hidden lg:block` | ❌ PROBLEM |
| `components/mobile-nav.tsx` | Mobile-only component | ❌ PROBLEM |
| `components/questionnaire/navigation/progress-stepper.tsx` | `lg:hidden` / `hidden lg:block` | ⚠️ QUESTION |
| `components/questionnaire/navigation/rich-footer.tsx` | `md:hidden` / `hidden md:grid` | ⚠️ QUESTION |
| `components/responsive-modal.tsx` | `useMediaQuery` conditional | ⚠️ QUESTION |
| `components/responsive-file-preview.tsx` | `useMobile()` conditional | ⚠️ QUESTION |
| `app/dashboard/page.tsx` | `hidden sm:block` | ✅ OK |
| `components/clients/client-questionnaire.tsx` | `hidden sm:inline` | ✅ OK |

### Hooks Used for Responsive Logic

| Hook | File | Purpose |
|------|------|---------|
| `useMobile()` | `hooks/use-mobile.ts` | Returns boolean for < 768px |
| `useMediaQuery()` | `hooks/use-media-query.ts` | Generic media query hook |
| `useScreenSize()` | `hooks/use-mobile.ts` | Returns width/height/isMobile/isTablet/isDesktop |

---

## 🎯 FEATURE GAPS: Desktop vs Mobile

### Features MISSING on Mobile

| Feature | Desktop | Mobile | Severity |
|---------|---------|--------|----------|
| Persistent sidebar | ✅ Yes | ❌ No (hamburger) | HIGH |
| Sidebar collapse toggle | ✅ Yes | ❌ N/A | MEDIUM |
| Sidebar search (⌘K) | ✅ Yes | ❌ Not visible | HIGH |
| Command palette shortcut | ✅ ⌘K visible | ❌ Not visible | MEDIUM |
| Questionnaire Reset button | ✅ Yes | ❌ Hidden | LOW |
| Image zoom controls | ✅ Yes | ❌ Hidden (pinch works) | LOW |

### Features that ARE available on both

| Feature | Status |
|---------|--------|
| All navigation items | ✅ Same items (different order) |
| Theme toggle | ✅ Both have it |
| Logout | ✅ Both have it |
| All pages/content | ✅ Identical |
| All forms | ✅ Identical |
| AI Studio | ✅ Identical |
| Analytics | ✅ Identical (stacked layout) |

---

## 🛠️ RECOMMENDATIONS

### Priority 1: Unify Navigation (HIGH IMPACT)

**Current State:**
- Desktop: `<AppShell>` with `<Sidebar>` + `<TopNav>`
- Mobile: `<MobileNav>` hamburger menu

**Proposed Solution: Unified Collapsible Sidebar**

```tsx
// Unified layout.tsx approach
export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppShell>
        <Sidebar variant="responsive" /> {/* Auto-collapses on mobile */}
        <main>{children}</main>
      </AppShell>
    </SidebarProvider>
  )
}
```

The sidebar should:
1. Be always present (but collapsed) on mobile
2. Open as overlay/drawer on mobile tap
3. Stay collapsed by default on mobile
4. Remember user preference on desktop
5. Include search (⌘K) in both views

**Implementation Steps:**
1. Modify `<Sidebar>` to support `variant="responsive"`
2. Add slide-out drawer behavior for mobile
3. Remove `<MobileNav>` component entirely
4. Update layout.tsx to single unified structure

---

### Priority 2: Fix Nav Item Order

Ensure mobile and desktop use the **same nav items array**:

```tsx
// Single source of truth for nav items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects/board", label: "Projects", icon: FolderKanban },
  // ... same order everywhere
]
```

---

### Priority 3: Add Mobile Reset Button

In `rich-footer.tsx`, move Reset button outside the desktop-only grid:

```tsx
// Make Reset available on mobile too
<div className="flex items-center justify-center gap-2">
  {/* Save status - available everywhere */}
  {/* Reset button - available everywhere */}
</div>
```

---

### Priority 4: Consider Keeping Progress Stepper Split (OK)

The questionnaire stepper is a reasonable responsive pattern:
- Mobile: Horizontal scroll (touch-friendly)
- Desktop: Full visual stepper

This is actually good UX - keep it.

---

## 📊 SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| ❌ PROBLEMATIC (must fix) | 2 |
| ⚠️ QUESTIONABLE (review) | 4 |
| ✅ ACCEPTABLE (keep) | 7+ |

### Key Takeaways

1. **Main Issue:** Dashboard layout renders two completely different apps
2. **Second Issue:** Mobile nav is a separate component with duplicated logic
3. **Good News:** Most pages use proper responsive grids, not conditional components
4. **Good News:** No actual features are missing on mobile pages themselves

### Action Items

- [ ] Unify dashboard layout to single responsive component
- [ ] Convert sidebar to responsive drawer pattern
- [ ] Delete `mobile-nav.tsx` after migration
- [ ] Sync nav item order between all components
- [ ] Add Reset button to mobile questionnaire footer
- [ ] Consider adding zoom controls on mobile (optional)

---

## 🔧 TECHNICAL IMPLEMENTATION PLAN

### Phase 1: Audit Complete ✅

### Phase 2: Sidebar Unification (Recommended)

1. Install/use `@radix-ui/react-dialog` for drawer behavior (already have)
2. Create `<ResponsiveSidebar>` that:
   - Shows collapsed rail on mobile by default
   - Opens as full-screen drawer on hamburger tap
   - Shows full sidebar on desktop
3. Update `layout.tsx` to single DOM structure
4. Delete `mobile-nav.tsx`

### Phase 3: Polish

1. Fix nav item ordering
2. Add missing mobile features (Reset button)
3. Test on real mobile devices
4. Update this audit document

---

**Report Generated:** January 1, 2026
**Audit Scope:** `/savant-marketing-studio/` directory
**Files Analyzed:** 8 files with responsive patterns, 2 hooks

