# AI Chat System - Complete Technical Audit

> **Purpose**: This document is the "gold standard" reference for the AI Chat system. Use it to understand, debug, and replicate patterns in other systems.

---

## SECTION 1: FILE INVENTORY

### 1A: Page & Routes

| Aspect | Value |
|--------|-------|
| **Route/URL** | `/dashboard/ai/chat` |
| **Page File** | `savant-marketing-studio/app/dashboard/ai/chat/page.tsx` |
| **Component Type** | Server Component (async function) |
| **Dynamic Mode** | `force-dynamic` (line 8) |

**Data Fetched on Load** (lines 58-90):
```typescript
const [
  clientsResult,           // All clients (id, name)
  writingFrameworksResult, // Marketing frameworks (type='writing-framework')
  modelsResult,            // Active AI models
  conversationsResult,     // User's active conversations
  projectsResult,          // All projects
  journalEntriesResult,    // Last 50 journal entries with mentions
] = await Promise.all([...])
```

**Props Passed to ChatInterface** (lines 168-177):
```typescript
<ChatInterface
  clients={clients}
  writingFrameworks={writingFrameworksResult.data || []}
  projects={projects}
  contentAssets={contentAssets}
  journalEntries={journalEntries}
  models={modelsResult.data || []}
  initialConversations={conversationsResult.success ? conversationsResult.data || [] : []}
  initialConversationId={initialConversationId}  // From URL ?conversation=
/>
```

---

### 1B: Components (Complete List)

#### 1. `ChatInterface` (Main Container)
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/chat-interface.tsx` |
| **Lines** | 748 total |
| **Purpose** | Main chat orchestration - manages conversations, messages, and coordinates all child components |

**Props Interface** (lines 43-52):
```typescript
export interface ChatInterfaceProps {
  clients: Array<{ id: string; name: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
  projects: Array<{ id: string; name: string; description: string | null; clientId: string | null; clientName: string | null }>
  contentAssets: Array<{ id: string; title: string; content: string | null; contentType: string | null; clientId: string | null; clientName: string | null }>
  models: Array<{ id: string; model_name: string; display_name: string; max_tokens: number | null }>
  initialConversations: ConversationListItem[]
  journalEntries: JournalEntrySummary[]
  initialConversationId?: string | null
}
```

**State Managed** (lines 64-100):
```typescript
const [sidebarOpen, setSidebarOpen] = useState(true)
const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
const [selectedModel, setSelectedModel] = useState(models[0] || {...})
const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId)
const [messages, setMessages] = useState<ConversationMessage[]>([])
const [isGenerating, setIsGenerating] = useState(false)
const [conversationTokens, setConversationTokens] = useState<{input: number; output: number}>({ input: 0, output: 0 })
const [isSummarizing, setIsSummarizing] = useState(false)
const [saveDialogOpen, setSaveDialogOpen] = useState(false)
const [messageToSave, setMessageToSave] = useState<ConversationMessage | null>(null)
const [lastMentionedProject, setLastMentionedProject] = useState<{id: string; clientId: string | null} | null>(null)
const [pendingClientLink, setPendingClientLink] = useState<{clientId: string; clientName: string} | null>(null)
```

**Child Components Rendered**:
- `ChatSidebar` (desktop + mobile via Sheet)
- `TokenCounter` (header)
- `DropdownMenu` (model selector)
- `MessageThread` (message display)
- `ChatInput` (input area)
- `SaveToLibraryDialog` (save modal)

---

#### 2. `ChatInput`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/chat-input.tsx` |
| **Lines** | 347 total |
| **Purpose** | Text input with @ mention detection, context pills, extended thinking toggle |

**Props Interface** (lines 10-29):
```typescript
interface ChatInputProps {
  onSend: (content: string, context: ContextItem[], useExtendedThinking: boolean) => void
  disabled?: boolean
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>
  journalEntries: Array<{...}>
  writingFrameworks: Array<{ id: string; name: string; category?: string }>
  currentTokens?: number
  maxTokens?: number
}
```

**State Managed** (lines 47-64):
```typescript
const [value, setValue] = useState("")
const [selectedContext, setSelectedContext] = useState<ContextItem[]>([])
const [useExtendedThinking, setUseExtendedThinking] = useState(false)
const [showContextModal, setShowContextModal] = useState(false)
const [showInlinePopup, setShowInlinePopup] = useState(false)
const [inlineQuery, setInlineQuery] = useState("")
const [inlinePosition, setInlinePosition] = useState({ top: 0, left: 0 })
const [showOverflowWarning, setShowOverflowWarning] = useState(false)
const [projectedTokens, setProjectedTokens] = useState(0)
```

**Child Components**:
- `InlineMentionPopup` (@ autocomplete)
- `ContextPickerModal` (+ button modal)

**Key Functions**:
- `handleChange()` - Detects `@` and shows inline popup (lines 87-120)
- `handleSubmit()` - Calls `onSend(value, selectedContext, useExtendedThinking)` (lines 158-166)
- `handleKeyDown()` - Enter to submit, navigation for popup (lines 169-205)
- `estimateTokens()` - Rough `text.length / 4` estimate (lines 32-34)

---

#### 3. `MessageThread`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/message-thread.tsx` |
| **Lines** | 174 total |
| **Purpose** | Renders list of messages with user/assistant styling |

**Props Interface** (lines 10-16):
```typescript
interface MessageThreadProps {
  messages: ConversationMessage[]
  isGenerating: boolean
  onCopy: (content: string) => void
  onSave: (message: ConversationMessage) => Promise<boolean>
  onRegenerate: (messageId: string) => void
}
```

**Contains**: `MessageBubble` internal component (lines 45-172)

**Loading State** (lines 33-40): Shows "Thinking..." with Loader2 spinner when `isGenerating` and last message is from user.

---

#### 4. `ChatSidebar`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/chat-sidebar.tsx` |
| **Lines** | 364 total |
| **Purpose** | Conversation list with search, client filter, rename/archive/delete actions |

**Props Interface** (lines 32-43):
```typescript
interface ChatSidebarProps {
  conversations: ConversationListItem[]
  currentConversationId?: string
  clients: Array<{ id: string; name: string }>
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onArchiveConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  onLinkClient: (conversationId: string, clientId: string | null) => void
  onClose: () => void
}
```

