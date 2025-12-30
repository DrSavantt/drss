# DELETE OLD FORM & V0 AUDIT REPORT

**Date:** December 28, 2025  
**Task:** Delete old internal form route and audit v0 design system for questionnaires

---

## ✅ STEP 1: DELETED - INTERNAL FORM ROUTE

### Files Deleted:
```bash
✅ DELETED: app/dashboard/clients/onboarding/[id]/page.tsx (400 lines)
✅ DELETED: app/dashboard/clients/onboarding/[id]/layout.tsx
✅ DELETED: Entire folder removed: app/dashboard/clients/onboarding/
```

**Reason:** User considers this OLD PRODUCTION code that doesn't match v0 design system.

---

## ⚠️ STEP 2: BROKEN LINKS FOUND

### Links to Deleted Route (Need Fixing):

| File | Line | Code | Action Needed |
|------|------|------|---------------|
| **`app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx`** | 40 | `router.push(\`/dashboard/clients/onboarding/${clientId}\`)` | 🔧 **UPDATE** - Change to new route |
| **`app/dashboard/clients/[id]/questionnaire-responses/page.tsx`** | 233 | `href={\`/dashboard/clients/onboarding/${client.id}?mode=edit\`}` | 🔧 **UPDATE** - Change to new route |
| **`components/clients/questionnaire-status-card.tsx`** | 115 | `<Link href={\`/dashboard/clients/onboarding/${clientId}\`}>` | 🔧 **UPDATE** - Change to new route |
| **`components/clients/client-questionnaire.tsx`** | 117 | `router.push(\`/dashboard/clients/onboarding/${clientId}\`)` | 🔧 **UPDATE** - Change to new route |
| **`components/clients/client-questionnaire.tsx`** | 122 | `router.push(\`/dashboard/clients/onboarding/${clientId}?mode=edit\`)` | 🔧 **UPDATE** - Change to new route |

### Revalidation Paths (Safe to Keep):

| File | Lines | Code | Action |
|------|-------|------|--------|
| **`app/actions/questionnaire-config.ts`** | 228, 252, 286, 304, 339, 355, 372, 410, 446 | `revalidatePath('/dashboard/clients/onboarding')` | ✅ **KEEP** - Will be harmless (no route exists) |

### Status References (Safe - Not Routes):

| File | Lines | Code | Action |
|------|-------|------|--------|
| **`app/form/[token]/layout.tsx`** | 5 | `description: 'Complete your onboarding questionnaire...'` | ✅ **KEEP** - Just text |
| **`app/dashboard/research/page.tsx`** | 317 | `"...focusing on onboarding sequences..."` | ✅ **KEEP** - Just example text |
| **`app/api/clients/route.ts`** | 50, 54 | `status: "onboarded" \| "onboarding" \| "new"` | ✅ **KEEP** - Status enum |
| **`app/api/clients/[id]/route.ts`** | 52, 56 | `status: "onboarded" \| "onboarding" \| "new"` | ✅ **KEEP** - Status enum |
| **`components/clients/client-card.tsx`** | 10, 23 | Status badge definitions | ✅ **KEEP** - UI labels |
| **`components/clients/client-list.tsx`** | 19, 125 | Status filter | ✅ **KEEP** - UI filter |
| **`components/clients/client-detail.tsx`** | 43, 142 | Status display | ✅ **KEEP** - UI display |
| **`components/clients/new-client-dialog.tsx`** | 77 | Help text mentioning "onboarding" | ✅ **KEEP** - Just text |

---

## 🎨 STEP 3: V0 DESIGN SYSTEM AUDIT

### V0 Folder Structure:
```
ui-design-system/
├── app/                    # Demo pages
├── components/
│   ├── clients/           # Client-related components
│   │   ├── client-card.tsx
│   │   ├── client-list.tsx
│   │   ├── client-detail.tsx
│   │   ├── new-client-dialog.tsx
│   │   └── client-questionnaire.tsx ⭐ KEY FILE
│   ├── ui/                # 57 shadcn/ui components
│   └── [other features]/
├── hooks/
├── lib/
└── styles/
```

### V0 UI Components Available (57 total):

