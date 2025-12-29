# PHASE 3.1: FRAMEWORK MANAGEMENT UI - CURSOR PROMPT

🎯 **MODEL RECOMMENDATION:** Expensive (Claude Sonnet or GPT-4)
This builds a complete new feature from scratch with CRUD operations.

---

## [COPY THIS INTO CURSOR]

```
TASK: Build complete Framework Management system

CONTEXT:
Frameworks are the "brain" of the AI system. They contain proven copywriting/marketing frameworks (AIDA, PAS, Value Ladder, etc.) that will be used to guide AI content generation. The `frameworks` and `framework_embeddings` tables already exist in the database, but there's no UI or Server Actions.

DATABASE SCHEMA (already exists):
```sql
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,  -- 'copywriting', 'strategy', 'funnel', 'ads'
  content TEXT NOT NULL,  -- Raw markdown/text for embedding
  content_json JSONB,  -- Structured format if needed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

REQUIREMENTS:

## 1. Create Server Actions

**File: app/actions/frameworks.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFrameworks() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('frameworks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch frameworks:', error)
    throw new Error('Could not fetch frameworks')
  }
  
  return data
}

export async function getFramework(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('frameworks')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Failed to fetch framework:', error)
    throw new Error('Could not fetch framework')
  }
  
  return data
}

export async function createFramework(formData: {
  title: string
  description?: string
  category: string
  content: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('frameworks')
    .insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      content: formData.content,
      is_active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create framework:', error)
    throw new Error('Could not create framework')
  }
  
  revalidatePath('/dashboard/frameworks')
  return data
}

export async function updateFramework(
  id: string,
  formData: {
    title: string
    description?: string
    category: string
    content: string
    is_active?: boolean
  }
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('frameworks')
    .update({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      content: formData.content,
      is_active: formData.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update framework:', error)
    throw new Error('Could not update framework')
  }
  
  revalidatePath('/dashboard/frameworks')
  revalidatePath(`/dashboard/frameworks/${id}`)
  return data
}

export async function deleteFramework(id: string) {
  const supabase = await createClient()
  
  // This will cascade delete framework_embeddings due to FK constraint
  const { error } = await supabase
    .from('frameworks')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Failed to delete framework:', error)
    throw new Error('Could not delete framework')
  }
  
  revalidatePath('/dashboard/frameworks')
  return { success: true }
}
```

## 2. Create Framework Library Page

**File: app/dashboard/frameworks/page.tsx**

```typescript
import { getFrameworks } from '@/app/actions/frameworks'
import { FrameworkGrid } from '@/components/frameworks/framework-grid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function FrameworksPage() {
  const frameworks = await getFrameworks()
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Framework Library</h1>
          <p className="text-muted-foreground mt-2">
            Proven marketing frameworks that guide AI content generation
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/frameworks/new">Add Framework</Link>
        </Button>
      </div>
      
      <FrameworkGrid frameworks={frameworks} />
    </div>
  )
}
```

## 3. Create Framework Grid Component

**File: components/frameworks/framework-grid.tsx**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

type Framework = Database['public']['Tables']['frameworks']['Row']

interface FrameworkGridProps {
  frameworks: Framework[]
}

const CATEGORY_COLORS: Record<string, string> = {
  copywriting: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  strategy: 'bg-green-500/10 text-green-500 border-green-500/20',
  funnel: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ads: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
}

export function FrameworkGrid({ frameworks }: FrameworkGridProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  
  const filtered = frameworks.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
                         f.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || f.category === categoryFilter
    return matchesSearch && matchesCategory && f.is_active
  })
  
  const categories = ['copywriting', 'strategy', 'funnel', 'ads']
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search frameworks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No frameworks found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/frameworks/new">Create Your First Framework</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(framework => (
            <Link
              key={framework.id}
              href={`/dashboard/frameworks/${framework.id}`}
              className="group"
            >
              <div className="border border-border rounded-lg p-6 hover:border-red-primary hover:shadow-lg transition-all bg-surface">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={CATEGORY_COLORS[framework.category || 'copywriting']}>
                    {framework.category}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-red-primary transition-colors">
                  {framework.title}
                </h3>
                
                {framework.description && (
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {framework.description}
                  </p>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  Updated {new Date(framework.updated_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 4. Create Framework Form Page (New)

**File: app/dashboard/frameworks/new/page.tsx**

```typescript
import { FrameworkForm } from '@/components/frameworks/framework-form'

