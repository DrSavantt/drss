# @Mention System Architecture Audit

**Audit Date:** January 16, 2026  
**Scope:** Complete documentation of the AI Chat @mention system

---

## PART 1: FILE INVENTORY

### Core Mention Files (AI Chat)

| File Path | Role | Mention-Related Code |
|-----------|------|---------------------|
| `components/ai-chat/mention-types.ts` | Type definitions | `ChatMentionType`, `ChatMention`, `JournalEntrySummary` |
| `components/ai-chat/mention-popup.tsx` | Autocomplete popup UI | Filtering logic, keyboard navigation, section rendering |
| `components/ai-chat/chat-input.tsx` | Text input with @ detection | Trigger detection, state management, pill rendering |
| `components/ai-chat/chat-interface.tsx` | Parent container | Props drilling, message sending, conversation management |
| `app/dashboard/ai/chat/page.tsx` | Data fetching | Server-side data loading, prop transformation |
| `app/actions/chat.ts` | Server actions | `sendMessage` with mentions, conversation creation |

### Utility Files

| File Path | Role | Mention-Related Code |
|-----------|------|---------------------|
| `lib/utils/mentions.ts` | Parsing & highlighting | `parseMentions()`, `highlightMentions()` |
| `lib/hooks/use-mention-names.ts` | Name resolution | UUID to name lookup for display |

### Other Mention Components (Not AI Chat)

| File Path | Role | Notes |
|-----------|------|-------|
| `components/mention-autocomplete.tsx` | Generic autocomplete | Simpler version for other contexts |
| `components/mention-modal.tsx` | Modal-based picker | Alternative UI with tabs |
| `components/editor/mention-autocomplete.tsx` | Editor mentions | For TipTap editor integration |
| `lib/editor/ai-commands.ts` | Editor commands | `MENTION_OPTIONS` for editor |
| `lib/editor/types.ts` | Editor types | `MentionOption` interface |

---

## PART 2: DATA TYPES & INTERFACES

### Primary Types (mention-types.ts)

```typescript
// File: components/ai-chat/mention-types.ts

export type ChatMentionType = "client" | "content-type" | "writing-framework" | "project" | "capture" | "content"

export type JournalEntrySummary = {
  id: string
  title: string | null
  content: string
  tags: string[] | null
  created_at: string
}

export type ChatMention = {
  type: ChatMentionType
  name: string
  id: string
  description?: string | null
  clientId?: string | null
  clientName?: string | null
  entry?: JournalEntrySummary
  content?: string | null
  contentType?: string | null
}
```

### MentionPopup Internal Types

```typescript
// File: components/ai-chat/mention-popup.tsx (lines 8-34)

type MentionType = "client" | "content-type" | "writing-framework" | "project" | "capture" | "content"

interface MentionPopupProps {
  query: string
  scope: "all" | "project" | "capture" | "content"
  position: { top: number; left: number }
  onSelect: (mention: ChatMention) => void
  onClose: () => void
  clients: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string; category: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
  projects: Array<{ id: string; name: string; description: string | null; clientId: string | null; clientName: string | null }>
  contentAssets: Array<{ id: string; title: string; content: string | null; contentType: string | null; clientId: string | null; clientName: string | null }>
  journalEntries: JournalEntrySummary[]
}

type MentionItem = {
  type: MentionType
  id: string
  name: string
  description?: string | null
  clientId?: string | null
  clientName?: string | null
  entry?: JournalEntrySummary
  content?: string | null
  contentType?: string | null
}
```

### ChatInput Props

```typescript
// File: components/ai-chat/chat-input.tsx (lines 12-28)

interface ChatInputProps {
  onSend: (content: string, mentions: ChatMention[], useExtendedThinking: boolean) => void
  disabled?: boolean
  clients: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string; category: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
  projects?: Array<{ id: string; name: string; description: string | null; clientId: string | null; clientName: string | null }>
  contentAssets?: Array<{
    id: string
    title: string
    content: string | null
    contentType: string | null
    clientId: string | null
    clientName: string | null
  }>
  journalEntries?: JournalEntrySummary[]
}
```

### Server Action Types

```typescript
// File: app/actions/chat.ts (lines 21-37)

export interface SendMessageInput {
  conversationId: string;
  content: string;
  modelId?: string;
  useExtendedThinking?: boolean;
  mentions?: Array<{
    type: string;
    name: string;
    id: string;
    description?: string | null;
    clientId?: string | null;
    clientName?: string | null;
    entry?: Json;
    content?: string | null;
    contentType?: string | null;
  }>;
}
```

---

## PART 3: STATE MANAGEMENT

### ChatInput State Variables