**Form Components:**
- ✅ `form.tsx` - Form wrapper with validation
- ✅ `input.tsx` - Text input
- ✅ `textarea.tsx` - Multi-line text input
- ✅ `select.tsx` - Dropdown select
- ✅ `radio-group.tsx` - Radio buttons
- ✅ `checkbox.tsx` - Checkboxes
- ✅ `switch.tsx` - Toggle switch
- ✅ `slider.tsx` - Range slider
- ✅ `calendar.tsx` - Date picker
- ✅ `input-otp.tsx` - OTP input
- ✅ `input-group.tsx` - Input with addons
- ✅ `label.tsx` - Form labels

**Layout Components:**
- ✅ `card.tsx` - Card container
- ✅ `sheet.tsx` - Slide-out panel (for help)
- ✅ `dialog.tsx` - Modal dialog
- ✅ `drawer.tsx` - Bottom drawer
- ✅ `tabs.tsx` - Tab navigation
- ✅ `accordion.tsx` - Collapsible sections
- ✅ `separator.tsx` - Divider line
- ✅ `scroll-area.tsx` - Scrollable container
- ✅ `resizable.tsx` - Resizable panels

**Navigation Components:**
- ✅ `button.tsx` - Button
- ✅ `button-group.tsx` - Button groups
- ✅ `breadcrumb.tsx` - Breadcrumb nav
- ✅ `pagination.tsx` - Page navigation
- ✅ `navigation-menu.tsx` - Nav menu
- ✅ `menubar.tsx` - Menu bar
- ✅ `dropdown-menu.tsx` - Dropdown menu
- ✅ `context-menu.tsx` - Right-click menu
- ✅ `sidebar.tsx` - Sidebar navigation

**Feedback Components:**
- ✅ `progress.tsx` - Progress bar ⭐
- ✅ `toast.tsx` / `toaster.tsx` / `sonner.tsx` - Notifications
- ✅ `alert.tsx` - Alert messages
- ✅ `alert-dialog.tsx` - Confirmation dialogs
- ✅ `badge.tsx` - Status badges
- ✅ `tooltip.tsx` - Tooltips
- ✅ `hover-card.tsx` - Hover popover
- ✅ `popover.tsx` - Popover
- ✅ `skeleton.tsx` - Loading skeleton
- ✅ `spinner.tsx` - Loading spinner

**Data Display:**
- ✅ `table.tsx` - Data table
- ✅ `chart.tsx` - Charts
- ✅ `stat-card.tsx` - Stat cards
- ✅ `avatar.tsx` - Avatar
- ✅ `aspect-ratio.tsx` - Aspect ratio container
- ✅ `carousel.tsx` - Image carousel
- ✅ `collapsible.tsx` - Collapsible content

**Utility:**
- ✅ `toggle.tsx` / `toggle-group.tsx` - Toggle buttons
- ✅ `kbd.tsx` - Keyboard shortcuts
- ✅ `empty.tsx` - Empty states
- ✅ `field.tsx` - Form field wrapper
- ✅ `item.tsx` - List item
- ✅ `use-mobile.tsx` - Mobile detection hook
- ✅ `use-toast.ts` - Toast hook

### V0 Components Perfect for Questionnaires:

| Component | Use For | Status |
|-----------|---------|--------|
| **`card.tsx`** | Section containers | ✅ Available |
| **`form.tsx`** | Form wrapper with validation | ✅ Available |
| **`textarea.tsx`** | Long-text questions | ✅ Available |
| **`input.tsx`** | Short-text questions | ✅ Available |
| **`radio-group.tsx`** | Multiple choice (single) | ✅ Available |
| **`checkbox.tsx`** | Multiple choice (multi) | ✅ Available |
| **`progress.tsx`** | Progress indicator | ✅ Available |
| **`sheet.tsx`** | Help panel (slide-out) | ✅ Available |
| **`button.tsx`** | Navigation buttons | ✅ Available |
| **`label.tsx`** | Question labels | ✅ Available |
| **`badge.tsx`** | Status badges | ✅ Available |
| **`separator.tsx`** | Section dividers | ✅ Available |
| **`tabs.tsx`** | Section navigation | ✅ Available |
| **`accordion.tsx`** | Collapsible sections | ✅ Available |
| **`tooltip.tsx`** | Help tooltips | ✅ Available |
| **`skeleton.tsx`** | Loading states | ✅ Available |

