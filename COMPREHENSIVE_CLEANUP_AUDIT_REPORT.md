# COMPREHENSIVE CLEANUP AUDIT REPORT
**Generated:** February 3, 2026  
**Project:** Savant Marketing Studio (Next.js 15 + Supabase + TypeScript)

---

## EXECUTIVE SUMMARY

| Category | Issues Found | Severity | Est. Cleanup Time |
|----------|--------------|----------|-------------------|
| **Dead Code** | 8 files, 10+ exports | Medium | 2-3 hours |
| **Type Safety** | 61+ `any` types, 50+ missing return types | High | 6-8 hours |
| **Debugging Code** | 253 console.log, 406 console.error | Medium | 3-4 hours |
| **Hardcoded Values** | 100+ magic numbers, 15+ hardcoded URLs | Medium | 4-6 hours |
| **Performance** | 36+ inline styles, 50+ unmemoized arrays, 10 N+1 queries | High | 8-12 hours |
| **Error Handling** | 40+ missing auth checks, 15+ missing response.ok | **CRITICAL** | 4-6 hours |
| **Security** | 3 missing auth checks, 1 XSS risk | **CRITICAL** | 2-3 hours |
| **Memory Leaks** | 5 async operations without unmount checks | Medium | 2-3 hours |
| **Duplicate Code** | 8 major patterns duplicated 3-19 times | Medium | 6-8 hours |
| **Missing Loading States** | 50+ async operations without indicators | Medium | 4-6 hours |
| **Dependency Audit** | 0 unused dependencies (all are used) | Low | N/A |

**Total Estimated Cleanup Time:** 40-60 hours  
**Critical Issues:** 4 (must fix immediately)  
**High Priority Issues:** ~150 (fix soon)  
**Medium/Low Priority:** ~400 (nice to have)

---

## CRITICAL (Fix Immediately)

| Priority | Issue | File | Line | Description | Fix |
|----------|-------|------|------|-------------|-----|
| 🔴 **CRITICAL** | Missing auth check | `app/actions/projects.ts` | 54 | `createProject()` has no `getUser()` check | Add auth validation |
| 🔴 **CRITICAL** | Missing auth + ownership validation | `app/actions/questionnaire.ts` | 211 | `saveQuestionnaire()` allows any user to save to any client | Add auth + verify clientId ownership |
| 🔴 **CRITICAL** | Missing auth check | `app/actions/projects.ts` | 7 | `getProjects()` has no auth check | Add `getUser()` validation |
| 🟠 **HIGH** | XSS vulnerability | `components/projects/project-captures.tsx` | 140 | `dangerouslySetInnerHTML` with unsanitized `highlightMentions()` | Sanitize HTML before rendering |

---

## CATEGORY 1: DEAD/UNUSED CODE

### 1.1 TODO/FIXME/HACK Comments (1 TODO, 3 BUG, 21 NOTE)

| File | Line | Type | Comment |
|------|------|------|---------|
| `components/ai-chat/chat-interface.tsx` | 418 | TODO | Implement message regeneration |
| `app/actions/research.ts` | 370 | BUG | RAG framework context bug fix (was built but never passed) |
| `components/questionnaire/public-form-wrapper.tsx` | 31 | BUG | Two clicks required theme switching bug |
| `lib/theme-provider.tsx` | 20 | BUG | Two clicks required bug prevention |

**21 NOTE comments** document SDK limitations, architectural decisions, and workarounds. Most are informational, not technical debt.

### 1.2 Unused Files (8 files safe to delete)

| File | Reason | Exports |
|------|--------|---------|
| `components/chat-selector.tsx` | Never imported | `ChatSelector` |
| `components/delete-confirmation-modal.tsx` | Never imported (deprecated) | `DeleteConfirmationModal` |
| `components/quick-action-button.tsx` | Never imported | `QuickActionButton` |
| `components/theme-toggle.tsx` | Never imported | `ThemeToggle` |
| `components/ai-studio/ai-studio.tsx` | Never imported | `AIStudio` |
| `hooks/use-fetch-with-abort.ts` | Never imported | `useFetchWithAbort`, `createAbortController` |
| `hooks/use-interval-with-visibility.ts` | Never imported | `useIntervalWithVisibility`, `useTimeout`, `useIsMounted` |
| `lib/dashboard/metrics.ts` | Never imported | 5 metric functions |