**State Managed**:
```typescript
const [searchQuery, setSearchQuery] = useState("")
const [clientFilter, setClientFilter] = useState<string>("all")
const [hoveredId, setHoveredId] = useState<string | null>(null)
const [renameDialog, setRenameDialog] = useState({...})
const [linkClientDialog, setLinkClientDialog] = useState({...})
```

---

#### 5. `TokenCounter`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/token-counter.tsx` |
| **Lines** | 60 total |
| **Purpose** | Visual progress bar showing token usage with color thresholds |

**Props Interface** (lines 6-10):
```typescript
interface TokenCounterProps {
  inputTokens: number
  outputTokens: number
  maxTokens?: number  // Default 200,000
}
```

**Color Thresholds** (lines 21-34):
- `< 50%`: Green (safe)
- `50-80%`: Yellow (warning)
- `>= 80%`: Red (critical) + AlertTriangle icon

---

#### 6. `InlineMentionPopup`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/inline-mention-popup.tsx` |
| **Lines** | 237 total |
| **Purpose** | Dropdown autocomplete when user types `@` |

**Props Interface** (lines 8-28):
```typescript
interface InlineMentionPopupProps {
  query: string              // Text after @ symbol
  position: { top: number; left: number }
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
  onSelect: (item: ContextItem) => void
  onClose: () => void
  clients: Array<{...}>
  projects: Array<{...}>
  contentAssets: Array<{...}>
  journalEntries: Array<{...}>
  writingFrameworks: Array<{...}>
}
```

**Exposed Ref Method** (lines 140-146):
```typescript
useImperativeHandle(ref, () => ({
  selectCurrent: () => {
    if (flatList.length > 0 && selectedIndex < flatList.length) {
      onSelect(flatList[selectedIndex])
    }
  }
}))
```

**How Filtering Works** (lines 71-101):
1. If query matches a type name ("client", "project", etc.), show all of that type
2. Otherwise, filter by `name.includes(query)` or `subtitle.includes(query)`

---

#### 7. `ContextPickerModal`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/context-picker-modal.tsx` |
| **Lines** | 391 total |
| **Purpose** | Full modal with categories, search, multi-select for adding context |

**Props Interface** (lines 43-62):
```typescript
interface ContextPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: ContextItem[]) => void
  initialSearch?: string
  clients: Array<{...}>
  projects: Array<{...}>
  contentAssets: Array<{...}>
  journalEntries: Array<{...}>
  writingFrameworks: Array<{...}>
}
```

**View States**:
- `"categories"`: Shows 5 category buttons (Client, Project, Content, Capture, Framework)
- `"items"`: Shows filtered list with checkboxes for multi-select

**ContextItem Type** (lines 34-41):
```typescript
export interface ContextItem {
  type: ContextItemType  // "client" | "project" | "content" | "capture" | "framework"
  id: string
  name: string
  subtitle?: string
  mentionLinks?: MentionLink[]  // For captures - their mention relationships
}
```

---

#### 8. `SaveToLibraryDialog`
| Aspect | Value |
|--------|-------|
| **File** | `components/ai-chat/save-to-library-dialog.tsx` |
| **Lines** | 159 total |
| **Purpose** | Modal to save AI response to content library with title + project selection |

**Props Interface** (lines 26-33):
```typescript
interface SaveToLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { title: string; projectId: string | null }) => Promise<void>
  clientId: string | null
  defaultProjectId?: string | null
  defaultTitle: string
}
```

---

### 1C: Server Actions

