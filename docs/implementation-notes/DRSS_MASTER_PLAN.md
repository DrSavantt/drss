# DRSS MASTER PLAN
## Savant Marketing Studio - Complete Build Reference

**Version:** 1.0  
**Created:** December 24, 2025  
**Target Completion:** January 4, 2025  
**Status:** Active Development

---

## Executive Summary

### What DRSS Is
An AI-powered marketing operating system for Kingdom-minded business owners. A subscription-based service ($2,997-$7,997/month) that replaces traditional agency workflows with intelligent automation.

### The Vision
1. Client fills questionnaire via public link (no login)
2. Data auto-populates their profile
3. AI runs deep research on client's market/avatar
4. User selects client + content type + framework in AI Studio
5. AI generates on-brand content using ALL context (questionnaire + research + frameworks)
6. Content saves to client's library
7. Everything is organized, searchable, and connected

### Why This Exists
- Replaces 2.6 FTEs of marketing work
- Targets "Stewardship Anxiety" market (Kingdom-minded business owners)
- Solo operator managing 5-20 clients from one dashboard
- 24+ hours/week saved = $10K/month in time value

---

## Current State

### What's Built & Working ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Working | 6-digit PIN system |
| Client CRUD | ✅ Working | Create, edit, soft delete, archive, restore |
| Project Kanban | ✅ Working | Drag-drop, status updates, client filtering |
| Content Library | ✅ Working | Create, edit, delete, file uploads |
| Framework Library | ✅ Working | CRUD, categories, content storage |
| Journal System | ✅ Working | Captures with @mentions, #tags, client linking |
| AI Generation | ✅ Working | Claude API integration, saves to content |
| Theme System | ✅ Working | Dark mode, red/black/white palette |
| Soft Delete/Archive | ✅ Working | Restore functionality, permanent delete |
| File Uploads | ✅ Working | Supabase Storage, auto-tags to client |

### What Needs Work ⚠️

| Feature | Issue | Phase |
|---------|-------|-------|
| Analytics Page | Placeholder data, not wired to Supabase | Phase 1 |
| Questionnaire Flow | Public form uses deprecated components | Phase 2 |
| AI Studio Context | Doesn't pull full client context (intake + research) | Phase 3 |
| Deep Research | Not built yet | Phase 4 |
| Journal Inboxes | Single inbox, no client-specific organization | Phase 5 |
| Mobile Responsiveness | Desktop-first, needs mobile pass | Phase 6 |

### Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + custom components |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (PIN-based) |
| Storage | Supabase Storage |
| AI - Writing | Anthropic Claude 3.5 Sonnet |
| AI - Research | Google Gemini (to be added) |
| Animations | Framer Motion |
| Deployment | Vercel |

### Database Tables (11 total)

| Table | Purpose |
|-------|---------|
| clients | Client profiles, intake_responses, brand_data |
| projects | Kanban projects linked to clients |
| content_assets | All content (notes, files, AI-generated) |
| frameworks | Marketing frameworks and templates |
| framework_embeddings | RAG embeddings for framework search |
| journal_entries | Journal captures |
| journal_chats | Journal inbox/conversation groupings |
| ai_generations | AI generation audit trail |
| component_templates | Page builder templates (Phase 4+) |
| pages | Built pages (Phase 4+) |
| component_instances | Page component instances (Phase 4+) |

---

## Target State

### Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DRSS WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE CLIENT                                               │
│     └── Basic info (name, email, website)                       │
│         └── Copy questionnaire link                             │
│                                                                 │
│  2. CLIENT FILLS QUESTIONNAIRE (public, no login)               │
│     └── 32 questions across 8 sections                          │
│         └── Submits → saves to intake_responses                 │
│             └── Status changes to "Onboarded"                   │
│                                                                 │
│  3. DEEP RESEARCH (on demand)                                   │
│     └── Select research prompt from library                     │
│         └── Gemini executes research                            │
│             └── Results save to content library (tagged)        │
│                                                                 │
│  4. AI STUDIO GENERATION                                        │
│     └── Select client (pulls their context)                     │
│         └── Select framework (pulls methodology)                │
│             └── Select content type (determines format)         │
│                 └── Generate with Claude                        │
│                     └── Auto-save to client's content           │
│                                                                 │
│  5. JOURNAL CAPTURE                                             │
│     └── Quick capture ideas/notes                               │
│         └── Assign to client inbox                              │
│             └── @mention projects, content, clients             │
│                 └── Organize and find later                     │
│                                                                 │
│  6. REVIEW & DELIVER                                            │
│     └── All content in one place                                │
│         └── Export or share with client (via Trello for now)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

