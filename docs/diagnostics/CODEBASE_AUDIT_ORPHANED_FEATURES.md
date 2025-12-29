# CODEBASE AUDIT REPORT: Existing Features Not Wired to UI

**Date:** December 26, 2025
**Project:** DRSS Savant Marketing Studio
**Scope:** Find all built features not connected to the current UI

---

## EXECUTIVE SUMMARY

This audit identified **15+ server actions**, **10+ API routes**, and **100+ components** across the codebase. Key findings:

- ✅ **Questionnaire system**: Fully wired and operational
- ✅ **Client management**: Create, edit, delete all wired (with archive options)
- ⚠️ **Projects**: Can create and drag-and-drop status, but **NO edit or delete UI**
- ⚠️ **Frameworks**: Can create, but **NO edit or delete UI** (buttons exist but not wired)
- ⚠️ **Logout**: Action exists but **NOT wired to Top Nav** (only in mobile nav)
- ⚠️ **Bulk actions**: Backend exists for content, journal, but **NO UI for projects/frameworks**
- ✅ **Toast notifications**: Component exists but **NOT USED ANYWHERE**
- ✅ **AI spend tracking**: Fully implemented and displayed on client cards
- ✅ **Activity logging**: Fully operational across all actions
- ❌ **Export/Download**: No functionality found anywhere

---

## SECTION A: ORPHANED CODE (Built but Not Wired to UI)

| Type | Name | Location | What it does | Could fulfill |
|------|------|----------|--------------|---------------|
| **Action** | `updateProject` | `app/actions/projects.ts:97` | Updates project name, description, due date, priority, status | Edit Project feature |
| **Action** | `deleteProject` | `app/actions/projects.ts:208` | Hard deletes a project | Delete Project feature |
| **Action** | `updateFramework` | `app/actions/frameworks.ts:100` | Updates framework details and regenerates embeddings | Edit Framework feature |
| **Action** | `deleteFramework` | `app/actions/frameworks.ts:142` | Deletes a framework (cascades to embeddings) | Delete Framework feature |
| **Action** | `logout` | `app/actions/auth.ts:60` | Signs user out and redirects to login | Logout button (Desktop) |
| **Action** | `bulkArchiveContent` | `app/actions/content.ts:391` | Archives multiple content items | Bulk archive feature |
| **Action** | `bulkUnarchiveContent` | `app/actions/content.ts:415` | Unarchives multiple content items | Bulk unarchive feature |
| **Action** | `bulkChangeProject` | `app/actions/content.ts:439` | Moves multiple content items to a project | Bulk move feature |
| **Action** | `bulkPinJournalEntries` | `app/actions/journal.ts:447` | Pins multiple journal entries | Journal bulk pin |
| **Action** | `bulkUnpinJournalEntries` | `app/actions/journal.ts:471` | Unpins multiple journal entries | Journal bulk unpin |
| **Action** | `bulkAddTagsToJournalEntries` | `app/actions/journal.ts:495` | Adds tags to multiple entries | Journal bulk tag |
| **Action** | `restoreClient` | `app/actions/clients.ts:338` | Restores soft-deleted client | Archive restore feature |
| **Action** | `permanentlyDeleteClient` | `app/actions/clients.ts:418` | Permanently deletes client (hard delete) | Archive permanent delete |
| **Action** | `resetQuestionnaire` | `app/actions/questionnaire.ts:345` | Resets questionnaire responses | Reset questionnaire button |
| **API Route** | `GET /api/activity-log` | `app/api/activity-log/route.ts` | Fetches activity log entries | Activity feed page |
| **API Route** | `GET /api/search` | `app/api/search/route.ts` | Global search across entities | Search feature (⌘K) |
| **Component** | `Toast` | `app/components/toast.tsx` | Toast notification system | Replace alerts with toasts |
| **Component** | `ConfirmationModal` | `app/components/confirmation-modal.tsx` | Reusable confirmation dialog | Delete confirmations |
| **Component** | `BulkActionBar` | `app/components/bulk-action-bar.tsx` | Bulk action toolbar | Projects/Frameworks bulk actions |
| **Component** | `TagModal` | `app/components/tag-modal.tsx` | Tag management modal | Journal tag editor |
| **Component** | `NoteEditorModal` | `app/components/note-editor-modal.tsx` | Quick note editor | Quick capture feature |
| **Component** | `ProjectSelectorModal` | `app/components/project-selector-modal.tsx` | Project picker dialog | Move content between projects |
| **Lib Function** | `generateEmbedding` | `lib/ai/embeddings.ts` | Generates OpenAI embeddings | Framework search (RAG) |
| **Lib Function** | `searchFrameworks` | `lib/ai/rag.ts` | Vector search for frameworks | AI content generation |