| Name | Type | Initial Value | File:Line | Updates | Consumers |
|------|------|---------------|-----------|---------|-----------|
| `value` | `string` | `""` | chat-input.tsx:40 | `handleChange`, `handleMentionSelect`, `handleSubmit` | Textarea, submit logic |
| `mentions` | `ChatMention[]` | `[]` | chat-input.tsx:41 | `handleMentionSelect`, `removeMention`, `handleSubmit` | Pills display, onSend |
| `showMentionPopup` | `boolean` | `false` | chat-input.tsx:42 | `handleChange`, `handleMentionSelect`, `handleKeyDown` | MentionPopup visibility |
| `useExtendedThinking` | `boolean` | `false` | chat-input.tsx:43 | Toggle button | onSend |
| `mentionQuery` | `string` | `""` | chat-input.tsx:44 | `handleChange` | MentionPopup filtering |
| `mentionScope` | `"all" \| "project" \| "capture" \| "content"` | `"all"` | chat-input.tsx:45 | `handleChange` | MentionPopup section filtering |
| `mentionPosition` | `{ top: number; left: number }` | `{ top: 0, left: 0 }` | chat-input.tsx:46 | `handleChange` | MentionPopup positioning |

### MentionPopup State Variables

| Name | Type | Initial Value | File:Line | Updates | Consumers |
|------|------|---------------|-----------|---------|-----------|
| `selectedIndex` | `number` | `0` | mention-popup.tsx:49 | Arrow keys, query change effect | Highlighting, Enter selection |

### ChatInterface State Variables (Parent)

| Name | Type | Initial Value | File:Line | Role in Mentions |
|------|------|---------------|-----------|-----------------|
| `messages` | `ConversationMessage[]` | `[]` | chat-interface.tsx:50 | Stores sent messages with mentions |
| `isGenerating` | `boolean` | `false` | chat-interface.tsx:51 | Disables input during generation |

---

## PART 4: COMPONENT HIERARCHY

```
ChatInterface (chat-interface.tsx)
├── Props: clients, contentTypes, writingFrameworks, projects, contentAssets, journalEntries, models, initialConversations
├── State: conversations, currentConversationId, messages, isGenerating
│
├── ChatSidebar
│   └── Conversation list management
│
├── Header
│   └── Model selector dropdown
│
├── MessageThread
│   └── Displays messages (includes mentions in message content)
│
└── ChatInput (chat-input.tsx)
    ├── Props: onSend, disabled, clients, contentTypes, writingFrameworks, projects, contentAssets, journalEntries
    ├── State: value, mentions, showMentionPopup, mentionQuery, mentionScope, mentionPosition
    │
    ├── Mention Pills Display
    │   └── Renders selected mentions as removable pills
    │
    ├── Textarea
    │   └── User input with @ detection
    │
    ├── Extended Thinking Toggle Button
    │
    ├── Submit Button
    │
    └── MentionPopup (mention-popup.tsx) [conditional]
        ├── Props: query, scope, position, onSelect, onClose, clients, contentTypes, writingFrameworks, projects, contentAssets, journalEntries
        ├── State: selectedIndex
        │
        ├── Clients Section (scope === "all")
        ├── Projects Section (scope === "all" || scope === "project")
        ├── Captures Section (scope === "all" || scope === "capture")
        ├── Content Section (scope === "all" || scope === "content")
        ├── Content Types Section (scope === "all")
        └── Writing Frameworks Section (scope === "all")
```

---

## PART 5: DATA SOURCES

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    app/dashboard/ai/chat/page.tsx                    │
│                         (Server Component)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Supabase Queries (parallel):                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ 1. clients         → SELECT id, name FROM clients           │   │
│   │ 2. contentTypes    → SELECT * FROM marketing_frameworks     │   │
│   │                       WHERE type = 'content-type'           │   │
│   │ 3. writingFrameworks → SELECT * FROM marketing_frameworks   │   │
│   │                          WHERE type = 'writing-framework'   │   │
│   │ 4. models          → SELECT * FROM ai_models WHERE active   │   │
│   │ 5. conversations   → listConversations({ status: 'active' })│   │
│   │ 6. projects        → getProjects()                          │   │
│   │ 7. journalEntries  → getJournalEntries()                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   Content Assets (per client):                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ For each client:                                             │   │
│   │   await getContentAssets(client.id)                          │   │
│   │ Then flatten with clientId/clientName attached               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ChatInterface                                 │
│                       (Client Component)                             │
├─────────────────────────────────────────────────────────────────────┤
│   Receives all data as props                                         │
│   Passes down to ChatInput                                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           ChatInput                                  │
├─────────────────────────────────────────────────────────────────────┤
│   Receives: clients, contentTypes, writingFrameworks,                │
│             projects, contentAssets, journalEntries                  │
│   Passes all to MentionPopup when visible                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MentionPopup                                 │
├─────────────────────────────────────────────────────────────────────┤
│   Receives all data sources directly as props                        │
│   Filters based on query and scope                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Source Details

| Mention Type | Server Action/Query | Location Fetched | Prop Drilling Path |
|--------------|---------------------|------------------|-------------------|
| **Clients** | `supabase.from('clients').select('id, name')` | page.tsx:75-79 | page → ChatInterface → ChatInput → MentionPopup |
| **Projects** | `getProjects()` from `app/actions/projects.ts` | page.tsx:96 | page → ChatInterface → ChatInput → MentionPopup |
| **Content Assets** | `getContentAssets(clientId)` for each client | page.tsx:101-118 | page → ChatInterface → ChatInput → MentionPopup |
| **Captures (Journal)** | `getJournalEntries()` from `app/actions/journal.ts` | page.tsx:97 | page → ChatInterface → ChatInput → MentionPopup |
| **Content Types** | `supabase.from('marketing_frameworks').select().eq('type', 'content-type')` | page.tsx:81-84 | page → ChatInterface → ChatInput → MentionPopup |
| **Writing Frameworks** | `supabase.from('marketing_frameworks').select().eq('type', 'writing-framework')` | page.tsx:85-89 | page → ChatInterface → ChatInput → MentionPopup |

