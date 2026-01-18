# FRAMEWORKS LIBRARY AUDIT REPORT
**Audit Date:** January 17, 2026  
**Auditor:** AI Assistant (Claude Opus 4.5)

---

## 1. DATABASE STATE

### Schema: `marketing_frameworks`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NOT NULL | - | FK to `auth.users(id)` ON DELETE CASCADE |
| `name` | TEXT | NOT NULL | - | Framework name |
| `description` | TEXT | NULL | - | Brief description |
| `category` | TEXT | NULL | - | E.g., 'copywriting', 'ads', 'email', 'persuasion' |
| `content` | TEXT | NOT NULL | - | Full framework content (for RAG/system prompts) |
| `type` | TEXT | NOT NULL | `'writing-framework'` | CHECK: `content-type` or `writing-framework` |
| `is_active` | BOOLEAN | NULL | `true` | Whether framework is active |
| `created_at` | TIMESTAMPTZ | NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NULL | `NOW()` | Auto-updated via trigger |
| `deleted_at` | TIMESTAMPTZ | NULL | `NULL` | Soft delete timestamp |

**Indexes:**
- `idx_marketing_frameworks_user_id` ON `user_id`
- `idx_marketing_frameworks_category` ON `category`
- `idx_marketing_frameworks_type` ON `type`

**Triggers:**
- `update_marketing_frameworks_updated_at` - Auto-updates `updated_at` on modification

### Schema: `framework_chunks`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | BIGINT | NOT NULL | IDENTITY | Primary key (auto-increment) |
| `framework_id` | UUID | NOT NULL | - | FK to `marketing_frameworks(id)` ON DELETE CASCADE |
| `chunk_index` | INTEGER | NOT NULL | - | Position in chunking sequence |
| `content` | TEXT | NOT NULL | - | Chunk text content |
| `embedding` | VECTOR(1536) | NULL | - | OpenAI text-embedding-3-small vector |
| `created_at` | TIMESTAMPTZ | NULL | `NOW()` | Creation timestamp |

**Indexes:**
- `idx_framework_chunks_framework_id` ON `framework_id`
- `idx_framework_chunks_embedding` USING ivfflat (vector_cosine_ops) WITH (lists = 100)

**Notes:**
- Vector dimension: 1536 (OpenAI text-embedding-3-small)
- Uses IVFFlat index for approximate nearest neighbor search
- Cascade delete ensures chunks are removed when framework is deleted

### Current Data Summary

**Unable to query live database** (Supabase MCP access restricted), but based on code analysis:

- **By Type:**
  - `content-type`: Content format definitions (Facebook Ad, Email, Landing Page, etc.)
  - `writing-framework`: Persuasion structures (AIDA, PAS, BAB, StoryBrand, etc.)

- **Seeded Frameworks (from `scripts/seed-frameworks.ts`):**
  
  **Content Types (8):**
  | Name | Category | Type |
  |------|----------|------|
  | Facebook Ad | social | content-type |
  | Instagram Ad | social | content-type |
  | Sales Email | email | content-type |
  | Newsletter Email | email | content-type |
  | Landing Page | web | content-type |
  | Blog Post | content | content-type |
  | Social Media Post | social | content-type |
  | Sales Letter | sales | content-type |

  **Writing Frameworks (7):**
  | Name | Category | Type |
  |------|----------|------|
  | AIDA Framework | persuasion | writing-framework |
  | PAS Framework | persuasion | writing-framework |
  | BAB Framework | persuasion | writing-framework |
  | 4 P's Framework | persuasion | writing-framework |
  | StoryBrand Framework | persuasion | writing-framework |
  | FAB Framework | persuasion | writing-framework |
  | PASTOR Framework | persuasion | writing-framework |

### RLS Policies

**`marketing_frameworks`:**
- Policy: `"Users can manage their own frameworks"`
- Type: ALL (SELECT, INSERT, UPDATE, DELETE)
- Condition: `auth.uid() = user_id`

**`framework_chunks`:**
- Policy: `"Users can access chunks for their frameworks"`
- Type: ALL
- Condition: EXISTS subquery checking framework ownership via `marketing_frameworks.user_id = auth.uid()`