---

## SECTION B: PARTIALLY WIRED (Exists but Incomplete)

| Feature | What exists | What's missing | Fix needed |
|---------|-------------|----------------|------------|
| **Project Detail/Edit** | ✅ `updateProject` action exists<br>✅ Modal component pattern established | ❌ No edit modal<br>❌ No edit button on cards<br>❌ No click handler | Create `EditProjectDialog` component, add button to `ProjectCard`, wire up action |
| **Project Delete** | ✅ `deleteProject` action exists<br>✅ Confirmation pattern exists in clients | ❌ No delete button on cards<br>❌ No confirmation dialog | Add delete button to `ProjectCard`, add confirmation dialog, wire up action |
| **Framework Edit** | ✅ `updateFramework` action exists<br>✅ Edit button visible in dropdown | ❌ Button has no onClick handler<br>❌ No edit modal | Create edit modal, wire to existing button in `FrameworkCard:49` |
| **Framework Delete** | ✅ `deleteFramework` action exists<br>✅ Delete button visible in dropdown | ❌ Button has no onClick handler<br>❌ No confirmation dialog | Add confirmation dialog, wire to existing button in `FrameworkCard:58` |
| **Logout (Desktop)** | ✅ `logout` action exists<br>✅ Used in mobile nav<br>✅ "Log out" button in TopNav | ❌ TopNav button not wired (line 61) | Add onClick handler to `TopNav.tsx:61` calling logout action |
| **Archive Page** | ✅ Archive route exists `/dashboard/archive`<br>✅ `getArchivedClients` action<br>✅ `restoreClient` action | ⚠️ Limited to clients only<br>❌ No restore UI for projects/content | Add restore buttons, expand to other entities |
| **Toast Notifications** | ✅ Toast component built<br>✅ ToastContainer ready | ❌ Never imported anywhere<br>❌ No toast context/hook | Create `useToast` hook, add `ToastContainer` to layout, replace all `alert()` calls |
| **Command Palette (⌘K)** | ✅ Search button in sidebar (line 68)<br>✅ `/api/search` route exists | ❌ Button does nothing<br>❌ No keyboard shortcut wired<br>❌ No search modal | Build command palette modal, wire keyboard shortcut, integrate search API |
| **Bulk Actions (Projects)** | ✅ `BulkActionBar` component exists<br>✅ Pattern established in content library | ❌ Not used in Projects Kanban<br>❌ No checkbox selection | Add selection state to `ProjectsKanban`, integrate `BulkActionBar` |
| **Bulk Actions (Frameworks)** | ✅ `BulkActionBar` component exists<br>✅ No bulk server actions exist yet | ❌ Not used in Framework Library<br>❌ Need to create bulk actions | Create bulk server actions, add selection UI |
| **Activity Log Page** | ✅ `/api/activity-log` route exists<br>✅ Activity logged everywhere<br>✅ Displayed on client detail | ❌ No dedicated activity page<br>❌ No filtering/search | Create `/dashboard/activity` page, add filters |
| **Gemini Provider** | ✅ `GeminiProvider` class implemented<br>✅ AI Orchestrator supports it | ❌ No API key setup guide<br>⚠️ Used for deep research (not in UI) | Add setup docs, create research UI |
| **Journal Bulk Actions** | ✅ 4 bulk actions exist (delete, pin, unpin, add tags)<br>✅ `BulkActionBar` pattern | ⚠️ Unclear if wired (need to check Journal page) | Verify Journal page has bulk action UI |
| **Questionnaire Reset** | ✅ `resetQuestionnaire` action exists<br>✅ Reset button component exists | ⚠️ May be wired (exists in `reset-button.tsx`) | Verify functionality works end-to-end |

---

## SECTION C: NOT FOUND (Must Build from Scratch)