**File**: `savant-marketing-studio/app/actions/chat.ts` (1595 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `createConversation` | 440-518 | Create new conversation with optional client/framework context |
| `getConversation` | 523-602 | Load conversation with all messages |
| `listConversations` | 607-716 | List conversations with filters (client, status, limit) |
| `updateConversation` | 721-782 | Update title, rating, or link to client |
| `archiveConversation` | 787-825 | Soft delete (set status='archived') |
| `deleteConversation` | 941-977 | Hard delete with cascade |
| `summarizeConversation` | 831-936 | Generate AI summary for context rollover |
| `sendMessage` | 1111-1315 | **CORE**: Send message, get AI response, save to DB |
| `saveMessageToContent` | 1324-1426 | Save AI response to content library |
| `regenerateSystemPrompt` | 1435-1512 | Rebuild system prompt from client data |
| `getClientChatStats` | 1517-1594 | Get stats for a client's conversations |

**Helper Functions** (internal):
| Function | Lines | Purpose |
|----------|-------|---------|
| `extractTextFromTipTap` | 99-125 | Extract plain text from TipTap JSON |
| `buildContextFromMentions` | 131-328 | **CRITICAL**: Build context string from @ mentions |
| `buildSystemPrompt` | 333-404 | Build system prompt from client/framework data |
| `getDefaultChatModelId` | 409-430 | Get default model ID |

---

### 1D: Types

**From `app/actions/chat.ts`** (lines 15-90):
```typescript
// Input types
export interface CreateConversationInput {
  clientId?: string
  contentTypeId?: string
  writingFrameworkIds?: string[]
  title?: string
  systemPrompt?: string
}

export interface SendMessageInput {
  conversationId: string
  content: string
  modelId?: string
  useExtendedThinking?: boolean
  mentions?: Array<{
    type: string
    name: string
    id: string
    description?: string | null
    clientId?: string | null
    clientName?: string | null
    entry?: Json
    content?: string | null
    contentType?: string | null
  }>
}

// Output types
export interface ConversationMessage {
  id: string
  conversationId: string | null
  messageRole: string | null
  content: string
  inputTokens: number | null
  outputTokens: number | null
  totalCostUsd: number | null
  modelId: string
  createdAt: string | null
}

export interface ConversationListItem {
  id: string
  title: string
  clientId: string | null
  clientName: string | null
  messageCount: number
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  qualityRating: number | null
  status: string
  createdAt: string
  updatedAt: string
}
```

**From `context-picker-modal.tsx`**:
```typescript
export type ContextItemType = "client" | "project" | "content" | "capture" | "framework"

export interface ContextItem {
  type: ContextItemType
  id: string
  name: string
  subtitle?: string
  mentionLinks?: MentionLink[]
}
```

---

### 1E: Utilities/Helpers

| File | Purpose |
|------|---------|
| `lib/ai/orchestrator.ts` | Model selection, fallback, cost calculation, execution logging |
| `lib/ai/providers/claude.ts` | Claude API wrapper with vision + extended thinking support |
| `lib/ai/providers/base-provider.ts` | AIRequest/AIResponse interfaces |
| `lib/ai/model-lookup.ts` | Map model names to database IDs |
| `lib/ai/pricing.ts` | Token cost calculations |
| `lib/ai/file-processor.ts` | Extract text from PDF, DOCX, images |
| `lib/supabase/server.ts` | Server-side Supabase client creation |
| `lib/activity-log.ts` | Log activity for audit trail |
| `lib/utils/mentions.ts` | Parse @mentions in text (used by Journal, not AI Chat) |

---

## SECTION 2: DATA FLOW - PAGE LOAD

### Sequence Diagram

```
Browser navigates to /dashboard/ai/chat
         │
         ▼
┌─────────────────────────────────────────────┐
│ app/dashboard/ai/chat/page.tsx (Server)     │
│ Lines 43-179                                │
└─────────────────────────────────────────────┘
         │
         │ 1. Get URL params
         ▼
   params.conversation → initialConversationId
         │
         │ 2. Create Supabase client
         ▼
   createClient() → supabase
         │
         │ 3. Parallel data fetching (lines 58-90)
         ▼
┌─────────────────────────────────────────────┐
│ Promise.all([                               │
│   supabase.from('clients').select(...)      │
│   supabase.from('marketing_frameworks')...  │
│   supabase.from('ai_models').select(...)    │
│   listConversations({ status: 'active' })   │
│   getProjects()                             │
│   supabase.from('journal_entries')...       │
│ ])                                          │
└─────────────────────────────────────────────┘
         │
         │ 4. Transform content assets (lines 93-110)
         ▼
   For each client → getContentAssets(client.id)
   Map to { id, title, content, contentType, clientId, clientName }
         │
         │ 5. Build lookup maps (lines 133-136)
         ▼
   clientMap = Map(id → name)
   projectMap = Map(id → name)
   contentMap = Map(id → title)
         │
         │ 6. Transform journal entries (lines 139-165)
         ▼
   Resolve mentioned_clients/projects/content UUIDs to names
         │
         │ 7. Render ChatInterface with all props
         ▼
   <ChatInterface ... />
```

### Exact Supabase Queries

**1. Clients Query** (lines 66-70):
```typescript
supabase
  .from('clients')
  .select('id, name')
  .is('deleted_at', null)
  .order('name')
```

**2. Writing Frameworks Query** (lines 71-75):
```typescript
supabase
  .from('marketing_frameworks')
  .select('id, name, category')
  .eq('type', 'writing-framework')
  .order('name')
```

**3. AI Models Query** (lines 76-80):
```typescript
supabase
  .from('ai_models')
  .select('id, model_name, display_name, max_tokens')
  .eq('is_active', true)
  .order('display_name')
```

**4. Conversations Query** (via `listConversations`):
```typescript
supabase
  .from('ai_conversations')
  .select('id, title, client_id, total_cost_usd, total_input_tokens, ...')
  .eq('user_id', user.id)
  .eq('status', 'active')  // if filter provided
  .order('updated_at', { ascending: false })
  .limit(50)
```

**5. Journal Entries Query** (lines 83-89):
```typescript
supabase
  .from('journal_entries')
  .select('id, content, tags, mentioned_clients, mentioned_projects, mentioned_content, created_at')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(50)
```

---

## SECTION 3: DATA FLOW - SENDING A MESSAGE (NO CONTEXT)

### Complete Flow for: User types "Hello" and hits Enter

```
┌─────────────────────────────────────────────┐
│ STEP 1: User types in ChatInput             │
│ File: chat-input.tsx                        │
└─────────────────────────────────────────────┘
         │
         │ State: value = "Hello"
         │        selectedContext = []
         │        useExtendedThinking = false
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 2: User hits Enter                     │
│ handleKeyDown() → line 201-204              │
└─────────────────────────────────────────────┘
         │
         │ if (e.key === "Enter" && !e.shiftKey) {
         │   e.preventDefault()
         │   handleSubmit()
         │ }
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 3: handleSubmit() runs                 │
│ Lines 158-166                               │
└─────────────────────────────────────────────┘
         │
         │ onSend(value.trim(), selectedContext, useExtendedThinking)
         │ → onSend("Hello", [], false)
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 4: ChatInterface.handleSendMessage()   │
│ File: chat-interface.tsx, lines 206-379     │
└─────────────────────────────────────────────┘
         │
         │ A) Convert context to mentions format (lines 227-234)
         │    mentions = []  // empty since no context
         │
         │ B) Create optimistic user message (lines 237-248)
         │    optimisticUserMessage = {
         │      id: `temp-${Date.now()}`,
         │      messageRole: 'user',
         │      content: "Hello",
         │      ...
         │    }
         │
         │ C) Add to UI immediately (line 251)
         │    setMessages(prev => [...prev, optimisticUserMessage])
         │
         │ D) Set loading state (line 254)
         │    setIsGenerating(true)
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 5: Create conversation if needed       │
│ Lines 259-324                               │
└─────────────────────────────────────────────┘
         │
         │ if (!currentConversationId) {
         │   createConversation({
         │     clientId: undefined,  // no @client mention
         │     title: "Hello"        // first 50 chars
         │   })
         │ }
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 6: Call sendMessage action             │
│ Lines 327-333                               │
└─────────────────────────────────────────────┘
         │
         │ sendMessage({
         │   conversationId,
         │   content: "Hello",
         │   modelId: selectedModel.model_name,
         │   useExtendedThinking: false,
         │   mentions: []
         │ })
         │
         ▼
┌─────────────────────────────────────────────┐
│ STEP 7: sendMessage action processes        │
│ File: chat.ts, lines 1111-1315              │
└─────────────────────────────────────────────┘
```

### Inside `sendMessage` Action (Detailed)

```typescript
// 1. Create Supabase client and authenticate (lines 1123-1132)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// 2. Load conversation (line 1135-1143)
const { data: conversation } = await supabase
  .from('ai_conversations')
  .select('*')
  .eq('id', data.conversationId)
  .single();

// 3. Load previous messages for context (lines 1146-1150)
const { data: previousExecutions } = await supabase
  .from('ai_executions')
  .select('message_role, input_data, output_data')
  .eq('conversation_id', data.conversationId)
  .order('created_at', { ascending: true });

// 4. Build messages array (lines 1153-1168)
const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
previousExecutions.forEach(exec => {
  // Add user and assistant messages from history
});

// 5. NO CONTEXT - skip buildContextFromMentions (lines 1171-1179)
// Since mentions is empty, userMessageContent stays as "Hello"

// 6. Add current message (line 1182)
messages.push({ role: 'user', content: "Hello" });

// 7. Save user message to DB (lines 1194-1211)
const { data: userMessage } = await supabase
  .from('ai_executions')
  .insert({
    user_id: user.id,
    conversation_id: conversation.id,
    model_id: modelId,
    task_type: 'chat_message',
    message_role: 'user',
    input_data: { content: "Hello", mentions: [] },
    status: 'success'
  })
  .select('id')
  .single();

// 8. Call AI via orchestrator (lines 1219-1237)
const orchestrator = new AIOrchestrator();
const aiResponse = await orchestrator.executeTask({
  type: 'chat_message',
  complexity: 'medium',
  forceModel: modelName,
  request: {
    messages,
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: conversation.system_prompt || undefined,
    useExtendedThinking: false,
  },
});

// 9. Save assistant response to DB (lines 1248-1265)
await supabase.from('ai_executions').insert({
  message_role: 'assistant',
  output_data: { content: aiResponse.content },
  input_tokens: aiResponse.inputTokens,
  output_tokens: aiResponse.outputTokens,
  total_cost_usd: aiResponse.cost,
});

// 10. Return response (lines 1296-1307)
return {
  success: true,
  data: {
    response: aiResponse.content,
    inputTokens: aiResponse.inputTokens,
    outputTokens: aiResponse.outputTokens,
    cost: aiResponse.cost,
    modelUsed: aiResponse.modelUsed,
  }
};
```

### Back in ChatInterface

```typescript
// STEP 8: Refresh conversation (lines 344-352)
const refreshResult = await getConversation(conversationId);
if (refreshResult.success && refreshResult.data) {
  setMessages(refreshResult.data.messages);  // Replace optimistic with real
  setConversationTokens({
    input: refreshResult.data.conversation.total_input_tokens || 0,
    output: refreshResult.data.conversation.total_output_tokens || 0,
  });
}

// STEP 9: Clear loading state (line 377)
setIsGenerating(false);
```

---

## SECTION 4: DATA FLOW - SENDING A MESSAGE WITH CONTEXT

### Flow for: `@client:Acme @framework:PAS Write me an email`

### 4A: Selecting Context

**Step 1: User types `@`**

In `chat-input.tsx`, `handleChange()` (lines 87-120):
```typescript
const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newValue = e.target.value
  setValue(newValue)

  const lastAtIndex = newValue.lastIndexOf("@")
  
  if (lastAtIndex !== -1) {
    const textAfterAt = newValue.slice(lastAtIndex + 1)
    const hasSpaceAfter = textAfterAt.includes(" ")
    
    // Show popup if no space after @ yet
    if (!hasSpaceAfter && textAfterAt.length <= 30) {
      setInlineQuery(textAfterAt)  // e.g., "client" or "Acme"
      setShowInlinePopup(true)
      
      // Position popup above input
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect()
        setInlinePosition({
          top: rect.top - 8,
          left: rect.left + 16,
        })
      }
    }
  }
}
```

**Step 2: InlineMentionPopup shows**

The popup filters entities based on query (`inline-mention-popup.tsx`, lines 71-101):
```typescript
const filteredItems = useMemo(() => {
  if (!query) return allItems
  
  const lowerQuery = query.toLowerCase()
  
  // Check if query matches a type name
  const typeMatches = { "client": "client", "clients": "client", ... }
  const matchedType = typeMatches[lowerQuery]
  if (matchedType) {
    return allItems.filter(item => item.type === matchedType)
  }
  
  // Otherwise filter by name/subtitle
  return allItems.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.subtitle?.toLowerCase().includes(lowerQuery)
  )
}, [allItems, query])
```

**Step 3: User selects "Acme"**

`handleInlineSelect()` in `chat-input.tsx` (lines 139-155):
```typescript
const handleInlineSelect = (item: ContextItem) => {
  // Remove @query from input
  const lastAtIndex = value.lastIndexOf("@")
  const newValue = lastAtIndex >= 0 ? value.slice(0, lastAtIndex) : value
  setValue(newValue)
  
  // Add to selectedContext
  setSelectedContext(prev => {
    if (prev.some(p => p.id === item.id && p.type === item.type)) {
      return prev // Already exists
    }
    return [...prev, item]
  })
  
  setShowInlinePopup(false)
  textareaRef.current?.focus()
}
```

**ContextItem shape** after selection:
```typescript
{
  type: "client",
  id: "uuid-of-acme",
  name: "Acme",
  subtitle: undefined
}
```

**Step 4: Context pills render**

In `chat-input.tsx` (lines 223-244):
```typescript
{selectedContext.length > 0 && (
  <div className="mb-2 flex gap-2 overflow-x-auto...">
    {selectedContext.map((item) => (
      <span key={`${item.type}-${item.id}`} className={getPillColor(item.type)}>
        @{item.name}
        <button onClick={() => removeContext(item.id, item.type)}>
          <X className="h-3 w-3" />
        </button>
      </span>
    ))}
  </div>
)}
```

---

### 4B: Submitting with Context

**Convert selectedContext to mentions** in `handleSendMessage()` (lines 227-234):
```typescript
const mentions = context.map(item => ({
  type: item.type === "capture" ? "capture" as const : 
        item.type === "framework" ? "writing-framework" as const :
        item.type === "content" ? "content" as const :
        item.type as "client" | "project",
  name: item.name,
  id: item.id,
}))
```

**Example mentions array**:
```typescript
[
  { type: "client", name: "Acme", id: "uuid-acme" },
  { type: "writing-framework", name: "PAS", id: "uuid-pas" }
]
```

---

### 4C: Processing Context in Action (CRITICAL)

**`buildContextFromMentions` function** (`chat.ts`, lines 131-328):

```typescript
async function buildContextFromMentions(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  mentions: NonNullable<SendMessageInput['mentions']>
): Promise<{ text: string | null; images: Array<{ base64: string; mediaType: string }> }> {
  if (!mentions.length) return { text: null, images: [] };

  const contextParts: string[] = [];
  const images: Array<{ base64: string; mediaType: string }> = [];

  // 1. GROUP MENTIONS BY TYPE (lines 141-147)
  const clientIds = mentions.filter(m => m.type === 'client').map(m => m.id);
  const projectIds = mentions.filter(m => m.type === 'project').map(m => m.id);
  const contentIds = mentions.filter(m => m.type === 'content').map(m => m.id);
  const captureIds = mentions.filter(m => m.type === 'capture').map(m => m.id);
  const frameworkIds = mentions
    .filter(m => m.type === 'writing-framework' || m.type === 'framework')
    .map(m => m.id);

  // 2. FETCH AND FORMAT CLIENTS (lines 149-169)
  if (clientIds.length) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, brand_data, intake_responses, industry, website')
      .in('id', clientIds);

    if (clients?.length) {
      contextParts.push(`## Referenced Clients\n${clients.map(c => {
        const parts = [`### ${c.name}`];
        if (c.industry) parts.push(`Industry: ${c.industry}`);
        if (c.website) parts.push(`Website: ${c.website}`);
        if (c.brand_data) {
          parts.push(`Brand Info:\n\`\`\`json\n${JSON.stringify(c.brand_data, null, 2)}\n\`\`\``);
        }
        if (c.intake_responses) {
          parts.push(`Questionnaire Responses:\n\`\`\`json\n${JSON.stringify(c.intake_responses, null, 2)}\n\`\`\``);
        }
        return parts.join('\n');
      }).join('\n\n')}`);
    }
  }

  // 3. FETCH AND FORMAT PROJECTS (lines 172-230)
  // Includes auto-fetching client brand data if project has client_id!
  if (projectIds.length) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, status, metadata, client_id')
      .in('id', projectIds);

    // Collect client IDs from projects that weren't explicitly @mentioned
    const projectClientIds = [...new Set(
      projects.map(p => p.client_id)
        .filter(cid => cid !== null && !clientIds.includes(cid))
    )];

    // Fetch those clients' brand data
    if (projectClientIds.length) {
      const { data } = await supabase
        .from('clients')
        .select('id, name, brand_data, intake_responses, industry, website')
        .in('id', projectClientIds);
      // ...include in context
    }
  }

  // 4. FETCH AND FORMAT CONTENT (lines 234-278)
  // Handles both TipTap JSON and uploaded files (PDF, DOCX, images)
  if (contentIds.length) {
    const { data: contents } = await supabase
      .from('content_assets')
      .select('id, title, content_json, asset_type, metadata, file_url, file_type')
      .in('id', contentIds);

    for (const c of contents) {
      if (c.content_json) {
        const text = extractTextFromTipTap(c.content_json);
        // Add to context
      } else if (c.file_url) {
        const extracted = await extractFileContent(c.file_url, c.file_type);
        if (extracted.isImage) {
          images.push({ base64: extracted.base64, mediaType: extracted.mediaType });
        } else {
          // Add text to context
        }
      }
    }
  }

  // 5. FETCH AND FORMAT CAPTURES (lines 281-296)
  if (captureIds.length) {
    const { data: captures } = await supabase
      .from('journal_entries')
      .select('id, content, tags')
      .in('id', captureIds);
    // Format as context
  }

  // 6. FETCH AND FORMAT FRAMEWORKS (lines 299-315)
  if (frameworkIds.length) {
    const { data: frameworks } = await supabase
      .from('marketing_frameworks')
      .select('id, name, content, description, category')
      .in('id', frameworkIds);
    
    contextParts.push(`## Referenced Frameworks\n${frameworks.map(f => {
      const parts = [`### ${f.name}`];
      if (f.category) parts.push(`Category: ${f.category}`);
      if (f.description) parts.push(`Description: ${f.description}`);
      if (f.content) parts.push(`Framework:\n${f.content}`);
      return parts.join('\n');
    }).join('\n\n')}`);
  }

  // 7. COMBINE ALL PARTS (lines 317-327)
  return {
    text: `# CONTEXT FOR THIS MESSAGE