---

## PART 6: INPUT HANDLING FLOW

### Complete Keystroke-to-Render Flow

```
User types in textarea
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 1. onChange fires                                              │
│    handleChange(e) in chat-input.tsx:61                        │
│    const newValue = e.target.value                             │
│    setValue(newValue)                                          │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. @ detection                                                 │
│    const lastAtIndex = newValue.lastIndexOf("@")               │
│    if (lastAtIndex !== -1) { ... }                             │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. Extract text after @                                        │
│    const textAfterAt = newValue.slice(lastAtIndex + 1)         │
│    const hasSpaceAfter = textAfterAt.includes(" ")             │
│                                                                │
│    // Only show popup if:                                      │
│    // - No space after @ trigger                               │
│    // - Query is <= 40 characters                              │
│    if (!hasSpaceAfter && textAfterAt.length <= 40) {           │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. Scope detection                                             │
│    const lowerText = textAfterAt.toLowerCase()                 │
│                                                                │
│    if (lowerText.startsWith("capture:"))                       │
│      → scope = "capture", query = text after "capture:"        │
│    else if (lowerText.startsWith("content:"))                  │
│      → scope = "content", query = text after "content:"        │
│    else if (lowerText.startsWith("project:"))                  │
│      → scope = "project", query = text after "project:"        │
│    else                                                        │
│      → scope = "all", query = textAfterAt                      │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 5. Set state and show popup                                    │
│    setMentionScope(newScope)                                   │
│    setMentionQuery(newQuery)                                   │
│    setShowMentionPopup(true)                                   │
│                                                                │
│    // Calculate position                                       │
│    const rect = textareaRef.current.getBoundingClientRect()    │
│    setMentionPosition({ top: rect.top - 8, left: rect.left + 16 })│
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 6. MentionPopup renders (mention-popup.tsx)                    │
│    - Receives query, scope, all data arrays                    │
│    - Filters each section based on scope and query             │
│    - Builds flat allItems array for keyboard navigation        │
│    - Renders sections with items                               │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 7. User selects item (click or Enter)                          │
│    onSelect callback fires                                     │
│    → handleMentionSelect(mention) in chat-input.tsx:147        │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 8. Pill created                                                │
│    // Remove @query from input value                           │
│    const lastAtIndex = value.lastIndexOf("@")                  │
│    const newValue = value.slice(0, lastAtIndex)                │
│    setValue(newValue)                                          │
│                                                                │
│    // Add mention to array                                     │
│    setMentions((prev) => [...prev, mention])                   │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 9. Popup closes                                                │
│    setShowMentionPopup(false)                                  │
│    textareaRef.current?.focus()                                │
└───────────────────────────────────────────────────────────────┘
```

---

## PART 7: TRIGGER DETECTION

### Complete Trigger Detection Code

```typescript
// File: components/ai-chat/chat-input.tsx (lines 61-145)

const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newValue = e.target.value
  setValue(newValue)

  // Check for @ mentions
  const lastAtIndex = newValue.lastIndexOf("@")
  
  console.log("[SCOPE DEBUG] ==================== handleChange triggered ====================")
  console.log("[SCOPE DEBUG] FULL newValue:", newValue)
  console.log("[SCOPE DEBUG] @ index:", lastAtIndex)
  console.log("[SCOPE DEBUG] textAfterAt should be:", lastAtIndex !== -1 ? newValue.slice(lastAtIndex + 1) : "N/A")
  
  if (lastAtIndex !== -1) {
    const textAfterAt = newValue.slice(lastAtIndex + 1)
    const hasSpaceAfter = textAfterAt.includes(" ")
    
    console.log("[SCOPE DEBUG] textAfterAt:", textAfterAt)
    console.log("[SCOPE DEBUG] hasSpaceAfter:", hasSpaceAfter)
    console.log("[SCOPE DEBUG] textAfterAt.length:", textAfterAt.length)

    if (!hasSpaceAfter && textAfterAt.length <= 40) {
      const lowerText = textAfterAt.toLowerCase()
      let newScope: "all" | "project" | "capture" | "content" = "all"
      let newQuery = textAfterAt
      
      console.log("[SCOPE DEBUG] textAfterAt:", textAfterAt)
      console.log("[SCOPE DEBUG] lowerText:", lowerText)
      
      if (lowerText.startsWith("capture:")) {
        newScope = "capture"
        newQuery = textAfterAt.slice("capture:".length)
        console.log("[SCOPE DEBUG] ✓ CAPTURE scope detected, query:", newQuery)
      } else if (lowerText.startsWith("content:")) {
        newScope = "content"
        newQuery = textAfterAt.slice("content:".length)
        console.log("[SCOPE DEBUG] ✓ CONTENT scope detected, query:", newQuery)
      } else if (lowerText.startsWith("project:")) {
        newScope = "project"
        newQuery = textAfterAt.slice("project:".length)
        console.log("[SCOPE DEBUG] ✓ PROJECT scope detected, query:", newQuery)
      } else {
        console.log("[SCOPE DEBUG] → ALL scope (default)")
      }
      // Removed overly aggressive @p shortcut - was intercepting normal typing
      
      console.log("[SCOPE DEBUG] Setting mentionScope to:", newScope)
      console.log("[SCOPE DEBUG] Setting mentionQuery to:", newQuery)
      console.log("[SCOPE DEBUG] ========================================")
      
      setMentionScope(newScope)
      setMentionQuery(newQuery)
      
      // DEBUG: Log mention trigger detection
      console.log("[ChatInput] Mention trigger:", { 
        inputValue: newValue, 
        textAfterAt,
        detectedScope: newScope, 
        query: newQuery,
        dataAvailable: {
          clients: clients.length,
          projects: projects.length,
          contentAssets: contentAssets.length,
          journalEntries: journalEntries.length,
          contentTypes: contentTypes.length,
          writingFrameworks: writingFrameworks.length,
        }
      })
      
      setShowMentionPopup(true)

      // Calculate popup position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect()
        setMentionPosition({
          top: rect.top - 8,
          left: rect.left + 16,
        })
      }
    } else {
      setShowMentionPopup(false)
    }
  } else {
    setShowMentionPopup(false)
  }
}
```