### Phase 1: Foundation & Analytics
**Time Estimate:** 4-6 hours  
**Dependencies:** None  
**Goal:** Real data flowing through dashboard

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 1.1 | Analytics API | Wire `/api/analytics` to real Supabase queries | Returns actual client/project/content counts |
| 1.2 | Dashboard Stats | Replace placeholder StatCards with live data | Numbers match database reality |
| 1.3 | Activity Feed | Wire activity log to real recent actions | Shows actual creates/updates/deletes |
| 1.4 | Quick Action Cards | Ensure all dashboard cards navigate correctly | Click → goes to right page |
| 1.5 | Dropdown Fixes | Audit all dropdowns for proper state management | No stuck states, proper close behavior |

#### Files to Touch
- `app/api/analytics/route.ts`
- `app/api/activity-log/route.ts`
- `app/dashboard/page.tsx`
- `components/dashboard/*`

---

### Phase 2: Questionnaire Flow
**Time Estimate:** 8-10 hours  
**Dependencies:** Phase 1 complete  
**Goal:** Client fills form → data populates profile → ready for AI

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 2.1 | Config API Update | `/lib/questionnaire/questions-config.ts` reads from database | Config reflects admin changes |
| 2.2 | Public Form Rewrite | Update `public-questionnaire-form.tsx` to use config-driven `section-renderer.tsx` | Form renders dynamically from config |
| 2.3 | Copy Link Button | Client detail page has "Copy Questionnaire Link" button | Copies public URL, shows toast |
| 2.4 | Public Route | `/questionnaire/[clientId]` serves the form without auth | Accessible without login |
| 2.5 | Form Submission | Submit saves to `clients.intake_responses` | Data persists, status updates to "completed" |
| 2.6 | Profile Population | Client detail shows questionnaire answers | Answers visible in organized sections |
| 2.7 | Status Badge | Client cards show "New" / "Onboarding" / "Onboarded" | Badge reflects questionnaire_status |
| 2.8 | Auto-Save Draft | Form saves progress to localStorage | Refresh preserves answers |
| 2.9 | Help System | Each question has help drawer with guidance | ? icon opens contextual help |

#### Files to Touch
- `lib/questionnaire/questions-config.ts`
- `components/questionnaire/public-questionnaire-form.tsx`
- `components/questionnaire/section-renderer.tsx`
- `app/questionnaire/[clientId]/page.tsx`
- `app/actions/questionnaire.ts`
- `components/clients/client-card.tsx`
- `app/dashboard/clients/[id]/page.tsx`

---

### Phase 3: AI Studio Enhancement
**Time Estimate:** 6-8 hours  
**Dependencies:** Phase 2 complete (questionnaire data available)  
**Goal:** AI generates with full client context

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 3.1 | Client Context Fetch | When client selected, fetch their intake_responses + brand_data | Context object populated |
| 3.2 | Research Context | Include any deep research content tagged to client | Research docs added to context |
| 3.3 | Framework Selection | Dropdown shows frameworks, selection adds to prompt | Framework content in generation |
| 3.4 | Content Type Templates | Different templates for email, ad, landing page, blog | Output format matches type |
| 3.5 | Prompt Builder | Combine: user request + client context + framework + research | Full prompt visible in debug mode |
| 3.6 | Generation History | Show recent generations in AI Studio sidebar | Can view/regenerate past generations |
| 3.7 | Auto-Save to Library | Generated content auto-saves to content library | Content appears tagged to client |
| 3.8 | Token Tracking | Display tokens used, estimated cost | Shows in generation history |

#### Files to Touch
- `components/ai-studio/ai-studio.tsx`
- `app/actions/ai.ts`
- `lib/ai/claude.ts`
- `lib/ai/prompt-builder.ts` (new)
- `app/api/ai/generate/route.ts`

---

### Phase 4: Deep Research System
**Time Estimate:** 8-10 hours  
**Dependencies:** Phase 3 complete, Gemini API setup  
**Goal:** On-demand research that feeds into AI generation

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 4.1 | Gemini API Setup | Add Google Gemini SDK, create `/lib/ai/gemini.ts` | API calls succeed |
| 4.2 | Research Prompts Library | Like frameworks, but for research prompts | CRUD for research prompts |
| 4.3 | Research UI | New section in AI Studio or separate page | Can select client + research prompt |
| 4.4 | Execute Research | Run Gemini with selected prompt + client context | Returns structured research |
| 4.5 | Save to Content | Research saves as content_asset type "research" | Tagged to client, appears in their profile |
| 4.6 | Research in Context | AI Studio pulls research when generating | Research content in generation prompt |
| 4.7 | Research History | View past research for a client | List with dates, topics |

#### Files to Create/Touch
- `lib/ai/gemini.ts` (new)
- `app/actions/research.ts` (new)
- `components/research/research-prompts.tsx` (new)
- `components/ai-studio/research-panel.tsx` (new)
- `app/api/research/route.ts` (new)

---

