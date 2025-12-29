# Response Viewer Components - Visual Guide

## Component Previews

### 1. ResponseViewer - Main Response Display

#### Collapsed State
```
┌──────────────────────────────────────────────────────────┐
│ 8 sections                    Expand all | Collapse all  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ▶ Avatar Definition                    5/5 answered ✓    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ▶ Dream Outcome & Value Equation       4/5 answered      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ▶ Problems & Obstacles                 3/5 answered      │
└──────────────────────────────────────────────────────────┘
```

#### Expanded State
```
┌──────────────────────────────────────────────────────────┐
│ ▼ Avatar Definition                    5/5 answered ✓    │
├──────────────────────────────────────────────────────────┤
│ Q1  Who is your ideal customer?                          │
│     ┌────────────────────────────────────────────────┐   │
│     │ Enterprise B2B customers in the SaaS space     │   │
│     │ with 50-500 employees, looking for marketing   │   │
│     │ automation solutions...                        │   │
│     └────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ Q2  Which criteria does your ideal customer meet?       │
│     ┌────────────────────────────────────────────────┐   │
│     │ Budget over $10k, Decision maker, Has pain    │   │
│     └────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ Q3  Demographics of your ideal customer                 │
│     ┌────────────────────────────────────────────────┐   │
│     │ 40-55 years old, C-level executives...        │   │
│     └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 2. ResponseHistory - Version Timeline

#### With Multiple Versions
```
┌──────────────────────────────────────────────────────────┐
│ Version History                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ (v3) ✓ Submitted              [Current]            │  │
│ │      📅 Dec 28, 2025 2:30 PM (3 hours ago)        │  │
│ │      by Admin                                      │  │
│ │                                      [Viewing]     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ (v2) ✓ Submitted                                   │  │
│ │      📅 Dec 27, 2025 4:15 PM (1 day ago)          │  │
│ │      by Client                                     │  │
│ │                                        [View]      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ (v1) ✏️ Draft                                       │  │
│ │      📅 Dec 26, 2025 10:00 AM (2 days ago)        │  │
│ │                                        [View]      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Empty State
```
┌──────────────────────────────────────────────────────────┐
│ Version History                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                      📄                                  │
│                                                          │
│              No response history yet                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Status Colors

**Draft (Yellow):**
- Badge: `bg-yellow-500/10 text-yellow-500`
- Icon: `text-yellow-500`
- Border: `border-yellow-500/20`

**Submitted (Green):**
- Badge: `bg-green-500/10 text-green-500`
- Icon: `text-green-500`
- Border: `border-green-500/20`

**Current (Primary):**
- Badge: `bg-primary text-primary-foreground`
- Border: `border-primary bg-primary/5`
- Button: `bg-primary text-primary-foreground`

**Unanswered (Muted):**
- Background: `bg-muted/30`
- Text: `text-muted-foreground italic`
- Shows: "—"

**Answered (Normal):**
- Background: `bg-muted/50`
- Text: `text-foreground`
- Shows: Actual answer

---

## Layout Patterns

### Two-Column Layout (Recommended)
```tsx
<div className="grid grid-cols-3 gap-6">
  {/* Main content - 2/3 width */}
  <div className="col-span-2">
    <ResponseViewer {...} />
  </div>

  {/* Sidebar - 1/3 width */}
  <div className="col-span-1">
    <ResponseHistory {...} />
  </div>
</div>
```

### Single Column Layout (Mobile)
```tsx
<div className="space-y-6">
  {/* Version selector at top */}
  <ResponseHistory {...} />
  
  {/* Response viewer below */}
  <ResponseViewer {...} />
</div>
```

### Tabbed Layout (Alternative)
```tsx
<Tabs defaultValue="responses">
  <TabsList>
    <TabsTrigger value="responses">Responses</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  
  <TabsContent value="responses">
    <ResponseViewer {...} />
  </TabsContent>
  
  <TabsContent value="history">
    <ResponseHistory {...} />
  </TabsContent>