---

## ⭐ STEP 4: CLIENT PROFILE QUESTIONNAIRE (V0 VERSION)

### The "v0 Version" - What User Wants to Keep:

**File:** `ui-design-system/components/clients/client-questionnaire.tsx` (259 lines)

**Description:** This is the v0 design system's questionnaire component embedded in the client profile.

### Key Features:

1. **Clean v0 Design:**
   - Uses shadcn/ui components (Card, Sheet, Button, Textarea, Progress)
   - Sidebar navigation with section pills
   - Help panel slides out from right
   - Progress bar at top

2. **Layout:**
   ```
   ┌─────────────────────────────────────────────┐
   │ [Sidebar]  [Main Content]                   │
   │ ┌────────┐ ┌──────────────────────────────┐ │
   │ │Sections│ │ Section 1: Avatar            │ │
   │ │        │ │ ────────────────────────────  │ │
   │ │[Progress│ │ Q1. Who is your ideal...    │ │
   │ │  75%]  │ │ [Textarea]                   │ │
   │ │        │ │                               │ │
   │ │✓Avatar │ │ Q2. What does a day...       │ │
   │ │✓Dream  │ │ [Textarea]                   │ │
   │ │ Probs  │ │                               │ │
   │ │ Solution│ │ [Previous] 1/8 [Next]        │ │
   │ └────────┘ └──────────────────────────────┘ │
   └─────────────────────────────────────────────┘
   ```

3. **Hardcoded Sections (8 total):**
   - Avatar (4 questions)
   - Dream Outcome (4 questions)
   - Problems & Obstacles (4 questions)
   - Your Solution (4 questions)
   - Brand Voice (4 questions)
   - Social Proof (4 questions)
   - Belief Shifts (4 questions)
   - Success Metrics (4 questions)
   - **Total: 32 questions**

4. **Features:**
   - ✅ Section navigation sidebar
   - ✅ Progress indicator
   - ✅ Help panel (Sheet component)
   - ✅ Save draft button
   - ✅ Previous/Next navigation
   - ✅ Character count
   - ✅ Section completion checkmarks

### Code Structure:

```typescript
// IMPORTS: All v0 shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// HARDCODED SECTIONS ARRAY (lines 17-98)
const sections = [
  { id: "avatar", title: "Avatar", questions: [...] },
  { id: "dream", title: "Dream Outcome", questions: [...] },
  // ... 8 sections total
]

// COMPONENT (lines 100-258)
export function ClientQuestionnaire({ clientName }: ClientQuestionnaireProps) {
  const [activeSection, setActiveSection] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  // Renders:
  // - Sidebar with section nav + progress
  // - Main content with questions
  // - Help sheet for each question
  // - Previous/Next buttons
}
```

### ⚠️ Problem: Still Hardcoded!

This v0 component has the **SAME PROBLEM** as the production code:
- Hardcoded 8 sections
- Hardcoded 32 questions
- No database integration
- Can't add/remove sections without code changes

**BUT** it has the **v0 design aesthetic** the user wants!

---

## 📦 STEP 5: INVENTORY - WHAT REMAINS

### Remaining Questionnaire Routes:

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| **Public Form** | `app/form/[token]/page.tsx` | Client-facing form (email link) | ✅ KEEP |
| **Completion** | `app/form/[token]/complete/page.tsx` | Thank you page | ✅ KEEP |
| **Responses Viewer** | `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` | View submitted responses | ✅ KEEP |
| **Settings** | `app/dashboard/settings/questionnaire/page.tsx` | Admin config (sections/questions) | ✅ KEEP |
| ~~**Internal Form**~~ | ~~`app/dashboard/clients/onboarding/[id]/page.tsx`~~ | ~~Staff-facing form~~ | ❌ **DELETED** |

### Remaining Questionnaire Components:

**Core Components (3 files):**
- ✅ `public-questionnaire-form.tsx` (521 lines) - Public form implementation
- ✅ `section-renderer.tsx` (82 lines) - Database-driven section renderer
- ✅ `question-renderer.tsx` (134 lines) - Type-based question renderer