**Notes:**
- Proper RLS ensures user data isolation
- Cascade through framework ownership for chunks

---

## 2. SERVER ACTIONS

### Actions Found

| File | Function | Purpose | Called From |
|------|----------|---------|-------------|
| `app/actions/frameworks.ts` | `getFrameworks()` | Get all frameworks (excludes soft-deleted) | `api/frameworks/route.ts` |
| `app/actions/frameworks.ts` | `getFramework(id)` | Get single framework by ID | `frameworks/[id]/page.tsx` |
| `app/actions/frameworks.ts` | `createFramework(formData)` | Create + generate embeddings | `NewFrameworkDialog` |
| `app/actions/frameworks.ts` | `updateFramework(id, formData)` | Update + regenerate embeddings | `FrameworkEditForm` |
| `app/actions/frameworks.ts` | `deleteFramework(id)` | Soft delete (sets `deleted_at`) | `FrameworkCard`, `FrameworkEditForm` |
| `app/actions/frameworks.ts` | `restoreFramework(id)` | Restore from soft delete | Archive page |
| `app/actions/frameworks.ts` | `permanentlyDeleteFramework(id)` | Hard delete | Archive page |
| `app/actions/frameworks.ts` | `duplicateFramework(id)` | Clone framework + embeddings | `FrameworkCard` |
| `app/actions/frameworks.ts` | `getArchivedFrameworks()` | Get soft-deleted frameworks | Archive page |
| `app/actions/frameworks.ts` | `getFrameworkCategories()` | Get unique categories | `FrameworkEditForm` |
| `lib/ai/rag.ts` | `searchFrameworks(query, threshold, limit)` | Vector similarity search | `app/actions/ai.ts` |
| `lib/ai/rag.ts` | `getFrameworksByCategory(category)` | Simple category query | Not used in current code |
| `lib/ai/rag.ts` | `addFramework(name, category, ...)` | **DUPLICATE** - adds framework + embeddings | Not used (should be removed) |

### Embedding Pipeline

**Generation Trigger:** Automatic on save (asynchronous, non-blocking)

**Chunking Strategy:**
```typescript
chunkText(text, maxChunkSize = 1000, overlap = 100)
```
- Splits by double newlines (paragraphs)
- Falls back to sentence splitting for long paragraphs
- 100-character overlap between chunks
- Target chunk size: 1000 characters

**Embedding Model:** OpenAI `text-embedding-3-small`
- Dimension: 1536
- Called via direct fetch to OpenAI API
- Requires `OPENAI_API_KEY` environment variable

**Process:**
1. Framework saved to `marketing_frameworks`
2. Content chunked with overlap
3. Each chunk embedded via OpenAI API
4. Chunks + embeddings stored in `framework_chunks`
5. Old chunks deleted before regeneration on update

### RAG Implementation

**Function:** `match_framework_chunks(query_embedding, match_threshold, match_count)`

**Parameters:**
- `query_embedding`: VECTOR(1536) - The search query embedding
- `match_threshold`: FLOAT - Similarity threshold (default: 0.7)
- `match_count`: INT - Max results (default: 5)

**Returns:**
| Column | Type |
|--------|------|
| `id` | BIGINT |
| `framework_id` | UUID |
| `content` | TEXT |
| `similarity` | FLOAT |

**Usage Locations:**
- `app/actions/ai.ts::generateContent()` - RAG search for content generation
- `app/actions/ai.ts::generateInlineEdit()` - RAG search for inline editing

---

## 3. UI COMPONENTS

### Pages

| Route | Component | Features |
|-------|-----------|----------|
| `/dashboard/frameworks` | `FrameworkLibrary` | Grid view, search, category filter, create dialog |
| `/dashboard/frameworks/[id]` | `FrameworkEditForm` | Edit name/description/category/content, delete, back navigation |

### Component Inventory