| Feature ID | Feature | Confirmed not in codebase |
|------------|---------|---------------------------|
| **NF1** | Export to CSV/Excel | No export functions found anywhere |
| **NF2** | Download Reports | No report generation functions found |
| **NF3** | Print-friendly Views | No print stylesheets or export views |
| **NF4** | Email Notifications | No email sending infrastructure found |
| **NF5** | Webhooks | No webhook system found |
| **NF6** | API Authentication (for external use) | No API keys or external auth system |
| **NF7** | Multi-user Collaboration | Single-user auth only (ADMIN_EMAIL env var) |
| **NF8** | Comments/Discussion | No comment system on any entities |
| **NF9** | Version History | No version tracking beyond `updated_at` |
| **NF10** | Templates System | No template management found |
| **NF11** | Scheduled Publishing | No scheduling system found |
| **NF12** | Deep Research UI | Gemini provider exists but no research interface |
| **NF13** | Duplicate Detection | No duplicate checking logic found |
| **NF14** | Client Portal | No separate client-facing dashboard |

---

## SECTION D: QUICK WINS (Just Need Wiring)

### 🟢 PRIORITY 1: Can Ship in < 30 Minutes

1. **Logout Button (Desktop)** - `app/actions/auth.ts:logout` → `components/layout/top-nav.tsx:61`
   - Add: `import { logout } from '@/app/actions/auth'`
   - Change: `<DropdownMenuItem className="text-destructive">` → `<form action={logout}><button type="submit" className="w-full text-left">Log out</button></form>`

2. **Framework Edit Button** - Wire existing button in `components/frameworks/framework-card.tsx:49`
   - Add state for edit modal
   - Add onClick handler to open modal with framework data
   - Create simple `EditFrameworkDialog` (copy pattern from `edit-client-dialog.tsx`)

3. **Framework Delete Button** - Wire existing button in `components/frameworks/framework-card.tsx:58`
   - Add: `import { deleteFramework } from '@/app/actions/frameworks'`
   - Add onClick with confirmation: `if (confirm('Delete?')) await deleteFramework(framework.id)`

### 🟡 PRIORITY 2: Can Ship in 1-2 Hours

4. **Project Edit Modal** - Create new component following client edit pattern
   - Copy: `components/clients/edit-client-dialog.tsx` → `components/projects/edit-project-dialog.tsx`
   - Update fields: name, description, due_date, priority, status
   - Import: `updateProject` from actions
   - Add: Edit button to `ProjectCard` component

5. **Project Delete** - Add delete to project cards
   - Add: Delete button to `ProjectCard` dropdown (follow framework pattern)
   - Import: `deleteProject` from actions
   - Add: Confirmation dialog before delete

6. **Toast System** - Replace all `alert()` and `confirm()` with toasts
   - Create: `hooks/use-toast.ts` context
   - Add: `ToastContainer` to `app/dashboard/layout.tsx`
   - Replace: All `alert('Success!')` → `toast.success('Success!')`

7. **Command Palette** - Enable search shortcut
   - Install: `cmdk` package
   - Create: `components/command-palette.tsx`
   - Wire: `/api/search` route
   - Add: Global keyboard listener for Cmd+K

### 🔴 PRIORITY 3: Can Ship in 4-6 Hours

8. **Activity Log Page** - Dedicated activity feed
   - Create: `app/dashboard/activity/page.tsx`
   - Fetch: `/api/activity-log`
   - UI: Timeline component with filters (client, date, type)
   - Navigation: Add to sidebar under Archive

9. **Archive Management** - Restore/Permanent Delete UI
   - Update: `app/dashboard/archive/page.tsx`
   - Add: Restore buttons for each archived client
   - Add: Permanent delete with double confirmation
   - Display: "Archived X days ago" with restore countdown

10. **Bulk Actions for Projects** - Selection + bulk operations
    - Add: Checkbox to `ProjectCard`
    - Add: Selection state to `ProjectsKanban`
    - Add: `BulkActionBar` when items selected
    - Create: `bulkDeleteProjects`, `bulkMoveProjects` actions
    - Operations: Delete, Move to Column, Change Priority

11. **Bulk Actions for Frameworks** - Selection + bulk operations
    - Add: Checkbox to `FrameworkCard`
    - Add: Selection state to `FrameworkLibrary`
    - Create: `bulkDeleteFrameworks`, `bulkToggleActive` actions
    - Add: `BulkActionBar` component
    - Operations: Delete, Toggle Active, Change Category