**Recommendation:** Delete these 8 files (backup first or use git to recover if needed later).

### 1.3 Unused Exports

| File | Unused Export | Status |
|------|---------------|--------|
| `hooks/use-debounced-value.ts` | `useDebouncedCallback` | Exported but never imported |

### 1.4 Commented-Out Code (1 large block)

| File | Lines | Size | Description |
|------|-------|------|-------------|
| `components/questionnaire/review/questionnaire-review.tsx` | 164-248 | 85 lines | Fallback hardcoded section rendering marked for removal |

**Recommendation:** Delete this commented block once config-driven system is confirmed stable.

### 1.5 Debugging Code

| Type | Count | Severity | Action |
|------|-------|----------|--------|
| `console.log` | 253 | Medium | Remove from app code (keep in scripts if intentional) |
| `console.error` | 406 | Medium | Replace with proper error handling/logging |
| `console.warn` | 22 | Low | Review and remove/gate in production |
| `debugger` statements | 0 | N/A | None found ✓ |

**Key files with excessive logging:**
- `app/actions/chat.ts` - 26 console.error statements
- `app/actions/journal-pages.ts` - 16 console.error statements
- `app/actions/questionnaire-config.ts` - 30 console.error statements
- `app/dashboard/research/page.tsx` - 10 console.error/log statements

**Scripts (intentional logging, may keep):**
- `scripts/generate-framework-embeddings.ts` - 30+ logs (CLI output)
- `scripts/seed-*.ts` - 50+ logs (CLI output)

---

## CATEGORY 2: TYPE SAFETY ISSUES

### 2.1 `any` Types (61+ instances)

| Severity | File | Line | Usage |
|----------|------|------|-------|
| High | `app/actions/journal-pages.ts` | 89, 123, 254, 341, 880 | Database query results typed as `any` |
| High | `app/actions/journal.ts` | 75, 268, 269 | Return types and array callbacks |
| High | `components/journal/quick-capture-modal.tsx` | 179, 186, 195, 203, 205 | Map/filter callbacks with `any` |
| Medium | `components/settings/questionnaire-settings.tsx` | 426, 1395 | Function parameters |
| Medium | `components/clients/client-detail.tsx` | 90, 95, 100, 304, 407, 516 | Data transformations |
| Medium | `app/dashboard/content/page.tsx` | 10, 34, 133, 145, 151 | Content extraction and mapping |
| Low | `hooks/use-debounced-value.ts` | 25 | Generic type constraint |
| Low | `lib/utils.ts` | 12 | Debounce function generic |

**Total:** 61+ instances across 30+ files

**Quick wins:**
1. Replace `(c: any)` with proper types from Supabase
2. Add return types to functions with `Promise<{ success: boolean; data?: any }>`
3. Type database query results with `Database['public']['Tables']['table_name']['Row']`

### 2.2 Missing Return Types (50+ functions)

| Priority | File | Function | Line |
|----------|------|----------|------|
| High | `app/actions/journal.ts` | All exported functions (20+) | Various |
| High | `app/actions/journal-pages.ts` | `sortChildren` | 60 |
| Medium | `components/projects/project-ai-generations.tsx` | `getGenerationTypeConfig` | 86 |
| Medium | `components/projects/project-content.tsx` | `getAssetTypeConfig` | 24 |
| Medium | `lib/supabase/cache-helpers.ts` | All functions (15+) | 15-105 |

**Pattern:** Most async server actions are missing explicit return types.

**Recommendation:** Add explicit return types to all exported functions:
```typescript
export async function getJournalEntries(): Promise<JournalEntry[]> {
  // ...
}
```