The user has attached the following context. Use this information to inform your response.

${contextParts.join('\n\n---\n\n')}`,
    images,
  };
}
```

---

### 4D: Context Injection into Claude Message

In `sendMessage()` (lines 1171-1182):
```typescript
let userMessageContent = data.content;  // "Write me an email"
let contextImages: Array<{ base64: string; mediaType: string }> = [];

if (data.mentions?.length) {
  const { text: contextText, images } = await buildContextFromMentions(supabase, data.mentions);
  contextImages = images;
  if (contextText) {
    userMessageContent = `${contextText}\n\n---\n\nUSER REQUEST:\n${data.content}`;
  }
}

messages.push({ role: 'user', content: userMessageContent });
```

**Final Prompt Structure Sent to Claude**:
```markdown
# CONTEXT FOR THIS MESSAGE
The user has attached the following context. Use this information to inform your response.

## Referenced Clients
### Acme
Industry: Technology
Website: https://acme.com
Brand Info:
```json
{ "voice": "Professional", "colors": ["#0066CC"] }
```
Questionnaire Responses:
```json
{ "target_audience": "B2B enterprises", ... }
```

---

## Referenced Frameworks
### PAS (Problem-Agitate-Solve)
Category: Copywriting
Description: Classic persuasion framework
Framework:
1. Problem: Identify the reader's pain point
2. Agitate: Make them feel the urgency
3. Solve: Present your solution

---

USER REQUEST:
Write me an email
```

