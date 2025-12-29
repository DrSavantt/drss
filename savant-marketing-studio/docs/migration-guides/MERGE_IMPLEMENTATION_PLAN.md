# DRSS MERGE IMPLEMENTATION PLAN
**Date:** December 23, 2025  
**Goal:** Port production features INTO local v0 UI WITHOUT losing new features

---

## 🛡️ PROTECTED FILES (NEVER MODIFY)

These files have NEW functionality that doesn't exist in production:

### Critical - Soft Delete System:
- `/app/actions/clients.ts` - Has restoreClient, getArchivedClients, permanentlyDeleteClient
- `/app/api/clients/route.ts` - Enhanced stats + soft-delete filter
- `/app/dashboard/archive/page.tsx` - Archive management

### Database Migrations:
- `/supabase/migrations/20251223000001_add_industry_column.sql`
- `/supabase/migrations/20251223000002_add_client_id_to_activity_log.sql`
- `/supabase/migrations/20251223000003_add_soft_delete.sql`

### Components with New Features:
- `/components/clients/new-client-dialog.tsx` - Has industry field

---

## 📦 FEATURES TO PORT FROM PRODUCTION

### Phase 1: Dashboard Enhancements (4-6 hours)

#### 1.1 MetricCards Component
**Source:** `/production-backup/components/dashboard/metric-cards.tsx`
**Target:** `/savant-marketing-studio/components/dashboard/metric-cards.tsx` (NEW FILE)
**What it does:** 5 expandable metric cards with auto-refresh
**Approach:** 
- Create NEW file (don't overwrite anything)
- Adapt to v0/shadcn styling
- Integrate into dashboard page

#### 1.2 UrgentItems Component  
**Source:** `/production-backup/components/urgent-items.tsx`
**Target:** `/savant-marketing-studio/components/dashboard/urgent-items.tsx` (NEW FILE)
**What it does:** Pulsing indicators for overdue items
**Approach:**
- Create NEW file
- Adapt to v0 styling
- Replace simpler urgent projects card

#### 1.3 Metro Quick Action Tiles
**Source:** `/production-backup/app/dashboard/page.tsx` (lines 45-134)
**Target:** Integrate into existing dashboard
**What it does:** Large tiles for CLIENT, PROJECT, CONTENT, NOTE
**Approach:**
- Add to existing dashboard page (don't replace)
- Use v0 styling

---

### Phase 2: Client Detail Enhancements (3-4 hours)

#### 2.1 Quick Captures Component
**Source:** `/production-backup/app/dashboard/clients/[id]/client-captures.tsx`
**Target:** `/savant-marketing-studio/components/clients/client-captures.tsx` (NEW FILE)
**What it does:** Journal entries specific to client
**Approach:**
- Create NEW file with v0 styling
- Integrate into client-detail.tsx

#### 2.2 Inline Projects Display (Remove Placeholder)
**Source:** `/production-backup/app/dashboard/clients/[id]/page.tsx` (lines 263-350)
**Target:** Modify `/savant-marketing-studio/components/clients/client-detail.tsx`
**What it does:** Show actual project data instead of "Projects will appear here"
**Approach:**
- Add data fetching to Projects tab
- Display project cards inline
- Keep v0 styling

#### 2.3 Inline Content Display (Remove Placeholder)
**Source:** `/production-backup/app/dashboard/clients/[id]/page.tsx` (lines 351-443)
**Target:** Modify `/savant-marketing-studio/components/clients/client-detail.tsx`
**What it does:** Show actual content data instead of "Content will appear here"
**Approach:**
- Add data fetching to Content tab
- Display content cards inline
- Keep v0 styling

#### 2.4 Questionnaire Status Prominence
**Source:** `/production-backup/app/dashboard/clients/[id]/page.tsx` (lines 106-156)
**Target:** Modify `/savant-marketing-studio/components/clients/client-detail.tsx`
**What it does:** Prominent questionnaire status with resume button
**Approach:**
- Move questionnaire status to Overview tab (not separate tab)
- Add progress indicator and action buttons
- Keep v0 styling

---

### Phase 3: Verification (2-3 hours)

#### 3.1 Test Soft Delete
- [ ] Delete a client → appears in Archive
- [ ] Restore from Archive → reappears in list
- [ ] Permanent delete → removed forever
- [ ] Deleted clients excluded from all lists

#### 3.2 Test Ported Features
- [ ] MetricCards expand/collapse
- [ ] UrgentItems show correct data
- [ ] Quick Captures work
- [ ] Inline Projects display
- [ ] Inline Content display
- [ ] Questionnaire status prominent

#### 3.3 Test Existing Features
- [ ] Client CRUD works
- [ ] Project Kanban works
- [ ] Journal @mentions work
- [ ] Content library works
- [ ] AI generation works

---

## 📋 IMPLEMENTATION ORDER

1. ✅ **0.1** - Fix build error (client-code-display) - DONE
2. ⏳ **1.1** - Port MetricCards (create new file)
3. ⏳ **1.2** - Port UrgentItems (create new file)
4. ⏳ **2.1** - Port Quick Captures (create new file)
5. ⏳ **2.2** - Fix Projects tab placeholder (modify client-detail)
6. ⏳ **2.3** - Fix Content tab placeholder (modify client-detail)
7. ⏳ **2.4** - Improve Questionnaire status (modify client-detail)
8. ⏳ **3.1** - Test soft delete
9. ⏳ **3.2** - Test ported features
10. ⏳ **3.3** - Test existing features
11. ⏳ **DEPLOY** - Commit and push

---

## ⚠️ MERGE RULES

### ✅ DO:
- Create NEW component files
- Add imports to existing pages
- Use v0/shadcn styling patterns
- Preserve all soft-delete logic
- Test after each change

### ❌ DON'T:
- Overwrite /app/actions/clients.ts
- Overwrite /app/api/clients/route.ts  
- Overwrite /app/dashboard/archive/page.tsx
- Remove .is('deleted_at', null) filters
- Copy production files directly (adapt them)

---

## 🎨 V0 STYLING REFERENCE

When porting, use these patterns from local codebase:

### Imports:
```tsx
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
```

### Component Pattern:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { ... } from 'lucide-react'

interface ComponentProps {
  // typed props
}

export function Component({ prop }: ComponentProps) {
  // hooks
  // handlers
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* content */}
      </CardContent>
    </Card>
  )
}
```

### Tailwind Classes:
- Background: `bg-background`, `bg-card`, `bg-muted`
- Text: `text-foreground`, `text-muted-foreground`
- Border: `border-border`
- Accent: `text-primary`, `bg-primary`

---

## 📊 ESTIMATED TIMELINE

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1 | Dashboard (MetricCards, UrgentItems, Tiles) | 4-6 hours |
| Phase 2 | Client Detail (Captures, Projects, Content, Questionnaire) | 3-4 hours |
| Phase 3 | Testing & Fixes | 2-3 hours |
| **Total** | | **9-13 hours** |

---

## ✅ COMPLETION CHECKLIST

- [x] Build passes (no TypeScript errors) - client-code-display fixed
- [ ] Soft delete still works
- [ ] Archive page still works
- [ ] Industry field still works
- [ ] MetricCards display and expand
- [ ] UrgentItems show with pulsing
- [ ] Quick Captures work per client
- [ ] Projects tab shows real data
- [ ] Content tab shows real data
- [ ] Questionnaire status prominent
- [ ] All existing features work
- [ ] Ready to deploy

---

## 📝 DETAILED COMPONENT PORTING GUIDE

### Example: Porting MetricCards

**Step 1 - Read production file:**
```bash
cat /Users/rocky/DRSS/production-backup/components/dashboard/metric-cards.tsx
```

**Step 2 - Identify dependencies:**
- Framer Motion animations → Convert to shadcn animations
- Custom color classes → Map to v0 theme colors
- Fetch calls → Keep as-is

**Step 3 - Create v0 version:**
- Replace Framer Motion with Tailwind transitions
- Use `Card` component instead of custom divs
- Keep data fetching logic identical
- Adapt color scheme to v0

**Step 4 - Integrate:**
- Import in dashboard page
- Add to page layout
- Test expand/collapse
- Verify data loads correctly

**Step 5 - Verify:**
- Build passes
- No TypeScript errors
- Styling matches v0 theme
- Functionality works

---

## 🔍 TROUBLESHOOTING GUIDE

### Build Errors After Porting

**Error: "Module not found"**
- Solution: Check import paths use @/ prefix
- Verify component file exists

**Error: "Type error in component"**
- Solution: Check interface matches v0 patterns
- Add proper TypeScript types

**Error: "Hydration mismatch"**
- Solution: Add 'use client' directive if using hooks
- Check server vs client component usage

### Soft Delete Not Working

**Symptom: Deleted items still appear**
- Check: Is `.is('deleted_at', null)` filter present?
- Check: Did migration run successfully?
- Check: Is query using correct table?

**Symptom: Can't restore from archive**
- Check: Does restoreClient function exist?
- Check: Is archive page using correct function?
- Check: Are related items being restored?

### Styling Issues

**Symptom: Colors don't match**
- Solution: Use v0 color classes (text-foreground, bg-card, etc.)
- Check: Are production color classes mapped correctly?

**Symptom: Layout broken**
- Solution: Check Card component structure
- Verify: Responsive classes present (md:, lg:)

---

## 🎯 SUCCESS CRITERIA

Before marking complete:

1. ✅ **Build Status:** No TypeScript errors, build completes successfully
2. ✅ **Soft Delete:** Archive system works end-to-end
3. ✅ **Dashboard:** All metrics display and expand correctly
4. ✅ **Client Detail:** Shows real project/content data, captures work
5. ✅ **Styling:** Matches v0 design system throughout
6. ✅ **Performance:** Page loads < 2 seconds
7. ✅ **Regression:** All existing features still work

---

## 📚 REFERENCE DOCUMENTS

- **Production vs Local Comparison:** `/Users/rocky/DRSS/PRODUCTION_VS_V0_COMPARISON_REPORT.md`
- **New Features in Local:** `/Users/rocky/DRSS/NEW_FEATURES_IN_LOCAL_REPORT.md`
- **Production Backup:** `/Users/rocky/DRSS/production-backup/`
- **Local Codebase:** `/Users/rocky/DRSS/savant-marketing-studio/`
- **Complete Audit:** `/Users/rocky/DRSS/savant-marketing-studio/_docs/COMPLETE_CODEBASE_AUDIT.md`

---

## 🚀 DEPLOYMENT CHECKLIST

Before pushing to production:

- [ ] All tests pass locally
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] All features tested manually
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Git commit with descriptive message
- [ ] Push to repository
- [ ] Monitor deployment logs
- [ ] Verify in production environment

---

**Implementation Plan Generated:** December 23, 2025  
**Status:** Ready to Execute  
**Next Action:** Start with Phase 1.1 (MetricCards Component)