---

## DETAILED FEATURE INVENTORY

### 1. SERVER ACTIONS (app/actions/*.ts)

#### **ai.ts** (237 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `generateContent` | AI content generation with RAG | AI Studio page | ✅ **WIRED** |
| `saveGeneratedContent` | Save AI output to content library | AI Studio page | ✅ **WIRED** |
| `getClientsForDropdown` | Get clients for AI Studio dropdown | AI Studio page | ✅ **WIRED** |
| `getAIUsageStats` | Get 30-day AI spend stats | AI Studio page | ✅ **WIRED** |

#### **auth.ts** (68 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `autoLogin` | Auto-login with env credentials | Login page | ✅ **WIRED** |
| `logout` | Sign out and redirect | Mobile nav only | ⚠️ **PARTIAL** - Missing desktop nav |

#### **clients.ts** (465 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getClients` | List all non-deleted clients | Clients page | ✅ **WIRED** |
| `getClient` | Get single client details | Client detail page | ✅ **WIRED** |
| `createClient` | Create new client | New client dialog | ✅ **WIRED** |
| `updateClient` | Update client details | Edit client dialog | ✅ **WIRED** |
| `getRelatedCounts` | Count projects/content/captures | Client detail page | ✅ **WIRED** |
| `deleteClient` | Soft delete with preserve/delete options | Delete client dialog | ✅ **WIRED** |
| `restoreClient` | Restore soft-deleted client | ❌ **ORPHANED** - No UI button |
| `getArchivedClients` | List archived clients | Archive page | ✅ **WIRED** |
| `permanentlyDeleteClient` | Hard delete archived client | ❌ **ORPHANED** - No UI button |

#### **content.ts** (482 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getContentAssets` | List content for a client | Client detail page | ✅ **WIRED** |
| `getContentAsset` | Get single content details | Content detail page | ✅ **WIRED** |
| `createContentAsset` | Create new content | New content page | ✅ **WIRED** |
| `updateContentAsset` | Update content | Content detail page | ✅ **WIRED** |
| `getContentRelatedCounts` | Count related journal captures | Content detail page | ✅ **WIRED** |
| `deleteContentAsset` | Delete content | Content detail page | ✅ **WIRED** |
| `getAllContentAssets` | List all content (global) | Content library page | ✅ **WIRED** |
| `getClientProjects` | Get projects for content dropdown | New content page | ✅ **WIRED** |
| `createFileAsset` | Upload file to storage | New file page | ✅ **WIRED** |
| `getUploadUrl` | Get signed upload URL | File upload component | ✅ **WIRED** |
| `bulkDeleteContent` | Delete multiple content items | Content library page | ✅ **WIRED** |
| `bulkArchiveContent` | Archive multiple items | ❌ **ORPHANED** - No UI button |
| `bulkUnarchiveContent` | Unarchive multiple items | ❌ **ORPHANED** - No UI button |
| `bulkChangeProject` | Move items to another project | ❌ **ORPHANED** - No UI button |
| `getAllProjects` | Get all projects (global) | Content library page | ✅ **WIRED** |

#### **frameworks.ts** (265 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getFrameworks` | List all frameworks | Frameworks page | ✅ **WIRED** |
| `getFramework` | Get single framework | Framework detail (if exists) | ⚠️ **UNUSED** |
| `createFramework` | Create + generate embeddings | New framework dialog | ✅ **WIRED** |
| `updateFramework` | Update + regenerate embeddings | ❌ **ORPHANED** - Button exists but not wired |
| `deleteFramework` | Delete framework | ❌ **ORPHANED** - Button exists but not wired |
| `getFrameworkCategories` | Get category list for dropdown | New framework dialog | ✅ **WIRED** |