---

## SECTION 5: CONTEXT PICKER COMPONENTS

### 5A: InlineMentionPopup

**Trigger**: User types `@` in ChatInput

**Detection Logic** (`chat-input.tsx`, lines 92-119):
```typescript
const lastAtIndex = newValue.lastIndexOf("@")
if (lastAtIndex !== -1) {
  const textAfterAt = newValue.slice(lastAtIndex + 1)
  const hasSpaceAfter = textAfterAt.includes(" ")
  const hasNewlineAfter = textAfterAt.includes("\n")
  
  if (!hasSpaceAfter && !hasNewlineAfter && textAfterAt.length <= 30) {
    setInlineQuery(textAfterAt)
    setShowInlinePopup(true)
  }
}
```

**Keyboard Navigation** (`chat-input.tsx`, lines 169-198):
- ArrowDown: `setInlineSelectedIndex(prev => prev + 1)`
- ArrowUp: `setInlineSelectedIndex(prev => Math.max(0, prev - 1))`
- Enter/Tab: `inlinePopupRef.current?.selectCurrent()`
- Escape: `setShowInlinePopup(false)`

**Return on Select**: Calls `onSelect(item: ContextItem)` which:
1. Removes `@query` from input text
2. Adds item to `selectedContext` array
3. Closes popup, refocuses input