| File | Component | Purpose |
|------|-----------|---------|
| `components/frameworks/framework-library.tsx` | `FrameworkLibrary` | Main library grid with search/filter |
| `components/frameworks/framework-card.tsx` | `FrameworkCard` | Individual card with actions menu |
| `components/frameworks/new-framework-dialog.tsx` | `NewFrameworkDialog` | Create new framework modal |
| `app/dashboard/frameworks/[id]/edit-form.tsx` | `FrameworkEditForm` | Edit form for existing framework |
| `app/dashboard/frameworks/[id]/not-found.tsx` | - | 404 handling |

### Framework Library Features

**Header:**
- Title: "Framework Library"
- Import button (UI only - NOT IMPLEMENTED)
- New Framework button → Opens `NewFrameworkDialog`

**Search:**
- Text input filtering by name and description
- Real-time filtering (client-side)

**Category Filter:**
- Pills: "All", "Copywriting", "Email", "Ads", "Funnel", "Landing Page", "Social"
- **ISSUE:** Hardcoded categories don't match database values (e.g., 'persuasion', 'web', 'content', 'sales')

**Framework Grid:**
- Responsive: 1-4 columns based on viewport
- Cards show: name, description, category badge, character count, chunk count
- Click to navigate to edit page
- Dropdown menu: Edit, Duplicate, Delete

### Framework Edit Form

**Fields:**
- Name (required)
- Description (optional)
- Category (dropdown - **ISSUE:** duplicate options, inconsistent casing)
- Content (textarea, required)

**Actions:**
- Save Changes → Updates framework, regenerates embeddings
- Delete → Soft delete with confirmation
- Cancel → Returns to library

### Selection Components (AI Chat)

**Chat Setup (`/dashboard/ai/chat`):**
- Only fetches `writing-framework` type frameworks
- Passed to `ChatInterface` as `writingFrameworks` prop

**Context Picker Modal (`ContextPickerModal`):**
- Frameworks appear under "Frameworks" category
- Shows name and category as subtitle
- Orange-colored icon/pills

**Inline Mention Popup (`InlineMentionPopup`):**
- Type "@framework" or "@frameworks" to filter
- Shows all frameworks grouped under "Frameworks" section

**Type Mapping:**
- UI uses `type: "framework"` internally
- Maps to `"writing-framework"` when sending to backend

---

## 4. INTEGRATION POINTS

### System Prompt Injection

**Location:** `app/actions/chat.ts::buildSystemPrompt()`

**Flow:**
1. Takes `clientId`, `contentTypeId`, `writingFrameworkIds[]`
2. Loads client context (brand_data, intake_responses)
3. Loads content type framework (if selected): `"## Content Type: ${name}\n\nFollow these format guidelines:\n${content}"`
4. Loads writing frameworks (if selected): `"## Writing Frameworks\n\n### ${name}\n${content}"`
5. Appends general instructions

**Content Type vs Writing Framework:**
- **Content Type:** Single selection, provides format guidelines (character limits, structure, best practices)
- **Writing Framework:** Multiple selection, provides persuasion structure (AIDA steps, PAS flow, etc.)

**Format in System Prompt:**
```
## Content Type: Facebook Ad

Follow these format guidelines:
[content type content here]

## Writing Frameworks

### AIDA Framework
[AIDA content here]

### PAS Framework
[PAS content here]
```

### Context Injection (@mentions)

**Location:** `app/actions/chat.ts::buildContextFromMentions()`

**Framework Mention Format:**
```markdown
## Referenced Frameworks
### [Framework Name]
Category: [category]
Description: [description]
Framework:
[content]
```

**Token Estimation:** Not implemented - full content is injected

### RAG Usage in Content Generation

**Location:** `app/actions/ai.ts::generateContent()`

**Flow:**
1. Calls `searchFrameworks(customPrompt, 0.7, 5)`
2. Concatenates matching chunk content
3. Injects into system prompt as `RELEVANT FRAMEWORKS:` section

**Note:** RAG is used for automatic context retrieval, separate from explicit @mentions

---

## 5. DATA QUALITY ANALYSIS

### Seeded Content Types (Quality Assessment)