### 2.3 @ts-ignore / @ts-expect-error

**Status:** ✅ None found (excellent!)

---

## CATEGORY 3: HARDCODED VALUES

### 3.1 Hardcoded URLs

| Type | File | Line | Value | Fix |
|------|------|------|-------|-----|
| Debug endpoint | `app/actions/questionnaire-config.ts` | 75, 90, 295, 310, 320 | `http://127.0.0.1:7243/ingest/...` | Move to `.env` or remove |
| Debug endpoint | `components/settings/questionnaire-settings.tsx` | 152, 165, 461+ | Same debug URL | Move to `.env` or remove |
| Google Docs | `components/responsive-file-preview.tsx` | 176, 183 | `https://docs.google.com/viewer?url=...` | Extract to constant |
| Seed data | `scripts/seed-ascendedbody.ts` | 29, 128-131, 277-279 | Instagram/TikTok URLs | OK (seed data) |

**Total:** 15+ hardcoded URLs (5 critical debug URLs need immediate attention)

### 3.2 Hardcoded UUIDs

| UUID | File | Count | Purpose |
|------|------|-------|---------|
| `de6f83dd-b5e0-4c9a-99d4-d76568bc937c` | `app/actions/questionnaire-config.ts`, `components/settings/questionnaire-settings.tsx` | 15+ | Debug endpoint ID |

**Recommendation:** Extract to `.env.local` as `DEBUG_ENDPOINT_ID`

### 3.3 Magic Numbers (100+ instances)

#### Token Limits
| Value | File | Count | Purpose |
|-------|------|-------|---------|
| 4096 | `app/actions/ai.ts`, `app/actions/chat.ts`, `lib/ai/providers/claude.ts` | 6 | Max output tokens |
| 2048 | `app/actions/research.ts`, `lib/ai/web-research.ts` | 5 | Max output tokens |
| 200000 | `components/editor/ai-prompt-bar.tsx`, `components/ai-chat/chat-interface.tsx` | 4 | Max tokens default |
| 10000 | `app/actions/chat.ts`, `lib/ai/providers/claude.ts` | 3 | Thinking budget |

**Recommendation:** Extract to `lib/ai/constants.ts`:
```typescript
export const AI_TOKEN_LIMITS = {
  DEFAULT_MAX: 4096,
  EXTENDED_MAX: 200000,
  THINKING_BUDGET: 10000,
  // ...
} as const
```

#### Time Delays (ms)
| Value | File | Count | Purpose |
|-------|------|-------|---------|
| 500 | Multiple | 8+ | Debounce delays |
| 1500 | `app/dashboard/research/page.tsx`, `components/journal/page-view.tsx` | 3+ | Auto-save delays |
| 3000 | `components/questionnaire/unified-questionnaire-form.tsx` | 2+ | Auto-save delays |

**Recommendation:** Extract to constants file

#### Embedding Dimensions
| Value | File | Purpose |
|-------|------|---------|
| 2000 | `scripts/generate-framework-embeddings.ts`, `lib/ai/embeddings.ts` | Embedding vector size |

**Recommendation:** Already defined as constant `EMBEDDING_DIMENSIONS` ✓

### 3.4 Hardcoded Model Names

| Model | File | Count |
|-------|------|-------|
| `claude-sonnet-4-5-20250929` | `app/actions/chat.ts` | 4 |
| `gemini-3-flash-preview` | `app/actions/research.ts`, `lib/ai/web-research.ts` | 5 |
| `gemini-2.5-flash` | Multiple | 3 |
| `gemini-embedding-001` | `lib/ai/embeddings.ts` | 2 |

**Recommendation:** Extract to `lib/ai/models.ts`:
```typescript
export const AI_MODELS = {
  CLAUDE_SONNET: 'claude-sonnet-4-5-20250929',
  GEMINI_FLASH: 'gemini-3-flash-preview',
  // ...
} as const
```

### 3.5 Hardcoded API Endpoints (50+ instances)

**Pattern:** Every component has hardcoded `/api/...` endpoints