---

### 5B: ContextPickerModal

**Trigger**: Click `+` button in ChatInput

**Organization** (lines 64-69):
```typescript
const CATEGORIES = [
  { type: "client", label: "Clients", icon: Users },
  { type: "project", label: "Projects", icon: FolderKanban },
  { type: "content", label: "Content", icon: FileText },
  { type: "capture", label: "Captures", icon: BookOpen },
  { type: "framework", label: "Frameworks", icon: Layers },
]
```

**View States**:
1. `"categories"`: Shows 5 category buttons with counts
2. `"items"`: Shows filterable, groupable list of items

**Search** (lines 134-150):
```typescript
const filteredItems = useMemo(() => {
  let items = allItems
  if (activeCategory) {
    items = items.filter(i => i.type === activeCategory)
  }
  if (search) {
    items = items.filter(i => 
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.subtitle?.toLowerCase().includes(search.toLowerCase())
    )
  }
  return items
}, [allItems, activeCategory, search])
```

**Multi-Select** (lines 165-176):
```typescript
const toggleItem = (item: ContextItem) => {
  setSelectedItems(prev => {
    const exists = prev.some(i => i.id === item.id && i.type === item.type)
    if (exists) {
      return prev.filter(i => !(i.id === item.id && i.type === item.type))
    }
    return [...prev, item]
  })
}
```

**Return on Done**: Calls `onSelect(selectedItems)` → merged into `selectedContext`

---

### 5C: Context Pills

**Rendered in**: `chat-input.tsx`, lines 223-244

**Component Structure**:
```tsx
{selectedContext.map((item) => (
  <span className={getPillColor(item.type)}>
    @{item.name}
    <button onClick={() => removeContext(item.id, item.type)}>
      <X className="h-3 w-3" />
    </button>
  </span>
))}
```

**Removal Handler** (lines 134-136):
```typescript
const removeContext = (id: string, type: string) => {
  setSelectedContext(prev => prev.filter(c => !(c.id === id && c.type === type)))
}
```

**Pill Colors** (lines 208-217):
```typescript
const getPillColor = (type: string) => {
  switch (type) {
    case "client": return "bg-primary/10 text-primary"
    case "project": return "bg-secondary/20 text-secondary-foreground"
    case "content": return "bg-amber-500/10 text-amber-700"
    case "capture": return "bg-emerald-500/10 text-emerald-600"
    case "framework": return "bg-orange-500/10 text-orange-600"
  }
}
```

---

## SECTION 6: TOKEN TRACKING

### 6A: Before Send (Estimation)

**Location**: `chat-input.tsx`, lines 74-84

```typescript
useEffect(() => {
  const messageTokens = estimateTokens(value)  // value.length / 4
  const contextTokens = selectedContext.reduce((total, item) => {
    return total + 50  // ~50 tokens per context item (rough estimate)
  }, 0)
  const projected = currentTokens + messageTokens + contextTokens
  setProjectedTokens(projected)
  setShowOverflowWarning(projected > maxTokens * 0.9)
}, [value, selectedContext, currentTokens, maxTokens])
```

**Warning Display** (lines 247-254):
```tsx
{showOverflowWarning && (
  <div className="... bg-amber-500/10 text-amber-600">
    <AlertTriangle />
    <span>This message may exceed the context limit ({percentage}% of {maxTokens})</span>
  </div>
)}
```

---

### 6B: After Response

**Token Extraction from API** (`claude.ts`, lines 91-94):
```typescript
return {
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  // ...
}
```

**Stored in DB** (`chat.ts`, lines 1258-1262):
```typescript
await supabase.from('ai_executions').insert({
  input_tokens: aiResponse.inputTokens,
  output_tokens: aiResponse.outputTokens,
  total_cost_usd: aiResponse.cost,
})
```

**Conversation Totals Updated** via database trigger (auto-increments `total_input_tokens`, `total_output_tokens` on `ai_conversations`)

**Client-Side Update** (`chat-interface.tsx`, lines 344-352):
```typescript
const refreshResult = await getConversation(conversationId)
if (refreshResult.success && refreshResult.data) {
  setConversationTokens({
    input: refreshResult.data.conversation.total_input_tokens || 0,
    output: refreshResult.data.conversation.total_output_tokens || 0,
  })
}
```

---

### 6C: TokenCounter Component

**Full Props** (`token-counter.tsx`, lines 6-10):
```typescript
interface TokenCounterProps {
  inputTokens: number
  outputTokens: number
  maxTokens?: number  // Default 200,000
}
```

**Percentage Calculation** (line 18):
```typescript
const percentage = Math.min((totalTokens / maxTokens) * 100, 100)
```

**Color Thresholds** (lines 21-34):
```typescript
const getColorClasses = () => {
  if (percentage >= 80) return {  // CRITICAL
    text: 'text-destructive',
    indicator: 'bg-destructive'
  }
  if (percentage >= 50) return {  // WARNING
    text: 'text-yellow-600 dark:text-yellow-500',
    indicator: 'bg-yellow-500'
  }
  return {  // SAFE
    text: 'text-green-600 dark:text-green-500',
    indicator: 'bg-green-500'
  }
}
```

**Critical Warning** (lines 54-56):
```typescript
{percentage >= 80 && (
  <AlertTriangle className={colors.text} />
)}
```

---

## SECTION 7: CONVERSATION MANAGEMENT

### 7A: Creating Conversations

**When Created**: On first message if `currentConversationId` is null

**Action**: `createConversation()` in `chat.ts`, lines 440-518

**Parameters**:
```typescript
interface CreateConversationInput {
  clientId?: string              // From @client mention
  contentTypeId?: string         // Not used in AI Chat
  writingFrameworkIds?: string[] // From @framework mentions
  title?: string                 // First 50 chars of message
  systemPrompt?: string          // For rollover summaries
}
```

**Database Insert** (lines 490-501):
```typescript
const { data: conversation } = await supabase
  .from('ai_conversations')
  .insert({
    user_id: user.id,
    client_id: data.clientId || null,
    framework_ids: allFrameworkIds.length > 0 ? allFrameworkIds : null,
    title,
    system_prompt: systemPrompt,
    status: 'active',
  })
  .select()
  .single();
```

---

### 7B: Loading Conversations

**Action**: `getConversation()` in `chat.ts`, lines 523-602