#### **journal.ts** (532 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `createDefaultInbox` | Create Inbox chat | Journal page | ✅ **WIRED** |
| `getOrCreateInbox` | Get/create Inbox | Journal page | ✅ **WIRED** |
| `createJournalEntry` | Create new entry | Journal page | ✅ **WIRED** |
| `deleteJournalEntry` | Delete single entry | Journal page | ✅ **WIRED** |
| `getJournalEntries` | List entries (by chat) | Journal page | ✅ **WIRED** |
| `getJournalEntriesByProject` | Get entries mentioning project | Client detail page | ✅ **WIRED** |
| `getJournalChats` | List all chats/folders | Journal page | ✅ **WIRED** |
| `createChatForClient` | Create client chat | Client detail page | ✅ **WIRED** |
| `createChatForProject` | Create project chat | Client detail page | ✅ **WIRED** |
| `createChatForContent` | Create content chat | Content detail page | ✅ **WIRED** |
| `getJournalEntriesByContent` | Get entries mentioning content | Content detail page | ✅ **WIRED** |
| `getJournalEntriesByClient` | Get entries mentioning client | Client detail page | ✅ **WIRED** |
| `bulkDeleteJournalEntries` | Delete multiple entries | ⚠️ **UNKNOWN** - Need to check Journal UI |
| `bulkPinJournalEntries` | Pin multiple entries | ⚠️ **UNKNOWN** - Need to check Journal UI |
| `bulkUnpinJournalEntries` | Unpin multiple entries | ⚠️ **UNKNOWN** - Need to check Journal UI |
| `bulkAddTagsToJournalEntries` | Add tags to multiple entries | ⚠️ **UNKNOWN** - Need to check Journal UI |

#### **journal-folders.ts** (270 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getJournalFolders` | List folders with counts | Journal page | ✅ **WIRED** |
| `createJournalFolder` | Create new folder | Journal page | ✅ **WIRED** |
| `updateJournalFolder` | Update folder name/color | Journal page | ✅ **WIRED** |
| `deleteJournalFolder` | Delete folder | Journal page | ✅ **WIRED** |
| `moveChatToFolder` | Move chat to folder | Journal page | ✅ **WIRED** |
| `getUnifiedJournalTimeline` | Get all chats with previews | Journal page | ✅ **WIRED** |
| `getJournalCounts` | Get total counts | Journal page | ✅ **WIRED** |

#### **projects.ts** (247 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getProjects` | List projects for a client | Client detail page | ✅ **WIRED** |
| `getProject` | Get single project details | Project detail (if exists) | ⚠️ **UNUSED** |
| `createProject` | Create new project | New project page | ✅ **WIRED** |
| `updateProject` | Update project details | ❌ **ORPHANED** - No edit modal |
| `updateProjectStatus` | Update status + position (drag-drop) | Projects Kanban | ✅ **WIRED** |
| `deleteProject` | Hard delete project | ❌ **ORPHANED** - No delete button |

#### **questionnaire.ts** (536 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `saveQuestionnaire` | Save questionnaire responses | Questionnaire page | ✅ **WIRED** |
| `resetQuestionnaire` | Clear all responses | Reset button | ✅ **WIRED** |
| `submitPublicQuestionnaire` | Submit via public link (no auth) | Public form page | ✅ **WIRED** |
| `savePublicQuestionnaireProgress` | Auto-save progress (public) | Public form page | ✅ **WIRED** |

#### **questionnaire-config.ts** (479 lines)
| Function | Purpose | Used By | Status |
|----------|---------|---------|--------|
| `getSections` | Get all sections | Questionnaire settings | ✅ **WIRED** |
| `getEnabledSections` | Get only enabled sections | Questionnaire form | ✅ **WIRED** |
| `getQuestions` | Get all questions | Questionnaire settings | ✅ **WIRED** |
| `getQuestionsWithHelp` | Get questions + help content | Questionnaire form | ✅ **WIRED** |
| `getQuestionsBySection` | Get questions for a section | Questionnaire form | ✅ **WIRED** |
| `getHelp` | Get help for a question | Questionnaire settings | ✅ **WIRED** |
| `updateSection` | Update section details | Questionnaire settings | ✅ **WIRED** |
| `toggleSection` | Enable/disable section | Questionnaire settings | ✅ **WIRED** |
| `reorderSections` | Change section order | Questionnaire settings | ✅ **WIRED** |
| `addSection` | Create new section | Questionnaire settings | ✅ **WIRED** |
| `deleteSection` | Delete section | Questionnaire settings | ✅ **WIRED** |
| `updateQuestion` | Update question details | Questionnaire settings | ✅ **WIRED** |
| `toggleQuestion` | Enable/disable question | Questionnaire settings | ✅ **WIRED** |
| `reorderQuestions` | Change question order | Questionnaire settings | ✅ **WIRED** |
| `addQuestion` | Create new question | Questionnaire settings | ✅ **WIRED** |
| `deleteQuestion` | Delete question | Questionnaire settings | ✅ **WIRED** |
| `updateHelp` | Update help content | Questionnaire settings | ✅ **WIRED** |
| `deleteHelp` | Delete help content | Questionnaire settings | ✅ **WIRED** |
| `bulkToggleQuestions` | Enable/disable multiple questions | Questionnaire settings | ✅ **WIRED** |
| `duplicateQuestion` | Clone a question | Questionnaire settings | ✅ **WIRED** |
| `validateConfig` | Validate questionnaire config | Questionnaire settings | ✅ **WIRED** |