**Examples:**
- `fetch('/api/frameworks')` - 1 instance
- `fetch('/api/clients')` - 5+ instances  
- `fetch('/api/questionnaire-response/...')` - 10+ instances
- `fetch('/api/analytics')` - 1 instance

**Recommendation:** Extract to `lib/api/endpoints.ts`:
```typescript
export const API_ENDPOINTS = {
  frameworks: '/api/frameworks',
  clients: '/api/clients',
  questionnaireResponse: (clientId: string) => `/api/questionnaire-response/${clientId}`,
  // ...
} as const
```

---

## CATEGORY 4: PERFORMANCE ISSUES

### 4.1 Inline Style Objects (36+ instances)

| File | Line | Example | Impact |
|------|------|---------|--------|
| `components/journal/quick-capture-modal.tsx` | 533 | `style={{}}` | New object every render |
| `components/editor/ai-prompt-bar.tsx` | 1038 | `style={{ width: calc }}` | Calculation + new object |
| `components/questionnaire/navigation/section-nav.tsx` | 149, 206 | `style={{ width: ... }}` | Conditional/calculated styles |

**Recommendation:**
1. Extract static styles to CSS modules or Tailwind classes
2. Use `useMemo` for calculated styles
3. Move conditional styles to CSS classes with conditional className

### 4.2 Unmemoized Array Operations (50+ instances)

| Priority | File | Line | Pattern | Impact |
|----------|------|------|---------|--------|
| **High** | `components/journal/mention-popover.tsx` | 97-111 | `.filter()` on every render | Re-filters 4 arrays (clients, projects, content, pages) |
| **High** | `components/journal/quick-capture-modal.tsx` | 179-199 | `.map()` transformations | Creates new arrays on every render |
| **High** | `components/settings/questionnaire-settings.tsx` | 258-262 | Stats calculations | Recalculates stats on every render |
| Medium | `app/dashboard/research/page.tsx` | 453, 626, 688 | Multiple `.map()` in JSX | Creates new arrays |
| Medium | `components/clients/client-detail.tsx` | 100 | `activities.map()` transformation | Recalculates on every render |

**Recommendation:**
```typescript
// Before
const filteredClients = allClients.filter(c => c.name.includes(search))

// After
const filteredClients = useMemo(
  () => allClients.filter(c => c.name.includes(search)),
  [allClients, search]
)
```

### 4.3 Missing React.memo (10+ components)

| Component | File | Reason | Impact |
|-----------|------|--------|--------|
| `QuestionRenderer` | `components/questionnaire/question-renderer.tsx` | Rendered multiple times in forms | High - re-renders all questions |
| `ProjectAIGenerations` | `components/projects/project-ai-generations.tsx` | Receives stable props | Medium |
| `MentionPopover` | `components/journal/mention-popover.tsx` | Complex component with stable props | Medium |
| `MessageThread` | `components/ai-chat/message-thread.tsx` | Receives messages array | Medium |

**Recommendation:** Wrap in `React.memo`:
```typescript
export const QuestionRenderer = React.memo(function QuestionRenderer(props) {
  // ...
})
```

### 4.4 Missing useCallback (15+ instances)

| File | Line | Pattern | Impact |
|------|------|---------|--------|
| `components/questionnaire/unified-questionnaire-form.tsx` | 502-504 | Inline functions in map | New functions on every render |
| `components/journal/mention-popover.tsx` | 297-369 | `onClick={() => ...}` in map | New functions for every item |
| `app/dashboard/research/page.tsx` | 456 | Inline functions in map | New functions on every render |

**Recommendation:**
```typescript
// Before
<Button onClick={() => handleClick(item.id)}>Click</Button>

// After
const handleItemClick = useCallback((id: string) => {
  handleClick(id)
}, [handleClick])

<Button onClick={() => handleItemClick(item.id)}>Click</Button>
```

### 4.5 N+1 Query Patterns (10 instances)