### Trigger Rules Summary

| Trigger | Scope | Query |
|---------|-------|-------|
| `@` | `"all"` | Everything after @ |
| `@capture:` | `"capture"` | Everything after `capture:` |
| `@content:` | `"content"` | Everything after `content:` |
| `@project:` | `"project"` | Everything after `project:` |
| `@client:` | **NOT IMPLEMENTED** | Would default to `"all"` |

### Popup Close Conditions

1. User types a **space** after the @ trigger
2. Query exceeds **40 characters**
3. User removes all @ symbols from input
4. User presses **Escape** key
5. User **clicks outside** the popup
6. User **selects an item**

---

## PART 8: POPUP RENDERING

### How MentionPopup Decides What to Show

```typescript
// File: components/ai-chat/mention-popup.tsx (lines 96-134)

// Filter items based on query and scope
// - "all" scope: show everything (clients, projects, captures, content, content types, frameworks)
// - "project" scope: show only projects (triggered by @project:)
// - "content" scope: show only content assets (triggered by @content:)
// - "capture" scope: show only journal captures (triggered by @capture:)
const lowerQuery = query.toLowerCase()

const filteredClients = scope === "all"
  ? clients.filter((c) => c.name.toLowerCase().includes(lowerQuery))
  : []

const filteredContentAssets = scope === "all" || scope === "content"
  ? contentAssets.filter((asset) => {
      const haystack = `${asset.title} ${asset.contentType ?? ""} ${asset.clientName ?? ""}`.toLowerCase()
      return haystack.includes(lowerQuery)
    })
  : []

const filteredContentTypes = scope === "all"
  ? contentTypes.filter((ct) => ct.name.toLowerCase().includes(lowerQuery))
  : []

const filteredFrameworks = scope === "all"
  ? writingFrameworks.filter((f) => f.name.toLowerCase().includes(lowerQuery))
  : []

const filteredProjects = scope === "all" || scope === "project"
  ? projects.filter((p) => {
      const haystack = `${p.name} ${p.clientName ?? ""}`.toLowerCase()
      return haystack.includes(lowerQuery)
    })
  : []

const filteredCaptures = scope === "all" || scope === "capture"
  ? journalEntries.filter((entry) => {
      const tagsText = entry.tags?.join(" ") || ""
      const titleText = entry.title || ""
      return (
        titleText.toLowerCase().includes(lowerQuery)
        || entry.content.toLowerCase().includes(lowerQuery)
        || tagsText.toLowerCase().includes(lowerQuery)
      )
    })
  : []
```

### Section Visibility Logic

| Section | Shows When |
|---------|-----------|
| Clients | `scope === "all"` AND `filteredClients.length > 0` |
| Projects | `(scope === "all" OR scope === "project")` AND `filteredProjects.length > 0` |
| Captures | `(scope === "all" OR scope === "capture")` AND `filteredCaptures.length > 0` |
| Content | `(scope === "all" OR scope === "content")` AND `filteredContentAssets.length > 0` |
| Content Types | `scope === "all"` AND `filteredContentTypes.length > 0` |
| Writing Frameworks | `scope === "all"` AND `filteredFrameworks.length > 0` |

### Empty State Handling

```typescript
// File: mention-popup.tsx (lines 279-292)

if (allItems.length === 0) {
  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg"
      style={{
        bottom: `calc(100vh - ${position.top}px)`,
        left: position.left,
      }}
    >
      <p className="text-sm text-muted-foreground">No results found</p>
    </div>
  )
}
```

---

## PART 9: SELECTION HANDLING

### Selection Function

