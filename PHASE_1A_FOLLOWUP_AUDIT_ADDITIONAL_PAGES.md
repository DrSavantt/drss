# UI POLISH AUDIT - Phase 1A Follow-up
## Additional Pages Audit

**Date:** January 17, 2026  
**Scope:** Investigation only - NO fixes implemented  
**Mobile Test Range:** 320px - 428px width

---

## EXECUTIVE SUMMARY

Audited **5 additional pages** missed in the initial audit. Found **31 total issues**:
- **Critical:** 5 issues (immediate action required)
- **Medium:** 16 issues (should fix)
- **Low:** 10 issues (nice to have)

**Most Critical Findings:**
1. Questionnaire Settings drag-and-drop (dnd-kit) doesn't work on mobile touch devices
2. Settings tabs overflow on very small screens (<380px)
3. Archive page tabs truncate/overflow on mobile
4. Framework edit textarea too small for long content on mobile
5. Questionnaire settings nested DndContext for questions may cause issues

---

## PAGE 1: SETTINGS (General)
**File:** `app/dashboard/settings/page.tsx` + `components/settings/settings.tsx`  
**Status:** ⚠️ Issues Found

### Layout Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| **Tabs overflow** | **Critical** | 5 tabs ("General", "AI Configuration", "Appearance", "Questionnaire", "Data") overflow on screens <380px | Add horizontal scroll with scroll-snap OR use dropdown menu on mobile |
| PIN input grid | Medium | 3-column grid for PIN fields cramped on 320px width | Stack vertically on very small screens: `grid-cols-1 sm:grid-cols-3` |
| Radio group wrapping | Low | Theme radio buttons ("Dark", "Light", "System") can wrap awkwardly | Reduce gap between options on mobile |

### Touch & Interaction

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Tab touch targets | Medium | Tab triggers are text-only, small touch area | Add `px-4 py-3` padding to TabsTrigger on mobile |
| Switch accessibility | Low | Switch controls could be larger on mobile | Increase switch size to 44px height |
| Budget input $ prefix | Low | Dollar sign overlay might conflict with mobile tap | Increase left padding to `pl-9` |

### Typography & Readability

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Card descriptions | Low | Long descriptions wrap awkwardly | Reduce font size or add line clamp on mobile |

### Components

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| QuestionnaireSettings lazy load | - | Good - uses dynamic import to reduce bundle | - |
| Success/error messages | Low | Messages could be toast instead of inline for better mobile UX | Consider using toast notifications |

### Console Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| None found | - | Clean implementation | - |

---

## PAGE 2: QUESTIONNAIRE SETTINGS
**File:** `app/dashboard/settings/questionnaire/page.tsx` + `components/settings/questionnaire-settings.tsx`  
**Status:** ⚠️ Issues Found - **CRITICAL**

### Layout Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Section cards overflow | Medium | Drag handles + expand icon + content + switch + actions = crowded on mobile | Reduce padding, make drag handle icon-only |
| Question items in section | Medium | Nested question list adds more horizontal space | Reduce left padding from `pl-16` to `pl-8` on mobile |
| Dialog max-height | Low | Edit dialogs use `max-h-[90vh]` - could overlap with keyboard on mobile | Add bottom padding when keyboard is visible |

### Touch & Interaction - **CRITICAL**

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| **dnd-kit drag-and-drop on touch** | **Critical** | dnd-kit PointerSensor + KeyboardSensor don't work well on touch devices - users can't reorder sections/questions on mobile | Add TouchSensor from @dnd-kit/core, OR disable drag-and-drop on mobile and add up/down arrows |
| **Nested DndContext** | **Critical** | Section expansion reveals nested DndContext for questions - this can cause touch event conflicts on mobile | Test thoroughly on mobile; may need to disable question reordering when on mobile |
| Drag handle visibility | High | Drag handles appear on hover (`opacity-0 group-hover:opacity-100`) - not accessible on touch | Always show drag handles on mobile, OR use long-press to activate drag |
| Edit/Delete icon buttons | Medium | Icon-only buttons (Pencil, Trash2) are small | Increase to `h-10 w-10` on mobile |
| Collapsible expansion | Low | Chevron button to expand section could be larger | Increase touch target to 44px |

### Typography & Readability

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Section title truncation | Medium | Long section titles truncate with single line | Allow 2-line wrap before truncating |
| Question text truncation | Medium | Question text truncates at single line | Show first 2 lines before truncating |

### Components

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| AddSectionDialog | Low | Form fields in dialog could be tighter on mobile | Reduce padding in DialogContent |
| AddQuestionDialog | Medium | Uses `max-w-2xl` which is wide for mobile | Reduce to `max-w-full sm:max-w-2xl` |
| EditQuestionDialog | Medium | Tabs in dialog ("Question" vs "Help Content") - could overflow | Tabs are only 2 items, should be OK but test on 320px |

### Console Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Potential hook order issues | Low | useSortable called in SectionItem - ensure consistent render | Already handled correctly with hooks at top level |

---