**Conversation Query** (lines 539-544):
```typescript
const { data: conversation } = await supabase
  .from('ai_conversations')
  .select('*')
  .eq('id', conversationId)
  .single();
```

**Messages Query** (lines 550-555):
```typescript
const { data: executions } = await supabase
  .from('ai_executions')
  .select('id, conversation_id, message_role, input_data, output_data, input_tokens, output_tokens, total_cost_usd, model_id, created_at')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

**Message Transformation** (lines 562-574):
```typescript
const messages: ConversationMessage[] = executions.map(exec => ({
  id: exec.id,
  conversationId: exec.conversation_id,
  messageRole: exec.message_role,
  content: exec.message_role === 'user'
    ? exec.input_data?.content || ''
    : exec.output_data?.content || '',
  inputTokens: exec.input_tokens,
  outputTokens: exec.output_tokens,
  totalCostUsd: exec.total_cost_usd,
  modelId: exec.model_id,
  createdAt: exec.created_at,
}));
```

---

### 7C: Conversation State

**State Variables** (`chat-interface.tsx`):
```typescript
const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId)
const [messages, setMessages] = useState<ConversationMessage[]>([])
const [conversationTokens, setConversationTokens] = useState<{input: number; output: number}>({ input: 0, output: 0 })
```

**Conversation Selection** (lines 135-148):
```typescript
const handleSelectConversation = async (id: string) => {
  setCurrentConversationId(id)
  setMobileSheetOpen(false)
  
  const result = await getConversation(id)
  if (result.success && result.data) {
    setMessages(result.data.messages)
    setConversationTokens({
      input: result.data.conversation.total_input_tokens || 0,
      output: result.data.conversation.total_output_tokens || 0,
    })
  }
}
```

---

## SECTION 8: MESSAGE DISPLAY

### 8A: MessageThread

**Render Logic** (`message-thread.tsx`, lines 19-42):
```tsx
<div className="space-y-6">
  {messages.map((message, index) => (
    <MessageBubble
      key={message.id}
      message={message}
      isLast={index === messages.length - 1}
      isGenerating={isGenerating && index === messages.length - 1 && message.messageRole === "assistant"}
      onCopy={onCopy}
      onSave={onSave}
      onRegenerate={onRegenerate}
    />
  ))}

  {/* Loading indicator */}
  {isGenerating && messages[messages.length - 1]?.messageRole === "user" && (
    <motion.div>
      <Loader2 className="animate-spin" />
      <span>Thinking...</span>
    </motion.div>
  )}
</div>
```

---

### 8B: Loading State

**Trigger**: `isGenerating` is true AND last message is from user

**Component**: Inline in `MessageThread` (lines 33-40)

**Visual**: Framer Motion fade-in with Loader2 spinner and "Thinking..." text

**Show Condition** (line 33):
```typescript
isGenerating && messages[messages.length - 1]?.messageRole === "user"
```

**Hide Condition**: `isGenerating` becomes `false` (line 377 in `chat-interface.tsx`)

---

## SECTION 9: DATABASE SCHEMA

### 9A: Tables Used

| Table | Purpose |
|-------|---------|
| `ai_conversations` | Stores conversation metadata |
| `ai_executions` | Stores individual messages (user + assistant) |
| `ai_models` | AI model registry with pricing |
| `ai_providers` | AI provider registry (Claude, Gemini) |
| `clients` | Client data for context injection |
| `projects` | Project data for context injection |
| `content_assets` | Content library items |
| `journal_entries` | Captures for context |
| `marketing_frameworks` | Writing frameworks |
| `activity_log` | Activity tracking |

### 9B: Key Schema Definitions

**ai_conversations**:
```sql
id: uuid PRIMARY KEY
user_id: uuid NOT NULL REFERENCES auth.users
client_id: uuid REFERENCES clients
framework_ids: uuid[]
title: text NOT NULL
system_prompt: text
status: text DEFAULT 'active'  -- 'active' | 'archived'
quality_rating: integer  -- 1-10
total_cost_usd: numeric(10,6)
total_input_tokens: integer
total_output_tokens: integer
created_at: timestamptz
updated_at: timestamptz
```

**ai_executions**:
```sql
id: uuid PRIMARY KEY
user_id: uuid NOT NULL REFERENCES auth.users
client_id: uuid REFERENCES clients
conversation_id: uuid REFERENCES ai_conversations ON DELETE CASCADE
model_id: uuid NOT NULL REFERENCES ai_models
task_type: text NOT NULL  -- 'chat_message', etc.
message_role: text  -- 'user' | 'assistant'
complexity: text  -- 'simple' | 'medium' | 'complex'
input_data: jsonb NOT NULL  -- { content, mentions }
output_data: jsonb  -- { content }
input_tokens: integer
output_tokens: integer
total_cost_usd: numeric(10,6)
duration_ms: integer
status: text NOT NULL  -- 'success' | 'error'
error_message: text
created_at: timestamptz
```

---

### 9C: All Supabase Queries

**Page Load**:
```typescript
// Clients
supabase.from('clients').select('id, name').is('deleted_at', null).order('name')

// Frameworks
supabase.from('marketing_frameworks').select('id, name, category').eq('type', 'writing-framework').order('name')

// Models
supabase.from('ai_models').select('id, model_name, display_name, max_tokens').eq('is_active', true).order('display_name')