| Priority | File | Line | Pattern | Fix |
|----------|------|------|---------|-----|
| **High** | `app/actions/journal-pages.ts` | 750-755 | Loop with sequential updates | Batch update with `.upsert()` |
| **High** | `app/actions/journal-pages.ts` | 896-919 | Recursive inserts in loop | Batch insert children |
| **High** | `lib/ai/rag.ts` | 527-537 | Insert chunks in loop | Batch insert all chunks |
| Medium | `app/actions/journal-pages.ts` | 270-323 | Sequential queries in `getPage()` | Use `Promise.all()` |
| Medium | `app/dashboard/clients/[id]/page.tsx` | 77-121 | 7 separate queries | Combine with joins or batch fetch |

**Example fix:**
```typescript
// Before (N+1)
for (const update of updates) {
  await supabase.from('journal_entries')
    .update({ sort_order: update.sort_order })
    .eq('id', update.id)
}

// After (single query)
await supabase.from('journal_entries')
  .upsert(updates.map(u => ({ id: u.id, sort_order: u.sort_order })))
```

### 4.6 SELECT * Optimizations (50+ queries)

| File | Queries | Issue |
|------|---------|-------|
| `app/dashboard/clients/[id]/page.tsx` | 7 | All use `select('*')` when specific columns needed |
| `app/actions/journal.ts` | 7 | Multiple `select('*')` queries |
| `app/actions/journal-pages.ts` | 3+ | `select('*')` in frequently called functions |

**Recommendation:** Specify only needed columns:
```typescript
// Before
.select('*')

// After
.select('id, title, content, created_at, user_id')
```

### 4.7 Memory Leaks (5 issues)

| Priority | File | Line | Issue | Fix |
|----------|------|------|-------|-----|
| **High** | `components/journal/quick-capture-modal.tsx` | 162 | Async `loadData()` updates state without unmount check | Add `isMountedRef` pattern |
| Medium | `components/journal/page-view.tsx` | 151, 161, 252 | `setTimeout` in async without unmount check | Check mounted before setState |
| Medium | `lib/questionnaire/use-questionnaire-form.ts` | 141-185, 437-458 | Async state updates without unmount check | Add mounted check |
| Medium | `app/dashboard/research/page.tsx` | 229, 241 | Intervals may persist if unmount during research | Ensure cleanup |
| Low | `components/journal/use-mention-detection.ts` | 326 | `setTimeout` without cleanup (0ms) | Add cleanup (low risk) |

**Fix pattern:**
```typescript
const isMountedRef = useRef(true)

useEffect(() => {
  return () => { isMountedRef.current = false }
}, [])

const loadData = async () => {
  const data = await fetchData()
  if (isMountedRef.current) {
    setData(data)
  }
}
```

---

## CATEGORY 5: ERROR HANDLING GAPS

### 5.1 Empty/Minimal Catch Blocks

| File | Line | Issue |
|------|------|-------|
| `app/layout.tsx` | 86 | Empty catch: `catch(e) {}` |
| Multiple files | Various | 16+ catch blocks with only `console.error` |

### 5.2 Missing Authentication Checks (40+ instances)

| Priority | File | Function | Line | Issue |
|----------|------|----------|------|-------|
| 🔴 **CRITICAL** | `app/actions/projects.ts` | `createProject()` | 54 | No `auth.getUser()` check |
| 🔴 **CRITICAL** | `app/actions/questionnaire.ts` | `saveQuestionnaire()` | 211 | No auth or ownership validation |
| 🔴 **CRITICAL** | `app/actions/projects.ts` | `getProjects()` | 7 | No auth check |
| 🟠 **HIGH** | `app/actions/frameworks.ts` | `getFrameworks()` | 19 | No auth check |

**Additional 36+ database queries** in `app/actions/journal-pages.ts` and `app/actions/journal.ts` don't check `auth.getUser()` error response.

**Fix pattern:**
```typescript
export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // ... rest of function
}
```

### 5.3 Missing response.ok Checks (15+ instances)