## PAGE 3: FRAMEWORKS LIBRARY
**File:** `app/dashboard/frameworks/page.tsx` + `components/frameworks/framework-library.tsx`  
**Status:** ⚠️ Issues Found

### Layout Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Header actions wrapping | Medium | "Import" + "New Framework" buttons wrap on small screens | Stack vertically on <375px, or reduce button text on mobile |
| Category pills overflow | Medium | 7 category pills wrap but take vertical space | Use horizontal scroll with snap OR reduce pill count on mobile |
| Framework grid | Low | Grid uses `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` - mobile shows 1 column which is good | - |

### Touch & Interaction

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Category pill touch targets | Low | Pills have adequate size but could be taller | Increase height to `h-10` minimum |
| Framework card actions | Medium | Card hover actions not accessible on touch | Always show actions on mobile |

### Typography & Readability

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Framework description | Low | Long descriptions truncate | Allow 2-3 lines before truncating |

### Components

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| FrameworkCard | Medium | Need to check hover states work on mobile | Review FrameworkCard component separately |

---

## PAGE 4: FRAMEWORK EDIT
**File:** `app/dashboard/frameworks/[id]/page.tsx` + `app/dashboard/frameworks/[id]/edit-form.tsx`  
**Status:** ⚠️ Issues Found

### Layout Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Header actions | Medium | "Edit Framework" title + Delete button can wrap | Stack vertically on mobile |
| Form container | Low | Uses `max-w-3xl` which is good but could add more padding | Increase `px-6` on mobile |

### Touch & Interaction

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| **Content textarea** | **Critical** | Textarea for framework content is `rows={15}` with `font-mono text-sm` - difficult to edit long content on mobile | Increase rows to 20 on mobile, add better scroll handling |
| Back link touch target | Low | "← Back to Frameworks" link is small | Increase padding to `p-3` |
| Delete button | Low | Delete button in header could be larger | Increase to `h-10` on mobile |

### Typography & Readability

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Textarea font size | Medium | `text-sm` monospace font is hard to read on mobile | Use `text-base` on mobile |
| Helper text | Low | Small helper text under textarea might be hard to read | Ensure adequate contrast and size |

### Components

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Form validation | - | No visible validation errors shown | - |

### Console Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| None found | - | Clean implementation | - |

---

## PAGE 5: ARCHIVE
**File:** `app/dashboard/archive/page.tsx` + `components/archive/archive-list.tsx`  
**Status:** ⚠️ Issues Found - **CRITICAL**

### Layout Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| **Tabs overflow** | **Critical** | 6 tabs in TabsList (`grid-cols-6`) overflow on mobile - text + icon + count is too much | Use `grid-cols-2` or `grid-cols-3` on mobile with multiple rows, OR use horizontal scroll |
| Tab text hidden | High | `<span className="hidden sm:inline">` hides tab text on mobile - only icons show | This is intentional but might be confusing; consider showing text on tap/hover |
| Card button layout | Medium | Two buttons ("Restore" + "Delete Forever") wrap on narrow cards | Stack vertically on very small screens (<400px) |

### Touch & Interaction

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Tab touch targets | Medium | Tabs with icon + text + count are crowded | Increase tab height to minimum 44px |
| Button sizes | Low | Buttons are `size="sm"` which might be small | Use `size="default"` on mobile |
| Card click area | Low | Only buttons are clickable - no card click | Consider making entire card clickable to show details |

### Typography & Readability

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| Title truncation | Medium | Card titles truncate at single line | Allow 2-line wrap before truncating |
| Metadata text | Low | Multiple metadata items separated by " - " can be long | Use separate lines on mobile |

### Components

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| EmptyState | - | Good implementation | - |
| AlertDialog | - | Confirmation dialog should work on mobile | - |

### Console Issues

| Issue | Severity | Description | Fix Needed |
|-------|----------|-------------|------------|
| None found | - | Clean implementation | - |

---

## PAGES NOT FOUND

### Deep Research Page
**Status:** ❌ Does Not Exist  
**Note:** No deep research page found in codebase. This feature may not be implemented yet.

### AI History Page (Separate)
**Status:** ✅ Already Audited  
**Note:** AI history is part of Client Detail tabs (already audited in main report as "Client AI History Tab").

---

## SUMMARY BY SEVERITY

### Critical Issues (5)
1. **Settings:** Tabs overflow on mobile (<380px)
2. **Questionnaire Settings:** dnd-kit drag-and-drop doesn't work on touch devices
3. **Questionnaire Settings:** Nested DndContext for questions may cause touch conflicts
4. **Framework Edit:** Content textarea difficult to use on mobile (small, short)
5. **Archive:** 6-column tab grid overflows on mobile

### Medium Issues (16)
- Settings: PIN input grid, tab touch targets
- Questionnaire Settings: Section overflow, question items padding, title/text truncation, dialogs, edit/delete buttons
- Frameworks: Header wrapping, category pills, card actions
- Framework Edit: Header wrapping, textarea font size
- Archive: Card buttons wrapping, tab touch targets, title truncation