```typescript
// File: components/ai-chat/chat-input.tsx (lines 147-157)

const handleMentionSelect = (mention: ChatMention) => {
  // Remove the @query from the value
  const lastAtIndex = value.lastIndexOf("@")
  const newValue = value.slice(0, lastAtIndex)
  setValue(newValue)

  // Add the mention
  setMentions((prev) => [...prev, mention])
  setShowMentionPopup(false)
  textareaRef.current?.focus()
}
```

### Selected Item Data Structure

When user clicks an item, the `onSelect` callback receives a `ChatMention` object:

```typescript
// Example for client selection (mention-popup.tsx:329)
{
  type: "client",
  name: client.name,
  id: client.id
}

// Example for project selection (mention-popup.tsx:360-367)
{
  type: "project",
  name: project.name,
  id: project.id,
  description: project.description,
  clientId: project.clientId,
  clientName: project.clientName
}

// Example for capture selection (mention-popup.tsx:402-408)
{
  type: "capture",
  name: title, // derived from entry.title or content snippet
  id: entry.id,
  entry: entry // full JournalEntrySummary object
}

// Example for content selection (mention-popup.tsx:452-459)
{
  type: "content",
  name: asset.title,
  id: asset.id,
  content: asset.content,
  contentType: asset.contentType,
  clientId: asset.clientId,
  clientName: asset.clientName
}
```

---

## PART 10: PILL MANAGEMENT

### How Pills Are Stored

```typescript
// File: chat-input.tsx:41
const [mentions, setMentions] = useState<ChatMention[]>([])

// Array of ChatMention objects, each containing:
// - type: ChatMentionType
// - name: string (display name)
// - id: string (database ID)
// - Optional: description, clientId, clientName, entry, content, contentType
```

### How Pills Are Rendered

```typescript
// File: components/ai-chat/chat-input.tsx (lines 216-234)

{/* Mention Pills */}
{mentions.length > 0 && (
  <div className="mb-2 flex flex-wrap gap-2">
    {mentions.map((mention) => (
      <span
        key={mention.id}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
          getMentionColor(mention.type),
        )}
      >
        {getMentionLabel(mention)}
        <button onClick={() => removeMention(mention.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-black/10">
          <X className="h-3 w-3" />
        </button>
      </span>
    ))}
  </div>
)}
```

### Pill Color Logic

```typescript
// File: chat-input.tsx (lines 184-199)

const getMentionColor = (type: ChatMentionType) => {
  switch (type) {
    case "client":
      return "bg-primary/10 text-primary"
    case "content-type":
      return "bg-info/10 text-info"
    case "writing-framework":
      return "bg-warning/10 text-warning"
    case "project":
      return "bg-secondary/20 text-secondary-foreground"
    case "capture":
      return "bg-emerald-500/10 text-emerald-600"
    case "content":
      return "bg-amber-500/10 text-amber-700"
  }
}
```

### Pill Label Logic

```typescript
// File: chat-input.tsx (lines 201-212)

const getMentionLabel = (mention: ChatMention) => {
  if (mention.type === "project" && mention.clientName) {
    return `@${mention.name} · ${mention.clientName}`
  }
  if (mention.type === "capture") {
    return `@capture: ${mention.name}`
  }
  if (mention.type === "content" && mention.contentType) {
    return `@${mention.name} · ${mention.contentType}`
  }
  return `@${mention.name}`
}
```

### How Pills Are Removed

```typescript
// File: chat-input.tsx (lines 159-161)

const removeMention = (id: string) => {
  setMentions((prev) => prev.filter((m) => m.id !== id))
}
```

### How Pills Affect Message Sending

```typescript
// File: chat-input.tsx (lines 163-172)

const handleSubmit = () => {
  if (!value.trim() && mentions.length === 0) return
  onSend(value.trim(), mentions, useExtendedThinking)
  setValue("")
  setMentions([])
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto"
  }
}
```

---

## PART 11: SERVER INTEGRATION

### Message Send Flow with Mentions

```
User clicks Send
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 1. ChatInput.handleSubmit()                                    │
│    onSend(value.trim(), mentions, useExtendedThinking)         │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. ChatInterface.handleSendMessage()                           │
│    (chat-interface.tsx:90-193)                                 │
│                                                                │
│    // Extract mentions for conversation creation               │
│    const clientMention = mentions.find(m => m.type === "client")│
│    const contentMention = mentions.find(m => m.type === "content")│
│    const projectMention = mentions.find(m => m.type === "project")│
│    const contentTypeMention = mentions.find(m => m.type === "content-type")│
│    const writingFrameworkMentions = mentions.filter(m => m.type === "writing-framework")│
│                                                                │
│    // Resolve client ID from mentions                          │
│    const resolvedClientId = clientMention?.id                  │
│                          || contentMention?.clientId           │
│                          || projectMention?.clientId           │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. If no conversation exists, create one:                      │
│    createConversation({                                        │
│      clientId: resolvedClientId,                               │
│      contentTypeId: contentTypeMention?.id,                    │
│      writingFrameworkIds: writingFrameworkMentions.map(m => m.id),│
│      title: content.slice(0, 50)                               │
│    })                                                          │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. Send message with mentions:                                 │
│    sendMessage({                                               │
│      conversationId,                                           │
│      content,                                                  │
│      modelId: selectedModel.model_name,                        │
│      useExtendedThinking,                                      │
│      mentions  // ← Full mentions array passed                 │
│    })                                                          │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 5. Server Action: sendMessage() in app/actions/chat.ts         │
│    (lines 747-939)                                             │
│                                                                │
│    // Save user message with mentions                          │
│    await supabase.from('ai_executions').insert({               │
│      user_id: user.id,                                         │
│      conversation_id: conversation.id,                         │
│      message_role: 'user',                                     │
│      input_data: {                                             │
│        content: data.content,                                  │
│        mentions: data.mentions || []  // ← Stored in JSON      │
│      }                                                         │
│    })                                                          │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 6. AI Orchestrator executes with conversation context          │
│    (System prompt built from clientId, contentTypeId, etc.)    │
└───────────────────────────────────────────────────────────────┘
```