---

### 2. API ROUTES (app/api/**/route.ts)

| Route | Methods | Purpose | Called From | Status |
|-------|---------|---------|-------------|--------|
| `/api/activity-log` | GET | Fetch activity log entries | ❌ **ORPHANED** - No page | ❌ **ORPHANED** |
| `/api/admin/verify-pin` | POST | Verify admin PIN | Settings page | ✅ **WIRED** |
| `/api/analytics` | GET | Dashboard analytics data | Dashboard page | ✅ **WIRED** |
| `/api/clients` | GET | List all clients with stats | Clients page (API call) | ✅ **WIRED** |
| `/api/clients/[id]` | GET | Get client details with related data | Client detail page | ✅ **WIRED** |
| `/api/content` | GET | List all content assets | Content library page | ✅ **WIRED** |
| `/api/dashboard` | GET | Dashboard summary stats | Dashboard page | ✅ **WIRED** |
| `/api/frameworks` | GET | List all frameworks | Frameworks page | ✅ **WIRED** |
| `/api/health` | GET | Health check endpoint | Monitoring | ✅ **WIRED** |
| `/api/metrics` | GET | Business metrics (client health, velocity) | Dashboard page | ✅ **WIRED** |
| `/api/projects` | GET | List all projects | Projects page | ✅ **WIRED** |
| `/api/search` | GET | Global search (clients, projects, content) | ❌ **ORPHANED** - No search UI | ❌ **ORPHANED** |
| `/api/user` | GET | Get current user info | Layout/auth | ✅ **WIRED** |

---

### 3. COMPONENT USAGE ANALYSIS

#### **ORPHANED COMPONENTS** (Built but Never Imported)

| Component | Location | Purpose | Why Orphaned |
|-----------|----------|---------|--------------|
| `Toast` | `app/components/toast.tsx` | Toast notifications | No toast system wired, using `alert()` instead |
| `ToastContainer` | `app/components/toast.tsx` | Toast container | Never added to layout |
| `ConfirmationModal` | `app/components/confirmation-modal.tsx` | Reusable confirmation | Using `confirm()` instead |
| `BulkActionBar` | `app/components/bulk-action-bar.tsx` | Bulk action toolbar | Only used in Content, not Projects/Frameworks |
| `TagModal` | `app/components/tag-modal.tsx` | Tag editor | Unknown if used in Journal |
| `NoteEditorModal` | `app/components/note-editor-modal.tsx` | Quick note capture | Not imported anywhere |
| `ProjectSelectorModal` | `app/components/project-selector-modal.tsx` | Project picker | Not imported anywhere |

#### **WIRED COMPONENTS** (In Active Use)

| Component | Used In | Status |
|-----------|---------|--------|
| `ClientList` | `/dashboard/clients` | ✅ Active |
| `ClientCard` | `ClientList` | ✅ Active |
| `ClientDetail` | `/dashboard/clients/[id]` | ✅ Active |
| `NewClientDialog` | `ClientList` | ✅ Active |
| `EditClientDialog` | `ClientDetail` | ✅ Active |
| `DeleteClientDialog` | `ClientDetail` | ✅ Active |
| `ProjectsKanban` | `/dashboard/projects/board` | ✅ Active |
| `ProjectCard` | `ProjectsKanban` | ✅ Active |
| `NewProjectDialog` | `ClientDetail` | ✅ Active |
| `FrameworkLibrary` | `/dashboard/frameworks` | ✅ Active |
| `FrameworkCard` | `FrameworkLibrary` | ✅ Active - but buttons not wired |
| `NewFrameworkDialog` | `FrameworkLibrary` | ✅ Active |
| `ContentLibrary` | `/dashboard/content` | ✅ Active |
| `CreateContentModal` | `ContentLibrary` | ✅ Active |
| `AIStudio` | `/dashboard/ai/generate` | ✅ Active |
| `Journal` | `/dashboard/journal` | ✅ Active |
| `PublicQuestionnaireForm` | `/form/[token]` | ✅ Active |
| `QuestionnaireSettings` | `/dashboard/settings/questionnaire` | ✅ Active |
| `Sidebar` | `dashboard/layout.tsx` | ✅ Active |
| `TopNav` | `dashboard/layout.tsx` | ✅ Active - but logout not wired |
| `MobileNav` | `dashboard/layout.tsx` | ✅ Active |