| File | Line | Issue |
|------|------|-------|
| `components/frameworks/framework-library.tsx` | 53 | Fetch without `response.ok` check |
| `components/clients/client-detail.tsx` | 80-94 | Multiple fetch calls without validation |
| `components/questionnaire/share-questionnaire-popup.tsx` | 113, 319 | Fetch without `response.ok` |
| `components/settings/questionnaire-settings.tsx` | 170, 274, 316+ | Multiple fetch calls |

**Fix:**
```typescript
const response = await fetch('/api/endpoint')
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}
const data = await response.json()
```

---

## CATEGORY 6: SECURITY ISSUES

### 6.1 Authentication/Authorization (HIGH PRIORITY)

See "Missing Authentication Checks" above - **4 critical issues**

### 6.2 XSS Vulnerabilities (1 issue)

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `components/projects/project-captures.tsx` | 140 | `dangerouslySetInnerHTML` with unsanitized `highlightMentions()` | 🟠 **MEDIUM** |

**Fix:** Sanitize HTML before rendering:
```typescript
import { sanitizeHtml } from '@/lib/utils/sanitize-html'

<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHtml(highlightMentions(entry.content)) 
}} />
```

### 6.3 API Keys in Code

**Status:** ✅ None found (all use environment variables correctly)

### 6.4 Sensitive Data in Logs

**Status:** ⚠️ Low risk - only env var names logged, not values

---

## CATEGORY 7: DUPLICATE CODE PATTERNS

### 7.1 High Priority Duplicates

| Pattern | Files | Count | Savings |
|---------|-------|-------|---------|
| Loading/Error UI components | 2+ | Multiple | Create `<LoadingState />` & `<ErrorState />` |
| Form submission handlers | 4+ | 4-5x | Create `useFormSubmission` hook |
| AbortController fetch | 3+ | 3x | Use existing `useFetchWithAbort` consistently |
| Router refresh after mutations | 19+ | 19x | Create mutation hook with auto-refresh |

### 7.2 Medium Priority Duplicates

| Pattern | Files | Count | Savings |
|---------|-------|-------|---------|
| Error handling `response.json().catch()` | 3+ | 3x | Create `handleFetchError` utility |
| Data transformations | 3+ | 3x | Create transformer utilities |
| Delete confirmation dialogs | 2 | 2x | Standardize on one component |

**Estimated code reduction:** 15-20% if refactored

---

## CATEGORY 8: MISSING LOADING STATES (50+ instances)

| Type | Count | Priority | Examples |
|------|-------|----------|----------|
| Server actions without loading state | 15+ | High | `components/journal/page-tree.tsx` (203, 216, 233) |
| Fetch calls without indicators | 20+ | High | `components/frameworks/framework-library.tsx` (53) |
| Form submissions without disabled state | 10+ | **Critical** | `components/questionnaire/unified-questionnaire-form.tsx` (428) |
| useEffect data fetching | 15+ | Medium | Multiple files |
| Missing Suspense boundaries | 10+ | Low | All async components |

**Critical issue:** Form submissions without disabled buttons can lead to duplicate submissions.

---

## CATEGORY 9: DEPENDENCY AUDIT

### 9.1 Dependencies Analysis

**Total dependencies:** 27  
**Total devDependencies:** 13  
**Unused dependencies:** 0 ✅

All dependencies are actively used:
- ✅ `date-fns` - used in 18 files
- ✅ `mammoth` - used for .docx processing (dynamic import)
- ✅ `unpdf` - used for PDF processing (dynamic import)
- ✅ `@dnd-kit/*` - used for drag-and-drop functionality
- ✅ All other packages verified as in use

### 9.2 Test Coverage

**Status:** ⚠️ No test files found
- No `.test.ts/tsx` files
- No `.spec.ts/tsx` files
- No `__tests__` directories

**Recommendation:** Add testing infrastructure (Jest, Vitest, or Playwright)

### 9.3 Potential Optimizations