### Database Storage

Mentions are stored in the `ai_executions` table:

```sql
-- input_data column (JSONB)
{
  "content": "Write me a blog post",
  "mentions": [
    {
      "type": "client",
      "name": "Acme Corp",
      "id": "uuid-here"
    },
    {
      "type": "writing-framework",
      "name": "AIDA",
      "id": "uuid-here"
    }
  ]
}
```

---

## PART 12: KEYBOARD NAVIGATION

### MentionPopup Keyboard Handler

```typescript
// File: components/ai-chat/mention-popup.tsx (lines 234-252)

// Keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && allItems.length > 0) {
      e.preventDefault()
      onSelect(allItems[selectedIndex])
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [selectedIndex, allItems, onSelect, onClose])
```

### ChatInput Keyboard Handler

```typescript
// File: components/ai-chat/chat-input.tsx (lines 174-182)

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
  if (e.key === "Escape") {
    setShowMentionPopup(false)
  }
}
```

### Keyboard Shortcuts Summary

| Key | Action | Handler Location |
|-----|--------|------------------|
| `↓` (ArrowDown) | Move selection down | mention-popup.tsx:236-238 |
| `↑` (ArrowUp) | Move selection up | mention-popup.tsx:239-241 |
| `Enter` | Select highlighted item (when popup open) | mention-popup.tsx:242-244 |
| `Enter` | Submit message (when popup closed) | chat-input.tsx:175-177 |
| `Escape` | Close popup | Both files |
| `Shift+Enter` | New line (does not submit) | chat-input.tsx:175 |
| `Tab` | **Not implemented** | - |

---

## PART 13: EXISTING MENTION TYPES

### Clients

| Property | Value |
|----------|-------|
| **Trigger** | `@` (shows in "all" scope) |
| **Data Source** | `supabase.from('clients').select('id, name')` |
| **Filter Logic** | `clients.filter(c => c.name.toLowerCase().includes(lowerQuery))` |
| **Selection Payload** | `{ type: "client", name, id }` |
| **Working** | ✅ YES |

### Projects

| Property | Value |
|----------|-------|
| **Trigger** | `@` (all scope) or `@project:` (project scope) |
| **Data Source** | `getProjects()` server action |
| **Filter Logic** | Searches `name` and `clientName` |
| **Selection Payload** | `{ type: "project", name, id, description, clientId, clientName }` |
| **Working** | ✅ YES |

### Content Assets

| Property | Value |
|----------|-------|
| **Trigger** | `@` (all scope) or `@content:` (content scope) |
| **Data Source** | `getContentAssets(clientId)` for each client |
| **Filter Logic** | Searches `title`, `contentType`, `clientName` |
| **Selection Payload** | `{ type: "content", name: title, id, content, contentType, clientId, clientName }` |
| **Working** | ✅ YES |

### Captures (Journal)

| Property | Value |
|----------|-------|
| **Trigger** | `@` (all scope) or `@capture:` (capture scope) |
| **Data Source** | `getJournalEntries()` server action |
| **Filter Logic** | Searches `title`, `content`, and `tags` |
| **Selection Payload** | `{ type: "capture", name, id, entry: JournalEntrySummary }` |
| **Working** | ✅ YES |

### Content Types

| Property | Value |
|----------|-------|
| **Trigger** | `@` (shows in "all" scope only) |
| **Data Source** | `marketing_frameworks` where `type = 'content-type'` |
| **Filter Logic** | `contentTypes.filter(ct => ct.name.toLowerCase().includes(lowerQuery))` |
| **Selection Payload** | `{ type: "content-type", name, id }` |
| **Working** | ✅ YES |
| **Note** | NO dedicated `@contenttype:` trigger |

### Writing Frameworks

| Property | Value |
|----------|-------|
| **Trigger** | `@` (shows in "all" scope only) |
| **Data Source** | `marketing_frameworks` where `type = 'writing-framework'` |
| **Filter Logic** | `writingFrameworks.filter(f => f.name.toLowerCase().includes(lowerQuery))` |
| **Selection Payload** | `{ type: "writing-framework", name, id }` |
| **Working** | ✅ YES |
| **Note** | NO dedicated `@framework:` trigger |