### Low Issues (10)
- Various typography, spacing, and minor UX improvements across all pages

---

## PRIORITY FIX ORDER

### Immediate (Critical - Week 1)
1. **Questionnaire Settings - Touch Drag-and-Drop**
   - Add TouchSensor to dnd-kit sensors
   - Test nested DndContext on mobile
   - Add up/down arrow buttons as alternative to drag
   - Always show drag handles on mobile (remove hover-only)

2. **Archive Page - Tab Layout**
   - Change to 2-column or 3-column grid on mobile
   - OR implement horizontal scroll with indicators

3. **Settings Page - Tab Overflow**
   - Add horizontal scroll with scroll-snap
   - OR use dropdown menu on mobile

4. **Framework Edit - Textarea Usability**
   - Increase rows to 20+ on mobile
   - Change font to `text-base` on mobile
   - Add better scroll handling

### High Priority (Week 2)
5. Tab touch targets across all pages (Settings, Archive)
6. Questionnaire Settings drag handle visibility
7. Archive tab text visibility
8. Header action button layouts (Frameworks, Framework Edit)

### Medium Priority (Week 3)
9. Questionnaire Settings section/question truncation
10. Framework Library category pills scroll
11. Archive card button stacking
12. Dialog max-widths on mobile

### Low Priority (Week 4)
13. Typography improvements
14. Touch target size increases
15. Helper text readability
16. Success/error message toasts

---

## QUESTIONNAIRE SETTINGS - SPECIFIC FINDINGS

### dnd-kit Touch Support
**Current Implementation:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

**Problem:** PointerSensor doesn't reliably detect touch drag on mobile devices.

**Fix Needed:**
```typescript
import { TouchSensor } from '@dnd-kit/core'

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

**Alternative:** Disable drag-and-drop on mobile, add up/down arrows:
```tsx
{!isMobile && (
  <button {...attributes} {...listeners}>
    <GripVertical />
  </button>
)}
{isMobile && (
  <div className="flex flex-col">
    <button onClick={() => moveUp(id)}>↑</button>
    <button onClick={() => moveDown(id)}>↓</button>
  </div>
)}
```

### Drag Handle Visibility
**Current:** `opacity-0 group-hover:opacity-100`  
**Problem:** Hover doesn't work on touch devices

**Fix:**
```tsx
className={cn(
  "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-opacity",
  "opacity-0 group-hover:opacity-100",
  "md:opacity-0 md:group-hover:opacity-100", // Hide on desktop
  "opacity-100" // Always show on mobile
)}
```

Or use media query:
```tsx
className={cn(
  "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground",
  "opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 md:opacity-100"
)}
```

---

## ARCHIVE PAGE - SPECIFIC FINDINGS

### Tab Layout Options

**Current:** `grid-cols-6` (breaks on mobile)

**Option 1 - Responsive Grid:**
```tsx
<TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
```

**Option 2 - Horizontal Scroll:**
```tsx
<TabsList className="w-full flex overflow-x-auto snap-x snap-mandatory h-auto">
  <TabsTrigger className="flex-shrink-0 snap-start">
```

**Option 3 - Dropdown on Mobile:**
```tsx
{isMobile ? (
  <Select value={activeTab} onValueChange={setActiveTab}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {tabs.map(tab => (
        <SelectItem value={tab.value}>{tab.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
) : (
  <TabsList>...</TabsList>
)}
```

---

## TESTING RECOMMENDATIONS

### Questionnaire Settings - Touch Testing
1. Test drag-and-drop on iOS Safari (notoriously difficult)
2. Test on Android Chrome
3. Test nested DndContext (sections with questions inside)
4. Test long-press vs immediate drag
5. Verify keyboard sensors still work for accessibility

### Archive Page - Tab Testing
1. Test on 320px width (iPhone SE)
2. Test horizontal scroll behavior
3. Test tab switching with touch
4. Verify counts display correctly when truncated

### Framework Edit - Content Testing
1. Test editing long framework content (1000+ characters)
2. Test with mobile keyboard open (viewport height reduces)
3. Test scroll behavior in textarea
4. Test copy/paste on mobile

---

## COMBINED SUMMARY (Main + Follow-up)

**Total Pages Audited:** 15  
**Total Issues Found:** 78

| Severity | Main Audit | Follow-up | Total |
|----------|-----------|-----------|-------|
| Critical | 12 | 5 | **17** |
| Medium | 21 | 16 | **37** |
| Low | 14 | 10 | **24** |
| **Total** | **47** | **31** | **78** |

### Top 10 Critical Issues (Combined)
1. Projects Kanban - No mobile alternative
2. Questionnaire Settings - dnd-kit touch support
3. Client Detail - Tabs overflow
4. AI Chat - Context chips overflow
5. Journal - Sidebar always visible
6. Analytics - Tab navigation overflow
7. Archive - 6-column tabs overflow
8. Settings - Tab overflow
9. Framework Edit - Textarea usability
10. Touch targets below 44px (multiple pages)

---

**End of Follow-up Audit Report**