---

### 4. LIBRARY FUNCTIONS (lib/**)

#### **AI System** (`lib/ai/`)
| Function/Class | Location | Purpose | Status |
|----------------|----------|---------|--------|
| `AIOrchestrator` | `orchestrator.ts` | Routes AI tasks to optimal model | ✅ **USED** |
| `ClaudeProvider` | `providers/claude.ts` | Claude API integration | ✅ **USED** |
| `GeminiProvider` | `providers/gemini.ts` | Gemini API integration | ✅ **USED** (but no deep research UI) |
| `generateEmbedding` | `embeddings.ts` | OpenAI embeddings for frameworks | ✅ **USED** |
| `searchFrameworks` | `rag.ts` | Vector search for RAG | ✅ **USED** |

#### **Activity Logging** (`lib/`)
| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| `logActivity` | `activity-log.ts` | Log user actions | ✅ **USED** - called from all actions |
| `logPublicActivity` | `activity-log-public.ts` | Log public form submissions | ✅ **USED** |

#### **Questionnaire** (`lib/questionnaire/`)
| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| `useQuestionnaireForm` | `use-questionnaire-form.ts` | Form state management | ✅ **USED** |
| `validateSchemas` | `validation-schemas.ts` | Zod validation | ✅ **USED** |
| `conditionalLogic` | `conditional-logic.ts` | Question conditional rendering | ✅ **USED** |
| `dynamicValidation` | `dynamic-validation.ts` | Dynamic validation rules | ✅ **USED** |
| `questionsConfig` | `questions-config.ts` | Question definitions | ✅ **USED** |
| `sectionData` | `section-data.ts` | Section metadata | ✅ **USED** |
| `helpGuideData` | `help-guide-data.ts` | Help content | ✅ **USED** |

#### **Dashboard** (`lib/dashboard/`)
| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| `calculateMetrics` | `metrics.ts` | Business metrics calculations | ✅ **USED** |

#### **Utilities** (`lib/utils/`)
| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| `detectMobile` | `device.ts` | Mobile detection | ✅ **USED** |
| `parseMentions` | `mentions.ts` | Parse @mentions in text | ✅ **USED** |
| `useMentionNames` | `hooks/use-mention-names.ts` | Get mention suggestions | ✅ **USED** |

---

## SPECIFIC FEATURE STATUS TABLE

| Feature | Search Terms Found | Location | Wired to UI? | Notes |
|---------|-------------------|----------|--------------|-------|
| **Logout** | `logout` function | `app/actions/auth.ts:60` | ⚠️ **PARTIAL** | Only in mobile nav, not desktop TopNav |
| **Project Detail/Edit** | `updateProject` | `app/actions/projects.ts:97` | ❌ **NO** | Action exists, no modal or button |
| **Project Delete** | `deleteProject` | `app/actions/projects.ts:208` | ❌ **NO** | Action exists, no button |
| **Framework Edit** | `updateFramework` | `app/actions/frameworks.ts:100` | ❌ **NO** | Button exists, not wired |
| **Framework Delete** | `deleteFramework` | `app/actions/frameworks.ts:142` | ❌ **NO** | Button exists, not wired |
| **Bulk Delete Content** | `bulkDeleteContent` | `app/actions/content.ts:367` | ✅ **YES** | Used in Content Library |
| **Bulk Archive Content** | `bulkArchiveContent` | `app/actions/content.ts:391` | ❌ **NO** | Action exists, no UI |
| **Bulk Unarchive** | `bulkUnarchiveContent` | `app/actions/content.ts:415` | ❌ **NO** | Action exists, no UI |
| **Bulk Move Project** | `bulkChangeProject` | `app/actions/content.ts:439` | ❌ **NO** | Action exists, no UI |
| **Archive with Options** | `deleteClient` with options | `app/actions/clients.ts:187` | ✅ **YES** | Delete dialog has preserve/delete options |
| **AI Spend Tracking** | `ai_executions` table | Database + API routes | ✅ **YES** | Displayed on client cards and AI Studio |
| **Activity Logging** | `logActivity` | `lib/activity-log.ts` | ✅ **YES** | Logged on all CRUD operations |
| **Toast Notifications** | `Toast` component | `app/components/toast.tsx` | ❌ **NO** | Component exists, never used |
| **Questionnaire Submit** | `saveQuestionnaire` | `app/actions/questionnaire.ts:182` | ✅ **YES** | Fully wired |
| **Research (Gemini)** | `GeminiProvider` class | `lib/ai/providers/gemini.ts` | ⚠️ **PARTIAL** | Backend ready, no UI |
| **Analytics** | `/api/analytics` | `app/api/analytics/route.ts` | ✅ **YES** | Dashboard charts |
| **Client Status Logic** | `questionnaire_status` | Database schema | ✅ **YES** | Tracked and displayed |
| **Export Data** | Searched: `exportData`, `downloadCSV` | Entire codebase | ❌ **NOT FOUND** | Does not exist |