---

## PART 14: CSS/STYLING

### Popup Positioning

```typescript
// File: mention-popup.tsx (lines 298-307)

<div
  ref={popupRef}
  className="fixed z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
  style={{
    bottom: `calc(100vh - ${position.top}px)`,  // Positions ABOVE textarea
    left: position.left,
    maxHeight: "300px",
  }}
>
```

**Key positioning notes:**
- Uses `fixed` positioning with `z-50`
- Appears **above** the textarea (using `bottom` calculation)
- Max height of 300px with scroll

### Pill Styling

```typescript
// Base classes (chat-input.tsx:222-225)
"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"

// Dynamic colors per type (getMentionColor function)
case "client": "bg-primary/10 text-primary"
case "content-type": "bg-info/10 text-info"
case "writing-framework": "bg-warning/10 text-warning"
case "project": "bg-secondary/20 text-secondary-foreground"
case "capture": "bg-emerald-500/10 text-emerald-600"
case "content": "bg-amber-500/10 text-amber-700"
```

### Selected Item Highlighting

```typescript
// File: mention-popup.tsx (lines 330-335)

className={cn(
  "flex w-full items-center px-3 py-1.5 text-sm transition-colors",
  isSelected
    ? "bg-accent text-accent-foreground"
    : "text-foreground hover:bg-accent/50"
)}
```

### Section Headers (Sticky)

```typescript
// File: mention-popup.tsx (lines 317-320)

<div className="sticky top-0 flex items-center gap-2 bg-popover px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/50">
  <Users className="h-3 w-3" />
  Clients
</div>
```

---

## PART 15: COMPLETE CODE DUMP

### File 1: mention-types.ts

```typescript
export type ChatMentionType = "client" | "content-type" | "writing-framework" | "project" | "capture" | "content"

export type JournalEntrySummary = {
  id: string
  title: string | null
  content: string
  tags: string[] | null
  created_at: string
}

export type ChatMention = {
  type: ChatMentionType
  name: string
  id: string
  description?: string | null
  clientId?: string | null
  clientName?: string | null
  entry?: JournalEntrySummary
  content?: string | null
  contentType?: string | null
}
```

### File 2: chat-input.tsx (Key Sections)

See full file at: `components/ai-chat/chat-input.tsx` (291 lines)

Key functions:
- `handleChange` (lines 61-145): @ detection and scope parsing
- `handleMentionSelect` (lines 147-157): Selection handling
- `removeMention` (lines 159-161): Pill removal
- `handleSubmit` (lines 163-172): Message submission
- `handleKeyDown` (lines 174-182): Keyboard shortcuts
- `getMentionColor` (lines 184-199): Pill colors
- `getMentionLabel` (lines 201-212): Pill display text

### File 3: mention-popup.tsx

See full file at: `components/ai-chat/mention-popup.tsx` (551 lines)

Key sections:
- Props interface (lines 10-22)
- Filtering logic (lines 96-134)
- Keyboard navigation (lines 234-252)
- Section rendering (lines 314-546)

---

## SYSTEM SUMMARY

The @mention system is a feature-complete autocomplete system for the AI Chat interface. When users type `@` in the chat input, it opens a popup showing clients, projects, content assets, journal captures, content types, and writing frameworks. Users can filter by typing after `@`, or use scoped triggers like `@capture:`, `@content:`, or `@project:` to show only specific sections. Selected items become pills above the input, which are passed to the server when sending messages. The server stores mentions in the `ai_executions` table's `input_data` JSON column and uses them to build context for AI responses (particularly client and framework mentions which affect the system prompt).

---

## KNOWN ISSUES

### 1. Missing Scoped Triggers
- **`@client:`** - Not implemented (would be useful for filtering to clients only)
- **`@framework:`** - Not implemented (content types and frameworks only show in "all" scope)
- **`@type:`** - Not implemented (for content types)

### 2. Scope Limitation
Content Types and Writing Frameworks **only appear in "all" scope**. There's no way to filter to just frameworks or content types.

### 3. Duplicate Mention IDs
Pills use `mention.id` as the key, but the same item could theoretically be mentioned twice. The `removeMention` function removes all mentions with matching ID.

### 4. Keyboard Navigation Across Sections
The flat `allItems` array works for navigation, but the order depends on filtering results. If a section becomes empty during typing, the selected index might point to a different item type.

### 5. Missing Tab Support
Tab key does nothing - could be used to auto-complete the first item.

### 6. No Mention Editing
Once a pill is created, it can only be removed. Users cannot edit the mention.

### 7. Debug Logging Left In
Multiple `console.log` statements for debugging are still in production code (chat-input.tsx and mention-popup.tsx).

### 8. Position Calculation
The popup position is calculated once when `@` is typed, but doesn't update if the textarea moves (e.g., during scroll or resize).