| Name | Quality | Issues | Recommendations |
|------|---------|--------|-----------------|
| Facebook Ad | 4/5 | Good structure, specific limits | Add creative examples |
| Instagram Ad | 4/5 | Visual-first emphasis good | Add story vs. feed distinctions |
| Sales Email | 4/5 | Clear structure | Add subject line guidelines |
| Newsletter Email | 4/5 | Good nurturing focus | Add segmentation tips |
| Landing Page | 4/5 | Comprehensive sections | Add fold hierarchy guidance |
| Blog Post | 4/5 | Good SEO focus | Add readability metrics |
| Social Media Post | 3/5 | Platform-agnostic is limiting | Split into platform-specific types |
| Sales Letter | 4/5 | Classic direct response | Add modern adaptations |

### Seeded Writing Frameworks (Quality Assessment)

| Name | Quality | Issues | Recommendations |
|------|---------|--------|-----------------|
| AIDA | 5/5 | Complete, well-structured | None - exemplary |
| PAS | 4/5 | Good detail | Add more agitation examples |
| BAB | 4/5 | Clear contrast focus | Add bridge transition techniques |
| 4 P's | 4/5 | Good proof section | Add social proof variations |
| StoryBrand | 4/5 | Comprehensive hero journey | Add brand examples |
| FAB | 3/5 | Somewhat basic | Expand with industry examples |
| PASTOR | 4/5 | Good for long-form | Add paragraph templates |

### Embedding Status

- Embeddings generated automatically on create/update
- Orphan cleanup: Framework delete cascades to chunks
- **UNKNOWN:** Actual embedding counts (database query restricted)

---

## 6. ISSUES & GAPS

### Critical Issues

1. **Category Mismatch:**
   - UI filter pills: `"All", "Copywriting", "Email", "Ads", "Funnel", "Landing Page", "Social"`
   - Database values: `"copywriting", "email", "ads", "funnel", "landing", "social", "persuasion", "web", "content", "sales"`
   - Result: Frameworks with `persuasion`, `web`, `content`, `sales` categories never appear in filtered views

2. **Type Column Not Exposed in UI:**
   - `marketing_frameworks.type` distinguishes content-types from writing-frameworks
   - UI doesn't show or allow editing this field
   - All new frameworks created via UI default to `'writing-framework'`
   - Users cannot create content-types through the UI

3. **Duplicate Code:**
   - `lib/ai/rag.ts::addFramework()` duplicates functionality of `app/actions/frameworks.ts::createFramework()`
   - Different implementations could cause inconsistencies
   - `addFramework()` uses `is_public` parameter that doesn't exist in schema

### Missing Features

| Feature | Why Needed |
|---------|------------|
| Import/Export | "Import" button exists but does nothing; users can't bulk import frameworks |
| Content Type Creation UI | Only writing-frameworks can be created; content-types require seeding |
| Type Filter in Library | Can't filter by content-type vs writing-framework |
| Embedding Status Display | No indication if embeddings are current or failed |
| Embedding Regeneration | No manual trigger to regenerate embeddings |
| Framework Preview | Can't preview how framework will appear in AI context |
| Version History | No tracking of content changes |
| Usage Analytics | No tracking of which frameworks are used most |

### Data Quality Issues

1. **Category Inconsistency:**
   - Mix of casing: `"copywriting"` vs user-entered values
   - No validation against allowed categories
   - Edit form shows duplicate category options (from DB + hardcoded)

2. **Missing deleted_at Migration:**
   - TypeScript types show `deleted_at` on `marketing_frameworks`
   - No migration explicitly adds this column
   - **Risk:** Column may exist in prod but not in local dev, or vice versa

3. **Embedding Failures Silent:**
   - Embedding generation is fire-and-forget
   - Errors logged but no user notification
   - No retry mechanism

---

## 7. RECOMMENDATIONS

### Schema Changes Needed

1. **Add explicit deleted_at migration for marketing_frameworks:**
```sql
ALTER TABLE marketing_frameworks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_frameworks_deleted_at ON marketing_frameworks(deleted_at);
```

2. **Add category constraint (optional):**
```sql
ALTER TABLE marketing_frameworks 
ADD CONSTRAINT marketing_frameworks_category_check 
CHECK (category IN ('copywriting', 'email', 'ads', 'funnel', 'landing', 'social', 'persuasion', 'web', 'content', 'sales'));
```