| Dependency | Usage | Recommendation |
|------------|-------|----------------|
| `date-fns` | 18 files | ✅ Already tree-shakeable, good choice |
| Dynamic imports | `mammoth`, `unpdf` | ✅ Already optimized with dynamic imports |
| Bundle size | N/A | Consider analyzing with `@next/bundle-analyzer` |

---

## CATEGORY 10: DEPRECATED PATTERNS

### 10.1 React Patterns

**Status:** ✅ Excellent - No deprecated patterns found
- No class components (except `ErrorBoundary` which is required)
- No legacy lifecycle methods
- No `UNSAFE_*` methods
- No `defaultProps`
- No string refs
- Modern hooks-based architecture throughout

### 10.2 Naming Conventions

**Status:** ✅ Mostly clean
- ✅ File naming: Consistent kebab-case
- ✅ Variable naming: Consistent camelCase
- ✅ Database naming: Consistent snake_case
- ⚠️ 3 documentation references to "workspace" (should be "client")

**Files to update:**
1. `_docs/references/AUDIT_REPORT.md` (lines 414, 552)
2. `README.md` (line 76)

---

## FILES SAFE TO DELETE

### Confirmed Unused (can delete immediately)

```
savant-marketing-studio/
├── components/
│   ├── chat-selector.tsx
│   ├── delete-confirmation-modal.tsx
│   ├── quick-action-button.tsx
│   ├── theme-toggle.tsx
│   └── ai-studio/
│       └── ai-studio.tsx
├── hooks/
│   ├── use-fetch-with-abort.ts
│   └── use-interval-with-visibility.ts
└── lib/
    └── dashboard/
        └── metrics.ts
```

**Total:** 8 files  
**Estimated lines of code removed:** ~500-800 lines

### Commented Code to Delete

```
components/questionnaire/review/questionnaire-review.tsx
  Lines 164-248 (85 lines of commented fallback code)
```

---

## QUICK WINS (High Impact, Low Effort)

### 🎯 Security (2-3 hours)

1. **Add auth checks to 4 critical functions** (30 min each)
   - `app/actions/projects.ts` → `createProject()`, `getProjects()`
   - `app/actions/questionnaire.ts` → `saveQuestionnaire()`
   - `app/actions/frameworks.ts` → `getFrameworks()`

2. **Sanitize HTML in `highlightMentions()`** (20 min)
   - Add `sanitizeHtml()` call before `dangerouslySetInnerHTML`

### 🚀 Performance (2-3 hours)

3. **Memoize filtered arrays in mention-popover** (30 min)
   - Wrap 4 filter operations in `useMemo`

4. **Add React.memo to QuestionRenderer** (10 min)
   - Prevents re-rendering all questions

5. **Extract inline styles to constants** (1 hour)
   - Replace 36 inline `style={{}}` with constants or CSS

6. **Batch update query in journal-pages** (30 min)
   - Fix N+1 query in `updateSortOrders()`

### 🧹 Cleanup (1-2 hours)

7. **Delete 8 unused files** (15 min)
   - Remove dead code files listed above

8. **Remove console.log from production code** (1 hour)
   - Clean up 253 console.log statements (keep in scripts)

9. **Delete commented code block** (5 min)
   - Remove 85-line commented block in questionnaire-review

10. **Extract magic numbers to constants** (30 min)
    - Create `lib/ai/constants.ts` for token limits
    - Create `lib/constants/timeouts.ts` for delays

### 🔧 Developer Experience (1 hour)

11. **Add return types to top 10 functions** (1 hour)
    - Focus on exported server actions

12. **Fix hardcoded debug URLs** (15 min)
    - Move to `.env.local` or remove

---

## IMPLEMENTATION PRIORITY

### Phase 1: Security & Critical Bugs (1 day)
1. ✅ Add authentication checks to 4 functions
2. ✅ Sanitize HTML in `highlightMentions()`
3. ✅ Add client ownership validation

### Phase 2: Performance (2-3 days)
1. ✅ Fix N+1 queries (3 high-priority instances)
2. ✅ Add memoization (top 5 instances)
3. ✅ Add React.memo to QuestionRenderer
4. ✅ Fix memory leaks (5 instances)