### 9. Journal Entry Title Fallback
If a journal entry has no title, it falls back to a content snippet. This could result in very long display names.

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MENTION SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │
│   │    clients      │  │    projects     │  │ content_assets  │                     │
│   │   (Supabase)    │  │  (Supabase)     │  │   (Supabase)    │                     │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                     │
│            │                    │                    │                               │
│   ┌────────┴────────┐  ┌────────┴────────┐  ┌───────┴────────┐                      │
│   │journal_entries  │  │marketing_       │  │  ai_executions │                      │
│   │   (Supabase)    │  │frameworks       │  │   (Supabase)   │                      │
│   │                 │  │(content-type &  │  │ stores mentions│                      │
│   │                 │  │writing-framework│  │   in JSON      │                      │
│   └─────────────────┘  └─────────────────┘  └────────────────┘                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Server Actions / Queries
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               SERVER LAYER (page.tsx)                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   app/dashboard/ai/chat/page.tsx                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  Parallel data fetching:                                                     │   │
│   │  - clients, contentTypes, writingFrameworks, models                          │   │
│   │  - conversations, projects, journalEntries                                   │   │
│   │  - contentAssets (per client)                                                │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Props
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               COMPONENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          ChatInterface                                       │   │
│   │   - Receives all data as props                                               │   │
│   │   - Manages conversations, messages, sending                                 │   │
│   │   - Calls sendMessage() server action                                        │   │
│   └───────────────────────────────────┬─────────────────────────────────────────┘   │
│                                       │                                              │
│                                       │ Props                                        │
│                                       ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                            ChatInput                                         │   │
│   │                                                                              │   │
│   │   State:                           Events:                                   │   │
│   │   ┌────────────────────────┐      ┌─────────────────────────────────────┐   │   │
│   │   │ value: string          │      │ onChange → handleChange()           │   │   │
│   │   │ mentions: ChatMention[]│      │ onKeyDown → handleKeyDown()         │   │   │
│   │   │ showMentionPopup: bool │      │ onSubmit → handleSubmit()           │   │   │
│   │   │ mentionQuery: string   │      │ onSelect → handleMentionSelect()    │   │   │
│   │   │ mentionScope: string   │      └─────────────────────────────────────┘   │   │
│   │   │ mentionPosition: {x,y} │                                                │   │
│   │   └────────────────────────┘                                                │   │
│   │                                                                              │   │
│   │   ┌────────────────────┐   ┌─────────────────────────────────────────────┐  │   │
│   │   │   Mention Pills    │   │              Textarea                       │  │   │
│   │   │   (when selected)  │   │   - Placeholder: "Message DRSS AI..."      │  │   │
│   │   │                    │   │   - @ detection triggers popup              │  │   │
│   │   │   [pill] [pill] [x]│   │                                             │  │   │
│   │   └────────────────────┘   └─────────────────────────────────────────────┘  │   │
│   │                                                                              │   │
│   └───────────────────────────────────┬─────────────────────────────────────────┘   │
│                                       │                                              │
│                                       │ Conditional render                           │
│                                       ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          MentionPopup                                        │   │
│   │                                                                              │   │
│   │   Props: query, scope, position, onSelect, onClose,                          │   │
│   │          clients, contentTypes, writingFrameworks,                           │   │
│   │          projects, contentAssets, journalEntries                             │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  Scope Logic:                                                        │   │   │
│   │   │                                                                      │   │   │
│   │   │  "all"     → Show all sections                                       │   │   │
│   │   │  "project" → Show only Projects section                              │   │   │
│   │   │  "capture" → Show only Captures section                              │   │   │
│   │   │  "content" → Show only Content section                               │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                              │   │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │   │
│   │   │  Clients  │ │ Projects  │ │ Captures  │ │  Content  │ │  Types &  │    │   │
│   │   │  section  │ │  section  │ │  section  │ │  section  │ │Frameworks │    │   │
│   │   │           │ │           │ │           │ │           │ │  sections │    │   │
│   │   │ [item 1]  │ │ [item 1]  │ │ [item 1]  │ │ [item 1]  │ │ [item 1]  │    │   │
│   │   │ [item 2]  │ │ [item 2]  │ │ [item 2]  │ │ [item 2]  │ │ [item 2]  │    │   │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  EVENT FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   User Types "@cap"                                                                  │
│        │                                                                             │
│        ▼                                                                             │
│   handleChange() detects "@"                                                         │
│        │                                                                             │
│        ▼                                                                             │
│   textAfterAt = "cap"                                                                │
│   No scope prefix found → scope = "all", query = "cap"                               │
│        │                                                                             │
│        ▼                                                                             │
│   showMentionPopup = true                                                            │
│        │                                                                             │
│        ▼                                                                             │
│   MentionPopup renders with all sections, filtered by "cap"                          │
│        │                                                                             │
│        ▼                                                                             │
│   "Captures" section likely shows matches                                            │
│        │                                                                             │
│        ▼                                                                             │
│   User presses ↓, then Enter to select                                               │
│        │                                                                             │
│        ▼                                                                             │
│   onSelect(captureItem) fires                                                        │
│        │                                                                             │
│        ▼                                                                             │
│   handleMentionSelect():                                                             │
│   - Removes "@cap" from input                                                        │
│   - Adds mention to pills array                                                      │
│   - Closes popup                                                                     │
│        │                                                                             │
│        ▼                                                                             │
│   Pill renders above textarea                                                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**End of Audit**