### Phase 5: Journal Redesign
**Time Estimate:** 8-10 hours  
**Dependencies:** None (can run parallel)  
**Goal:** Client-specific inboxes, organized captures

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 5.1 | Inbox CRUD | Create, rename, delete inboxes | Inboxes persist, proper confirmations |
| 5.2 | Client Assignment | Each inbox assigned to a client | Inbox shows client badge |
| 5.3 | Inbox Navigation | Sidebar shows all inboxes, click to filter | Only that inbox's captures shown |
| 5.4 | Capture in Inbox | New captures go to selected inbox | Capture appears in correct inbox |
| 5.5 | Move Captures | Bulk action: move captures between inboxes | Captures transfer, references update |
| 5.6 | Bulk Actions UI | Restore bulk actions (select, delete, move) | Checkbox select, action bar appears |
| 5.7 | Default Inbox | "General" inbox for unassigned captures | Always exists, can't delete |
| 5.8 | Inbox Stats | Show capture count per inbox | Numbers accurate |

#### Database Changes
- `journal_chats` table may need `client_id` column
- Or new `journal_inboxes` table

#### Files to Touch
- `components/journal/journal.tsx`
- `components/journal/inbox-sidebar.tsx` (new)
- `components/journal/inbox-card.tsx` (new)
- `app/actions/journal.ts`
- `app/api/journal/inboxes/route.ts` (new)

---

### Phase 6: Polish & Deploy
**Time Estimate:** 6-8 hours  
**Dependencies:** Phases 1-5 complete  
**Goal:** Production-ready, mobile-friendly, no errors

#### Features

| ID | Feature | Description | Test Criteria |
|----|---------|-------------|---------------|
| 6.1 | Mobile Audit | Test all pages on mobile viewport | No horizontal scroll, usable touch |
| 6.2 | Mobile Fixes | Responsive adjustments where needed | Passes audit |
| 6.3 | Error Boundaries | Add error boundaries to catch crashes | Graceful error messages |
| 6.4 | Loading States | Audit all pages for loading skeletons | No blank screens |
| 6.5 | Empty States | Audit all lists for empty state UI | Helpful messages, CTAs |
| 6.6 | TypeScript Audit | Run `npm run build`, fix all errors | Zero type errors |
| 6.7 | Console Cleanup | Remove console.logs, fix warnings | Clean console |
| 6.8 | Performance Pass | Check for slow queries, optimize | Pages load < 2s |
| 6.9 | Final Test | End-to-end test of complete flow | All features work |
| 6.10 | Custom Domain | Configure custom domain on Vercel | Site live on domain |

---

## Technical Decisions

### Confirmed Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Writing | Claude 3.5 Sonnet | Already integrated, high quality |
| AI Research | Google Gemini | Better for web research, different use case |
| Client Portal | Trello (external) | Not building now, use existing tool |
| Notifications | Placeholder | "Coming soon" - future feature |
| Real-time | Not building | Solo user, not needed |
| Mobile | PWA later | Desktop-first, PWA after v1 |
| File Storage | Supabase Storage | Already working |
| Auth | PIN-based | Simple, solo user |

### API Keys Needed

| Service | Status | Environment Variable |
|---------|--------|---------------------|
| Anthropic Claude | ✅ Active | `ANTHROPIC_API_KEY` |
| Google Gemini | ⚠️ Need to add | `GEMINI_API_KEY` |
| Supabase | ✅ Active | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

---

## Excluded Features (Not Building Now)

| Feature | Reason | Future? |
|---------|--------|---------|
| Client login portal | Using Trello instead | Maybe v2 |
| Multi-user/teams | Solo operator tool | No |
| Real-time collaboration | Not needed | No |
| Mobile app | PWA later | Yes |
| Full notification system | Placeholder for now | Yes |
| Page builder (Phase 4 of old plan) | Out of scope for v1 | Maybe v2 |
| Inline AI editing (Cursor-style) | Nice to have, not MVP | Yes |

---

## Success Criteria

### Definition of Done

- [ ] All 6 phases complete
- [ ] Zero TypeScript errors on build
- [ ] All features manually tested
- [ ] Complete user flow works end-to-end:
  - Create client → Copy link → Fill questionnaire → Run research → Generate content → View in library
- [ ] Mobile-responsive (usable, not perfect)
- [ ] Deployed to Vercel
- [ ] Ready to demo to potential clients

### Quality Standards

| Standard | Requirement |
|----------|-------------|
| Code Organization | Files named properly, logical locations |
| TypeScript | Strict mode, no `any` types |
| UI Consistency | Follows UI_DESIGN_SYSTEM.md |
| Error Handling | Graceful failures, user-friendly messages |
| Loading States | Skeletons on all data-fetching pages |
| Empty States | Helpful messages on all lists |

---

## File Structure Reference