**Question Types (5 files):**
- ✅ `question-types/long-text-question.tsx`
- ✅ `question-types/short-text-question.tsx`
- ✅ `question-types/multiple-choice-question.tsx`
- ✅ `question-types/file-upload-question.tsx`
- ✅ `question-types/question-wrapper.tsx`

**Navigation (5 files):**
- ✅ `navigation/progress-stepper.tsx` - Top progress bar
- ✅ `navigation/rich-footer.tsx` - Bottom sticky nav
- ⚠️ `navigation/section-nav.tsx` - Sidebar nav (unused?)
- ⚠️ `navigation/progress-indicator.tsx` - Old progress (unused?)
- ⚠️ `navigation/step-footer.tsx` - Old footer (unused?)

**Help System (3 files):**
- ✅ `help-system/help-panel.tsx`
- ✅ `help-system/help-trigger.tsx`
- ✅ `help-system/config-help-content.tsx`

**Sections (3 files):**
- ✅ `sections/section-container.tsx`
- ✅ `sections/section-header.tsx`
- ✅ `sections/section-header-card.tsx`

**Review (2 files):**
- ⚠️ `review/questionnaire-review.tsx` (262 lines) - **Hardcoded 8 sections**
- ✅ `review/review-section-card.tsx`

**Viewers (2 files):**
- ✅ `response-viewer.tsx` (181 lines)
- ✅ `response-history.tsx` (150 lines)

**Other (2 files):**
- ✅ `share-questionnaire-popup.tsx` (448 lines)
- ✅ `question-editor-modal.tsx` (150 lines)

**Total:** 25 component files remain

### Remaining Lib Files:

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `types.ts` | 130 | ⚠️ **HARDCODED** | QuestionnaireData interface |
| `use-questionnaire-form.ts` | 714 | ⚠️ **HARDCODED** | Switch statements |
| `questions-config.ts` | ~200 | ✅ CLEAN | Database types |
| `questionnaire-config-context.tsx` | ~250 | ✅ CLEAN | Database provider |
| `dynamic-validation.ts` | ~150 | ✅ CLEAN | Config-based validation |
| `conditional-logic.ts` | ~100 | ✅ CLEAN | Config-based logic |
| `validation-schemas.ts` | ~80 | ⚠️ UNUSED? | May be legacy |

**Total:** 7 lib files remain

---

## 🎯 STEP 6: NEXT STEPS - PATH TO ONE UNIFIED V0-STYLED FORM

### The Vision:

**ONE unified form system** that:
1. Uses **v0 design aesthetic** (shadcn/ui components)
2. Is **database-driven** (no hardcoded sections)
3. Works in **multiple contexts**:
   - Public form (client-facing)
   - Internal form (staff-facing, embedded in client profile)
   - Response viewer (read-only)

### Current State:

| Component | Design System | Database-Driven | Context |
|-----------|---------------|-----------------|---------|
| **Public Form** (`public-questionnaire-form.tsx`) | ❌ Custom | ✅ Yes | Public |
| **Internal Form** (DELETED) | ❌ Custom | ✅ Yes | ~~Internal~~ |
| **V0 Questionnaire** (`ui-design-system/...`) | ✅ v0 | ❌ No | Demo only |
| **Client Profile Tab** (`client-questionnaire.tsx`) | ✅ v0 | ❌ No | Internal |

### The Problem:

We have **TWO separate implementations**:

1. **Production Code** (database-driven but not v0-styled):
   - `components/questionnaire/public-questionnaire-form.tsx`
   - `components/questionnaire/section-renderer.tsx`
   - `components/questionnaire/question-renderer.tsx`
   - ✅ Database-driven
   - ❌ Not using v0 design system
   - ❌ Has hardcoded types/logic in supporting files

2. **V0 Demo Code** (v0-styled but not database-driven):
   - `ui-design-system/components/clients/client-questionnaire.tsx`
   - ✅ Uses v0 shadcn/ui components
   - ✅ Clean design aesthetic
   - ❌ Hardcoded 8 sections
   - ❌ No database integration

### The Solution: 3-Phase Approach

---