// Journal entries
supabase.from('journal_entries').select('id, content, tags, mentioned_clients, mentioned_projects, mentioned_content, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(50)
```

**Conversation Operations**:
```typescript
// Create
supabase.from('ai_conversations').insert({...}).select().single()

// Read
supabase.from('ai_conversations').select('*').eq('id', id).single()

// List
supabase.from('ai_conversations').select('...').eq('user_id', userId).eq('status', 'active').order('updated_at', { ascending: false }).limit(50)

// Update
supabase.from('ai_conversations').update({...}).eq('id', id).select().single()

// Archive
supabase.from('ai_conversations').update({ status: 'archived' }).eq('id', id)

// Delete
supabase.from('ai_conversations').delete().eq('id', id)
```

**Message Operations**:
```typescript
// Load messages
supabase.from('ai_executions').select('id, conversation_id, message_role, input_data, output_data, input_tokens, output_tokens, total_cost_usd, model_id, created_at').eq('conversation_id', id).order('created_at', { ascending: true })

// Save user message
supabase.from('ai_executions').insert({ message_role: 'user', input_data: { content, mentions }, ... }).select('id').single()

// Save assistant response
supabase.from('ai_executions').insert({ message_role: 'assistant', output_data: { content }, input_tokens, output_tokens, ... }).select('id').single()
```

**Context Fetching** (buildContextFromMentions):
```typescript
// Clients
supabase.from('clients').select('id, name, brand_data, intake_responses, industry, website').in('id', clientIds)

// Projects
supabase.from('projects').select('id, name, description, status, metadata, client_id').in('id', projectIds)

// Content
supabase.from('content_assets').select('id, title, content_json, asset_type, metadata, file_url, file_type').in('id', contentIds)

// Captures
supabase.from('journal_entries').select('id, content, tags').in('id', captureIds)

// Frameworks
supabase.from('marketing_frameworks').select('id, name, content, description, category').in('id', frameworkIds)
```

---

## SECTION 10: SUMMARY DIAGRAMS

### Component Hierarchy

```
AIChatPage (Server Component)
    │
    └── ChatInterface (Client Component)
            │
            ├── Sheet (Mobile)
            │   └── ChatSidebar
            │
            ├── ChatSidebar (Desktop)
            │   ├── ConversationList
            │   ├── RenameDialog
            │   └── LinkClientDialog
            │
            ├── Header
            │   ├── ModelSelector (DropdownMenu)
            │   └── TokenCounter
            │
            ├── Warning Banners
            │   ├── TokenLimitWarning (70%+)
            │   └── ClientLinkSuggestion
            │
            ├── Content Area
            │   ├── EmptyState
            │   └── MessageThread
            │       └── MessageBubble (×N)
            │           └── ActionButtons (Copy/Save/Regenerate)
            │
            ├── ChatInput
            │   ├── ContextPills
            │   ├── OverflowWarning
            │   ├── Textarea
            │   ├── ExtendedThinkingToggle
            │   └── SendButton
            │
            ├── InlineMentionPopup (conditional)
            │
            ├── ContextPickerModal (conditional)
            │
            └── SaveToLibraryDialog (conditional)
```

### Data Flow: Message with Context

```
User Input                          Server Action                     AI Provider
    │                                    │                                │
    ├─ Type "@client:Acme"               │                                │
    │   └─ InlineMentionPopup shows      │                                │
    │       └─ Select "Acme"             │                                │
    │           └─ Add to selectedContext│                                │
    │                                    │                                │
    ├─ Type "Write email"                │                                │
    │                                    │                                │
    ├─ Hit Enter                         │                                │
    │   └─ handleSendMessage()           │                                │
    │       ├─ Convert to mentions       │                                │
    │       ├─ Show optimistic message   │                                │
    │       └─ Call sendMessage() ──────►│ sendMessage()                  │
    │                                    │   ├─ Auth check                │
    │                                    │   ├─ Load conversation         │
    │                                    │   ├─ Load history              │
    │                                    │   ├─ buildContextFromMentions()│
    │                                    │   │   ├─ Query clients table   │
    │                                    │   │   └─ Format context string │
    │                                    │   ├─ Save user message         │
    │                                    │   └─ orchestrator.executeTask()│──►│
    │                                    │                                │   ├─ Select model
    │                                    │                                │   ├─ ClaudeProvider
    │                                    │                                │   │   .generateText()
    │                                    │                                │   └─ Return response
    │                                    │   ◄────────────────────────────│
    │                                    │   ├─ Save assistant message    │
    │                                    │   ├─ Log activity              │
    │                                    │   └─ Return result             │
    │   ◄────────────────────────────────│                                │
    │   ├─ getConversation() for refresh │                                │
    │   ├─ Update messages state         │                                │
    │   ├─ Update token counter          │                                │
    │   └─ setIsGenerating(false)        │                                │
    │                                    │                                │
    └─ UI shows AI response              │                                │
```

### Action Call Chain

```
ChatInterface.handleSendMessage()
    │
    ├─► createConversation() [if new]
    │       └─ buildSystemPrompt()
    │
    └─► sendMessage()
            │
            ├─► buildContextFromMentions()
            │       ├─ Query clients
            │       ├─ Query projects (+ auto-fetch client brand data)
            │       ├─ Query content_assets
            │       │   └─ extractFileContent() [for uploads]
            │       ├─ Query journal_entries
            │       └─ Query marketing_frameworks
            │
            ├─► AIOrchestrator.executeTask()
            │       │
            │       ├─► getModelByName() or selectModel()
            │       │
            │       └─► ClaudeProvider.generateText()
            │               └─ Anthropic SDK call
            │
            └─► logActivity()
```

---

## APPENDIX: Quick Reference

### Key Files

| Component | Path |
|-----------|------|
| Page | `app/dashboard/ai/chat/page.tsx` |
| Main Component | `components/ai-chat/chat-interface.tsx` |
| Input | `components/ai-chat/chat-input.tsx` |
| Messages | `components/ai-chat/message-thread.tsx` |
| Sidebar | `components/ai-chat/chat-sidebar.tsx` |
| Token Counter | `components/ai-chat/token-counter.tsx` |
| Inline Popup | `components/ai-chat/inline-mention-popup.tsx` |
| Context Modal | `components/ai-chat/context-picker-modal.tsx` |
| Save Dialog | `components/ai-chat/save-to-library-dialog.tsx` |
| Server Actions | `app/actions/chat.ts` |
| AI Orchestrator | `lib/ai/orchestrator.ts` |
| Claude Provider | `lib/ai/providers/claude.ts` |
| Pricing | `lib/ai/pricing.ts` |

### Key Functions

| Function | File | Line |
|----------|------|------|
| `handleSendMessage` | chat-interface.tsx | 206 |
| `buildContextFromMentions` | chat.ts | 131 |
| `sendMessage` | chat.ts | 1111 |
| `executeTask` | orchestrator.ts | 43 |
| `generateText` | claude.ts | 15 |

### Types to Import

```typescript
// From app/actions/chat
import type { 
  ConversationMessage,
  ConversationListItem,
  SendMessageInput,
  CreateConversationInput 
} from '@/app/actions/chat'

// From components
import type { ContextItem, ContextItemType } from '@/components/ai-chat/context-picker-modal'

// From AI lib
import type { AIRequest, AIResponse } from '@/lib/ai/providers/base-provider'
```

---

*Document generated: January 2026*
*Last updated: AI Chat System v1.0*