export default function NewFrameworkPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create Framework</h1>
        <p className="text-muted-foreground mt-2">
          Add a proven marketing framework to guide AI content generation
        </p>
      </div>
      
      <FrameworkForm />
    </div>
  )
}
```

## 5. Create Framework Form Component

**File: components/frameworks/framework-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFramework, updateFramework } from '@/app/actions/frameworks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database'

type Framework = Database['public']['Tables']['frameworks']['Row']

interface FrameworkFormProps {
  framework?: Framework
}

export function FrameworkForm({ framework }: FrameworkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: framework?.title || '',
    description: framework?.description || '',
    category: framework?.category || 'copywriting',
    content: framework?.content || ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (framework) {
        await updateFramework(framework.id, formData)
      } else {
        await createFramework(formData)
      }
      
      router.push('/dashboard/frameworks')
      router.refresh()
    } catch (error) {
      console.error('Failed to save framework:', error)
      alert('Failed to save framework. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Framework Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., AIDA Framework"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="copywriting">Copywriting</SelectItem>
            <SelectItem value="strategy">Strategy</SelectItem>
            <SelectItem value="funnel">Funnel</SelectItem>
            <SelectItem value="ads">Ads</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of when to use this framework"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Framework Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write the complete framework here. Include structure, examples, and guidelines."
          rows={15}
          className="font-mono text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          This content will be used to generate AI embeddings. Be detailed and specific.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {framework ? 'Update' : 'Create'} Framework
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

## 6. Create Framework Detail Page

**File: app/dashboard/frameworks/[id]/page.tsx**

```typescript
import { getFramework } from '@/app/actions/frameworks'
import { FrameworkForm } from '@/components/frameworks/framework-form'
import { notFound } from 'next/navigation'

export default async function FrameworkDetailPage({
  params
}: {
  params: { id: string }
}) {
  const framework = await getFramework(params.id).catch(() => null)
  
  if (!framework) {
    notFound()
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Framework</h1>
        <p className="text-muted-foreground mt-2">
          Update framework details and content
        </p>
      </div>
      
      <FrameworkForm framework={framework} />
    </div>
  )
}
```

## 7. Add Navigation Link

Update the sidebar navigation to include Frameworks:

**File: app/dashboard/layout.tsx** (or wherever navigation is defined)

Add to navigation items:
```typescript
{
  name: 'Frameworks',
  href: '/dashboard/frameworks',
  icon: Brain, // or BookOpen
}
```

## VERIFICATION CHECKLIST

After implementation, test:
- [ ] Can navigate to /dashboard/frameworks
- [ ] Can see framework library (empty state if no frameworks)
- [ ] Can click "Add Framework" button
- [ ] Can fill out form and create framework
- [ ] Framework appears in grid after creation
- [ ] Can click framework card to edit
- [ ] Can update framework details
- [ ] Changes persist after save
- [ ] Can filter by category
- [ ] Can search by title/description
- [ ] RLS prevents seeing other users' frameworks

OUTPUT:
Complete framework management system with CRUD operations and clean UI.
```

## [END CURSOR PROMPT]

---

📋 **AFTER CURSOR COMPLETES:**

1. **Test:** Create 3-5 frameworks with different categories
2. **Verify:** All CRUD operations work
3. **Check:** RLS is enforced (can't see other users' frameworks)
4. **Commit:** `feat: implement framework management system`

**Next:** Move to Phase 3.2 (Embeddings Pipeline)