</Tabs>
```

---

## Interactive States

### ResponseViewer States

**Section Collapsed:**
- Chevron right icon (▶)
- Gray background on hover
- Shows completion count

**Section Expanded:**
- Chevron down icon (▼)
- Shows all questions
- Slightly darker background

**Question with Answer:**
- Green/blue background
- Normal text color
- Full answer displayed

**Question without Answer:**
- Muted background
- Italic text
- Shows "—"

### ResponseHistory States

**Version Not Selected:**
- Border: `border-border`
- Background: transparent
- Button: "View" (muted)

**Version Selected:**
- Border: `border-primary`
- Background: `bg-primary/5`
- Button: "Viewing" (primary color)

**Version on Hover:**
- Border: `border-muted-foreground/50`
- Smooth transition

---

## Animation Opportunities

### Smooth Transitions
```tsx
// Add to section header
className="transition-all duration-200"

// Add to expand/collapse
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
>
  {/* Content */}
</motion.div>
```

### Loading States
```tsx
// Skeleton for loading
<div className="space-y-2">
  {[1,2,3].map(i => (
    <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
  ))}
</div>
```

---

## Integration Examples

### Example 1: Client Profile Tab
```tsx
// In client profile questionnaire tab
import { ResponseViewer } from '@/components/questionnaire/response-viewer'
import { ResponseHistory } from '@/components/questionnaire/response-history'

export function QuestionnaireTab({ clientId }) {
  const [versions, setVersions] = useState([])
  const [currentVersion, setCurrentVersion] = useState(null)

  // Load versions...

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        {currentVersion && (
          <ResponseViewer 
            responseData={currentVersion.response_data}
            sections={getSections()}
          />
        )}
      </div>
      <div className="col-span-1">
        <ResponseHistory 
          versions={versions}
          currentVersionId={currentVersion?.id}
          onViewVersion={setCurrentVersion}
        />
      </div>
    </div>
  )
}
```

### Example 2: Standalone Response Page
```tsx
// Full page response viewer
export default function ResponsePage({ params }) {
  const { clientId, versionId } = params
  
  // Load specific version...

  return (
    <div className="container mx-auto py-8">
      <ResponseViewer 
        responseData={version.response_data}
        sections={sections}
      />
    </div>
  )
}
```

### Example 3: Comparison View (Future)
```tsx
// Side-by-side comparison
<div className="grid grid-cols-2 gap-4">
  <div>
    <h3>Version 2</h3>
    <ResponseViewer responseData={v2.response_data} sections={sections} />
  </div>
  <div>
    <h3>Version 3</h3>
    <ResponseViewer responseData={v3.response_data} sections={sections} />
  </div>
</div>
```

---

## Styling Customization

### Custom Colors
```tsx
// Override colors via className
<ResponseViewer 
  responseData={data}
  sections={sections}
  className="[&_.section-header]:bg-blue-500/10"
/>
```

### Custom Spacing
```tsx
// Adjust spacing
<ResponseViewer 
  className="space-y-6"  // Larger gaps between sections
/>
```

### Custom Borders
```tsx
// Different border style
<ResponseViewer 
  className="[&_.section]:border-2 [&_.section]:border-dashed"
/>
```

---

## Props Reference

### ResponseViewer Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `responseData` | `Record<string, any>` | Yes | Raw response data from API |
| `sections` | `SectionResponse[]` | Yes | Section configuration with questions |
| `className` | `string` | No | Additional CSS classes |

### ResponseHistory Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `versions` | `ResponseVersion[]` | Yes | List of all versions |
| `currentVersionId` | `string` | No | ID of version being viewed |
| `onViewVersion` | `(version) => void` | Yes | Callback when clicking "View" |
| `className` | `string` | No | Additional CSS classes |

---

## Best Practices

### 1. Always Provide Section Configuration
```typescript
// Bad - hardcoded
const sections = [{ sectionKey: 'avatar_definition', ... }]

// Good - from database config
const sections = questionsConfig.sections.map(s => ({
  sectionKey: s.key,
  sectionTitle: s.title,
  questions: questionsConfig.getQuestionsForSection(s.id)
}))
```

### 2. Handle Loading States
```tsx
{loading ? (
  <Skeleton />
) : (
  <ResponseViewer {...} />
)}
```

### 3. Handle Errors
```tsx
{error ? (
  <ErrorMessage error={error} />
) : (
  <ResponseViewer {...} />
)}
```

### 4. Memoize Expensive Computations
```tsx
const sections = useMemo(
  () => buildSectionsConfig(config),
  [config]
)
```

---

**Created:** December 28, 2025  
**Components:** 2  
**Status:** ✅ Ready for Integration