#### **PHASE 1: Fix Hardcoded Types (2 hours)**

**Goal:** Make production code truly database-driven

**Tasks:**
1. Fix `lib/questionnaire/types.ts`:
   ```typescript
   // FROM:
   export interface QuestionnaireData {
     avatar_definition: { q1_ideal_customer: string; ... };
     // ... 8 hardcoded sections
   }
   
   // TO:
   export type QuestionnaireData = Record<string, Record<string, any>>;
   ```

2. Fix `lib/questionnaire/use-questionnaire-form.ts`:
   - Remove hardcoded switch statements (lines 485-534, 690-714)
   - Use dynamic section lookup from config

3. Fix `components/questionnaire/review/questionnaire-review.tsx`:
   - Remove 8 hardcoded ReviewSectionCard components
   - Map over config.getEnabledSections()

**Result:** Production code is 100% database-driven

---

#### **PHASE 2: Migrate to v0 Design System (4 hours)**

**Goal:** Replace custom components with v0 shadcn/ui components

**Tasks:**

1. **Update Question Type Components:**
   ```typescript
   // BEFORE: Custom styled components
   components/questionnaire/question-types/long-text-question.tsx
   
   // AFTER: Use v0 Textarea component
   import { Textarea } from '@/components/ui/textarea'
   import { Label } from '@/components/ui/label'
   ```

2. **Update Section Renderer:**
   ```typescript
   // BEFORE: Custom Card component
   import SectionContainer from './sections/section-container'
   
   // AFTER: Use v0 Card
   import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
   ```

3. **Update Navigation:**
   ```typescript
   // BEFORE: Custom progress stepper
   import { ProgressStepper } from './navigation/progress-stepper'
   
   // AFTER: Use v0 Progress + Tabs
   import { Progress } from '@/components/ui/progress'
   import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
   ```

4. **Update Help System:**
   ```typescript
   // BEFORE: Custom help panel
   import { HelpPanel } from './help-system/help-panel'
   
   // AFTER: Use v0 Sheet
   import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
   ```

5. **Copy v0 Layout Structure:**
   - Use the sidebar + main content layout from v0 demo
   - Use v0 button styles and spacing
   - Use v0 color scheme (primary, muted, etc.)

**Result:** Production code looks like v0 demo

---

#### **PHASE 3: Create Unified Component (2 hours)**

**Goal:** ONE component that works in all contexts

**Tasks:**

1. **Create `UnifiedQuestionnaireForm` component:**
   ```typescript
   interface UnifiedQuestionnaireFormProps {
     mode: 'public' | 'internal' | 'readonly'
     clientId: string
     clientName?: string
     token?: string
     sections: SectionConfig[]
     questions: QuestionConfig[]
     existingData?: QuestionnaireData
     onSubmit?: (data: QuestionnaireData) => Promise<void>
   }
   
   export function UnifiedQuestionnaireForm({ mode, ...props }) {
     // Shared logic for all contexts
     // Uses v0 components
     // Database-driven from config
     
     // Conditional rendering based on mode:
     if (mode === 'public') {
       // Show theme toggle, simple nav
     } else if (mode === 'internal') {
       // Show sidebar, rich nav, save draft
     } else {
       // Read-only view
     }
   }
   ```

2. **Update Routes to Use Unified Component:**
   ```typescript
   // Public form
   app/form/[token]/page.tsx
     → <UnifiedQuestionnaireForm mode="public" ... />
   
   // Internal form (new route)
   app/dashboard/clients/[id]/questionnaire/page.tsx
     → <UnifiedQuestionnaireForm mode="internal" ... />
   
   // Response viewer
   app/dashboard/clients/[id]/questionnaire-responses/page.tsx
     → <UnifiedQuestionnaireForm mode="readonly" ... />
   ```

3. **Update Client Profile Tab:**
   ```typescript
   // Replace old client-questionnaire.tsx
   components/clients/client-questionnaire.tsx
     → Embed <UnifiedQuestionnaireForm mode="internal" ... />
   ```

4. **Fix Broken Links:**
   - Update all references from `/dashboard/clients/onboarding/${clientId}`
   - Change to `/dashboard/clients/${clientId}/questionnaire`