3. **Add embedding_status column:**
```sql
ALTER TABLE marketing_frameworks 
ADD COLUMN embedding_status TEXT DEFAULT 'pending' 
CHECK (embedding_status IN ('pending', 'generating', 'complete', 'failed'));
```

### Content Improvements Needed

| Framework | Improvement |
|-----------|-------------|
| Social Media Post | Split into Twitter, LinkedIn, TikTok specific types |
| FAB Framework | Add industry-specific examples |
| All Content Types | Add example outputs in each framework |

### UI Improvements Needed

| Component | Improvement |
|-----------|-------------|
| `FrameworkLibrary` | Fix category filter to match database values; add "All" fallback |
| `FrameworkLibrary` | Add type filter (Content Types / Writing Frameworks / All) |
| `NewFrameworkDialog` | Add type selector (content-type / writing-framework) |
| `NewFrameworkDialog` | Dynamic category dropdown from database |
| `FrameworkEditForm` | Show type field (read-only or editable) |
| `FrameworkEditForm` | Remove duplicate hardcoded categories |
| `FrameworkCard` | Show embedding status indicator |
| `FrameworkLibrary` | Implement Import functionality |
| General | Add toast notifications for embedding success/failure |

### Code Cleanup

1. **Remove duplicate `addFramework()` from `lib/ai/rag.ts`**
2. **Add `is('deleted_at', null)` to RAG queries** (currently missing, could return deleted frameworks)
3. **Standardize category values** - create constants file

---

## 8. FILES REFERENCE

### Core Framework Files
```
app/actions/frameworks.ts          - Server actions (CRUD, embeddings)
app/api/frameworks/route.ts        - API route for fetching frameworks
lib/ai/rag.ts                      - RAG search functions
lib/ai/embeddings.ts               - OpenAI embedding generation
```

### UI Components
```
app/dashboard/frameworks/page.tsx              - Library page wrapper
app/dashboard/frameworks/[id]/page.tsx         - Edit page wrapper
app/dashboard/frameworks/[id]/edit-form.tsx    - Edit form component
app/dashboard/frameworks/[id]/not-found.tsx    - 404 component
components/frameworks/framework-library.tsx    - Main library grid
components/frameworks/framework-card.tsx       - Individual card
components/frameworks/new-framework-dialog.tsx - Create modal
```

### AI Chat Integration
```
app/dashboard/ai/chat/page.tsx                    - Chat page (fetches writing-frameworks)
app/actions/chat.ts                               - buildSystemPrompt(), buildContextFromMentions()
components/ai-chat/chat-input.tsx                 - Chat input with @mention
components/ai-chat/context-picker-modal.tsx       - Context picker (includes frameworks)
components/ai-chat/inline-mention-popup.tsx       - Inline @mention popup
```

### Database Schema
```
supabase/migrations/20251222000001_add_ai_infrastructure.sql  - Creates marketing_frameworks, framework_chunks
supabase/migrations/20260110000002_add_framework_type.sql     - Adds type column
supabase/migrations/20260107000001_drop_orphaned_framework_tables.sql - Cleanup old tables
types/database.ts                                             - TypeScript types
```

### Scripts & Seeding
```
scripts/seed-frameworks.ts         - Seeds content types and writing frameworks
_sql/schema/main_schema.sql        - Reference schema (older version)
```

---

## APPENDIX: Type Definitions

### Framework Interface (from server actions)
```typescript
interface Framework {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Database Type (from types/database.ts)
```typescript
marketing_frameworks: {
  Row: {
    category: string | null
    content: string
    created_at: string | null
    deleted_at: string | null
    description: string | null
    id: string
    is_active: boolean | null
    name: string
    type: string
    updated_at: string | null
    user_id: string
  }
}
```

### Framework Chunk Type
```typescript
framework_chunks: {
  Row: {
    chunk_index: number
    content: string
    created_at: string | null
    embedding: string | null  // Stored as string representation of vector
    framework_id: string
    id: number
  }
}
```

---

**END OF AUDIT REPORT**