### Phase 3: Code Quality (3-4 days)
1. ✅ Add return types to exported functions
2. ✅ Replace `any` types with proper types
3. ✅ Extract magic numbers to constants
4. ✅ Extract hardcoded URLs/endpoints

### Phase 4: Cleanup (1-2 days)
1. ✅ Delete unused files/code
2. ✅ Remove console.log statements
3. ✅ Add missing loading states
4. ✅ Fix error handling gaps

### Phase 5: Refactoring (1 week)
1. ✅ Create shared UI components (LoadingState, ErrorState)
2. ✅ Create hooks (useFormSubmission, useMutation)
3. ✅ Consolidate duplicate patterns
4. ✅ Add missing Suspense boundaries

---

## METRICS & STATS

### Code Metrics
- **Total files analyzed:** ~200 TypeScript/TSX files
- **Lines of code:** ~50,000+ estimated
- **Technical debt ratio:** Medium-High
- **Code duplication:** ~15-20% could be reduced

### Issue Breakdown
- **Critical:** 4 (security/auth)
- **High:** ~150 (performance, type safety, error handling)
- **Medium:** ~300 (code quality, missing loading states)
- **Low:** ~100 (nice-to-have improvements)

### Estimated Impact
- **Performance improvement:** 20-30% (after memoization + N+1 fixes)
- **Bundle size reduction:** 5-10% (after cleanup)
- **Maintainability improvement:** Significant (after refactoring duplicates)
- **Type safety improvement:** Major (after fixing `any` types)

---

## RECOMMENDATIONS

### Immediate Actions (This Week)
1. ✅ Fix 4 critical security issues
2. ✅ Delete 8 unused files
3. ✅ Fix XSS vulnerability
4. ✅ Add form submission disabled states

### Short-Term (This Month)
1. Fix high-priority performance issues
2. Add return types to all exported functions
3. Extract constants (token limits, timeouts, endpoints)
4. Remove debugging console statements

### Medium-Term (This Quarter)
1. Add test coverage (start with critical paths)
2. Refactor duplicate patterns into shared utilities
3. Add comprehensive error boundaries
4. Implement consistent loading state patterns

### Long-Term (Ongoing)
1. Establish coding standards to prevent issues
2. Set up automated linting for banned patterns
3. Add pre-commit hooks for type safety
4. Regular dependency audits

---

## TOOLS & AUTOMATION

### Recommended Setup

1. **ESLint rules to prevent issues:**
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react/no-unstable-nested-components": "error"
  }
}
```

2. **Pre-commit hooks:**
```bash
# .husky/pre-commit
npm run lint
npm run type-check
```

3. **Bundle analyzer:**
```bash
npm install --save-dev @next/bundle-analyzer
```

4. **Automated unused code detection:**
```bash
npm install --save-dev knip
```

---

## CONCLUSION

This codebase is **well-structured and modern** with Next.js 15 and TypeScript, but has accumulated technical debt in several areas:

### Strengths ✅
- Modern React patterns (hooks, no deprecated code)
- Good dependency management (all deps used)
- Proper TypeScript setup
- Consistent naming conventions

### Areas for Improvement ⚠️
- **Security:** Missing auth checks in critical functions
- **Type Safety:** Too many `any` types and missing return types
- **Performance:** N+1 queries, unmemoized operations
- **Code Quality:** High duplication, debugging code in production
- **Error Handling:** Gaps in validation and user feedback

### Next Steps
1. Fix critical security issues immediately (4 hours)
2. Implement quick wins for performance (3-4 hours)
3. Clean up dead code and debugging statements (2-3 hours)
4. Plan refactoring for duplicate patterns (ongoing)

**Estimated total cleanup time:** 40-60 hours  
**Recommended timeline:** 2-3 weeks with dedicated effort

---

**Report generated by:** Cursor AI Agent  
**Date:** February 3, 2026  
**Codebase version:** Latest commit on main branch