**Result:** ONE component used everywhere, v0-styled, database-driven

---

### File Changes Summary:

**Files to DELETE:**
```
❌ components/questionnaire/navigation/section-nav.tsx (if unused)
❌ components/questionnaire/navigation/progress-indicator.tsx (if unused)
❌ components/questionnaire/navigation/step-footer.tsx (if unused)
❌ lib/questionnaire/validation-schemas.ts (if unused)
❌ ui-design-system/components/clients/client-questionnaire.tsx (replaced)
```

**Files to REFACTOR:**
```
🔧 lib/questionnaire/types.ts (remove hardcoded interface)
🔧 lib/questionnaire/use-questionnaire-form.ts (remove switch cases)
🔧 components/questionnaire/review/questionnaire-review.tsx (make dynamic)
🔧 components/questionnaire/public-questionnaire-form.tsx (migrate to v0 components)
🔧 components/questionnaire/section-renderer.tsx (use v0 Card)
🔧 components/questionnaire/question-renderer.tsx (use v0 form components)
🔧 components/questionnaire/question-types/*.tsx (use v0 inputs)
🔧 components/questionnaire/navigation/progress-stepper.tsx (use v0 Progress)
🔧 components/questionnaire/help-system/help-panel.tsx (use v0 Sheet)
```

**Files to CREATE:**
```
✨ components/questionnaire/unified-questionnaire-form.tsx (new unified component)
✨ app/dashboard/clients/[id]/questionnaire/page.tsx (new internal form route)
```

**Files to UPDATE (broken links):**
```
✏️ app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx (line 40)
✏️ app/dashboard/clients/[id]/questionnaire-responses/page.tsx (line 233)
✏️ components/clients/questionnaire-status-card.tsx (line 115)
✏️ components/clients/client-questionnaire.tsx (lines 117, 122)
```

---

### Time Estimate:

| Phase | Time | Difficulty |
|-------|------|------------|
| Phase 1: Fix hardcoded types | 2 hours | Medium-Hard |
| Phase 2: Migrate to v0 design | 4 hours | Medium |
| Phase 3: Create unified component | 2 hours | Medium |
| Testing & bug fixes | 2 hours | Easy |
| **TOTAL** | **10 hours** | **Medium** |

---

### Success Criteria:

After completion:

✅ ONE `UnifiedQuestionnaireForm` component  
✅ Uses v0 shadcn/ui design system  
✅ 100% database-driven (no hardcoded sections)  
✅ Works in public context (client-facing)  
✅ Works in internal context (staff-facing, client profile)  
✅ Works in readonly context (response viewer)  
✅ All broken links fixed  
✅ Can add/remove sections via database without code changes  
✅ Matches v0 aesthetic user wants  

---

## 📋 IMMEDIATE ACTION ITEMS

### 1. Fix Broken Links (15 minutes)

**Priority: 🔥 URGENT** - These will cause 404 errors

Update these 5 files to point to new route:

```typescript
// Change FROM:
/dashboard/clients/onboarding/${clientId}

// Change TO:
/dashboard/clients/${clientId}/questionnaire
```

**Files to update:**
1. `app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx` (line 40)
2. `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` (line 233)
3. `components/clients/questionnaire-status-card.tsx` (line 115)
4. `components/clients/client-questionnaire.tsx` (lines 117, 122)

### 2. Create Temporary Internal Form Route (30 minutes)

**Priority: ⚠️ HIGH** - Restore functionality

Create: `app/dashboard/clients/[id]/questionnaire/page.tsx`

Quick temporary solution:
```typescript
// Just redirect to public form for now
export default function InternalQuestionnairePage({ params }) {
  redirect(`/form/${client.questionnaire_token}`)
}
```

OR embed the v0 component as-is:
```typescript
import { ClientQuestionnaire } from '@/components/clients/client-questionnaire'

export default function InternalQuestionnairePage({ params }) {
  return <ClientQuestionnaire clientId={params.id} clientName={client.name} />
}
```

### 3. Then Follow 3-Phase Plan Above

Start with Phase 1 (fix hardcoded types), then Phase 2 (v0 design), then Phase 3 (unified component).

---

**END OF REPORT**