---

## DATABASE QUERIES NOT USED FROM UI

### RPC Functions (Supabase)
- `count_journal_entries` - **USED** in `/api/analytics`

### Storage Operations
- ✅ `questionnaire-uploads` bucket - **USED** for questionnaire file uploads
- ✅ `client-files` bucket - **USED** for content file uploads

### Orphaned Queries (Exist in Actions but Never Called)
- ❌ `getProject` - Single project detail query (no detail page)
- ❌ `getFramework` - Single framework detail query (no detail page)

---

## RECOMMENDATIONS

### Immediate Actions (Ship This Week)

1. **Wire Logout to Desktop** (5 min)
   - File: `components/layout/top-nav.tsx`
   - Add form action to line 61

2. **Wire Framework Edit/Delete** (30 min)
   - File: `components/frameworks/framework-card.tsx`
   - Add onClick handlers to lines 49 and 58
   - Create edit modal (copy from client edit pattern)

3. **Add Project Edit/Delete** (2 hours)
   - Create `components/projects/edit-project-dialog.tsx`
   - Create `components/projects/delete-project-dialog.tsx`
   - Add buttons to `ProjectCard`

4. **Implement Toast System** (3 hours)
   - Create `hooks/use-toast.ts`
   - Add `ToastContainer` to layout
   - Replace all `alert()` and `confirm()` calls

### Medium Priority (Next Sprint)

5. **Build Command Palette** (6 hours)
   - Install `cmdk` package
   - Create modal component
   - Wire `/api/search` route
   - Add Cmd+K shortcut

6. **Activity Log Page** (4 hours)
   - Create `/dashboard/activity` page
   - Use `/api/activity-log` route
   - Add timeline UI with filters

7. **Bulk Actions for Projects/Frameworks** (8 hours)
   - Add selection checkboxes
   - Integrate `BulkActionBar`
   - Create bulk server actions

### Future Enhancements

8. **Deep Research UI** (16 hours)
   - Create research interface
   - Use existing Gemini provider
   - Add to AI Studio

9. **Export System** (20 hours)
   - Build CSV/Excel export
   - Add report generation
   - Create print-friendly views

10. **Multi-User System** (40+ hours)
    - Replace single-user auth
    - Add team/workspace concept
    - Implement permissions

---

## CONCLUSION

The codebase is **well-structured** with **comprehensive backend logic**. The main issue is **incomplete UI wiring** for several CRUD operations, particularly:

- Project edit/delete
- Framework edit/delete  
- Logout (desktop)
- Bulk actions (beyond content)
- Toast notifications
- Command palette

**The good news:** Most features exist in the backend and just need UI components wired up. No major architectural changes needed.

**Estimated effort to complete all orphaned features:** 40-60 hours

**Priority order:**
1. Essential CRUD operations (edit/delete) - 10 hours
2. User experience improvements (toasts, search) - 10 hours
3. Power user features (bulk actions, activity log) - 15 hours
4. Advanced features (research UI, exports) - 20+ hours

---

**End of Report**