```
savant-marketing-studio/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── analytics/
│   │   ├── clients/
│   │   │   ├── page.tsx                # Client list
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Client detail
│   │   ├── content/
│   │   │   ├── page.tsx                # Content library
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Content detail
│   │   ├── projects/
│   │   │   └── board/
│   │   │       └── page.tsx            # Kanban board
│   │   ├── frameworks/
│   │   │   └── page.tsx                # Framework library
│   │   ├── ai/
│   │   │   └── generate/
│   │   │       └── page.tsx            # AI Studio
│   │   ├── journal/
│   │   │   └── page.tsx                # Journal (redesigned)
│   │   ├── archive/
│   │   │   └── page.tsx                # Archived items
│   │   └── settings/
│   │       └── page.tsx                # Settings
│   ├── questionnaire/
│   │   └── [clientId]/
│   │       └── page.tsx                # Public questionnaire
│   ├── actions/
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── content.ts
│   │   ├── frameworks.ts
│   │   ├── journal.ts
│   │   ├── questionnaire.ts
│   │   ├── ai.ts
│   │   └── research.ts                 # New
│   └── api/
│       ├── clients/
│       ├── projects/
│       ├── content/
│       ├── frameworks/
│       ├── journal/
│       ├── analytics/
│       ├── activity-log/
│       ├── ai/
│       └── research/                   # New
├── components/
│   ├── ui/                             # shadcn components
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   └── top-nav.tsx
│   ├── clients/
│   ├── projects/
│   ├── content/
│   ├── frameworks/
│   ├── ai-studio/
│   ├── journal/
│   ├── questionnaire/
│   ├── research/                       # New
│   └── settings/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── ai/
│   │   ├── claude.ts
│   │   ├── gemini.ts                   # New
│   │   ├── prompt-builder.ts           # New
│   │   └── rag.ts
│   ├── questionnaire/
│   │   └── questions-config.ts
│   └── utils.ts
├── types/
│   └── database.ts
└── public/
```

---

## Timeline

### 10-Day Sprint (Dec 24 - Jan 4)

| Day | Date | Focus | Phases |
|-----|------|-------|--------|
| 1 | Dec 24 | Foundation fixes | 1.1-1.3 |
| 2 | Dec 25 | Foundation complete + Questionnaire start | 1.4-1.5, 2.1-2.2 |
| 3 | Dec 26 | Questionnaire flow | 2.3-2.6 |
| 4 | Dec 27 | Questionnaire complete | 2.7-2.9 |
| 5 | Dec 28 | AI Studio enhancement | 3.1-3.4 |
| 6 | Dec 29 | AI Studio complete | 3.5-3.8 |
| 7 | Dec 30 | Deep Research system | 4.1-4.4 |
| 8 | Dec 31 | Deep Research complete + Journal start | 4.5-4.7, 5.1-5.2 |
| 9 | Jan 1 | Journal redesign | 5.3-5.8 |
| 10 | Jan 2-3 | Polish & Deploy | 6.1-6.10 |
| 11 | Jan 4 | Buffer / Final testing | Verification |

### Daily Rhythm

1. **Morning:** Review what's next in the plan
2. **Build:** Ask Claude for Cursor prompts, execute in Cursor
3. **Test:** Verify each feature before moving on
4. **Commit:** Clean commits after each working feature
5. **Evening:** Mark progress, note any blockers

---

## How to Use This Plan

### Starting a Session

1. Open this document
2. Find your current phase/feature
3. Say to Claude: **"Generate prompt for [Feature ID]"**
4. Copy prompt into Cursor
5. Test the result
6. Say: **"Next"** to continue

### If You Get Stuck

1. Tell Claude the error
2. Claude generates debug prompt for Cursor
3. Fix and continue

### Tracking Progress

Mark features complete in this document:
- Change `| 1.1 |` to `| ✅ 1.1 |` when done

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `UI_DESIGN_SYSTEM.md` | Visual patterns, colors, components |
| `CURSOR_UI_INSTRUCTIONS.md` | How Cursor should build UI |
| `FEATURE_CHECKLIST.md` | Legacy reference (some overlap) |
| `FINAL_BLUEPRINT.md` | Database schema, architecture |

---

## Notes

### Soft Delete Behavior
- Deleting a client should offer: "Delete client only" vs "Delete client and all content"
- Content can be preserved and reassigned
- Test this in archive flow

### Journal Bulk Actions
- Previously existed, may need restoration
- Check old production code if needed
- Key actions: select multiple, delete, move to inbox

### Gemini API Setup
- Get API key from Google AI Studio
- Add to `.env.local` as `GEMINI_API_KEY`
- Create `/lib/ai/gemini.ts` similar to `claude.ts`

---

**This is your single source of truth. Everything else is reference material.**

**Let's build. 🚀**
