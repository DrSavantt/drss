# ANALYTICS PHASE 1: Quick Wins Implementation Guide

## Goal
Add 15 high-impact metrics to the analytics dashboard in **1-2 hours**

## What You'll Add

### New Stat Cards (10):
1. Archived Clients
2. Onboarding Status (3 metrics: Not Started, In Progress, Completed)
3. Onboarding Completion Rate
4. Total Projects
5. Completed Projects  
6. Overdue Projects
7. Projects per Client
8. Content This Week
9. Total AI Generations
10. Total Tokens Used

---

## STEP 1: Update API Route

Edit: `/app/api/analytics/route.ts`

Add these queries AFTER the existing queries (around line 80):

```typescript
// ============================================
// NEW PHASE 1 METRICS
// ============================================

// 1. Archived Clients
const { count: archivedClients } = await supabase
  .from('clients')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .not('deleted_at', 'is', null)

// 2. Clients by Onboarding Status
const { data: clientsByStatus } = await supabase
  .from('clients')
  .select('questionnaire_status')
  .eq('user_id', user.id)
  .is('deleted_at', null)

const onboardingStatus = {
  not_started: 0,
  in_progress: 0,
  completed: 0
}

clientsByStatus?.forEach(c => {
  const status = c.questionnaire_status || 'not_started'
  onboardingStatus[status]++
})

// 3. Onboarding Completion Rate
const completionRate = (totalClients || 0) > 0
  ? Math.round((onboardingStatus.completed / (totalClients || 1)) * 100)
  : 0

// 4. Total Projects
const { count: allProjects } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)

// 5. Completed Projects
const { count: completedProjects } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)
  .eq('status', 'done')

// 6. Overdue Projects
const today = new Date().toISOString()
const { count: overdueProjects } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)
  .neq('status', 'done')
  .lt('due_date', today)

// 7. Projects per Client
const projectsPerClient = (totalClients || 0) > 0
  ? ((allProjects || 0) / (totalClients || 1)).toFixed(1)
  : '0'

// 8. Content This Week
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
const { count: contentThisWeek } = await supabase
  .from('content_assets')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)
  .gte('created_at', sevenDaysAgo.toISOString())

// 9. Total AI Generations
const { count: totalGenerations } = await supabase
  .from('ai_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)

// 10. Total Tokens Used
const { data: executions } = await supabase
  .from('ai_executions')
  .select('tokens_used, completion_tokens')
  .eq('user_id', user.id)

const totalTokens = executions?.reduce((sum, e) => 
  sum + (e.tokens_used || 0) + (e.completion_tokens || 0), 
  0
) || 0
```

---

## STEP 2: Update Response Object

In the same file, update the return statement (around line 150):

```typescript
return NextResponse.json({
  // Stat cards data
  stats: {
    // Existing
    totalClients: totalClients || 0,
    activeProjects: activeProjects || 0,
    totalContent: totalContent || 0,
    journalEntries: journalCount || 0,
    clientGrowth,
    contentByType,
    projectsByStatus,
    
    // NEW PHASE 1 METRICS
    archivedClients: archivedClients || 0,
    onboardingStatus,
    completionRate,
    totalProjects: allProjects || 0,
    completedProjects: completedProjects || 0,
    overdueProjects: overdueProjects || 0,
    projectsPerClient: parseFloat(projectsPerClient),
    contentThisWeek: contentThisWeek || 0,
    aiGenerations: totalGenerations || 0,
    totalTokens,
  },
  // Time series charts (unchanged)
  clientGrowth: clientTrend,
  projectsCompleted: projectsTrend,
  contentCreated: contentTrend,
  dailyActivity: activityTrend
})
```

---

## STEP 3: Update Type Definitions

At the top of `/app/dashboard/analytics/page.tsx`, update the interface:

```typescript
interface StatsData {
  // Existing
  totalClients: number
  activeProjects: number
  totalContent: number
  journalEntries: number
  clientGrowth: number
  contentByType: Record<string, number>
  projectsByStatus: Record<string, number>
  
  // NEW
  archivedClients: number
  onboardingStatus: {
    not_started: number
    in_progress: number
    completed: number
  }
  completionRate: number
  totalProjects: number
  completedProjects: number
  overdueProjects: number
  projectsPerClient: number
  contentThisWeek: number
  aiGenerations: number
  totalTokens: number
}
```

---

## STEP 4: Add New Stat Cards

In `/app/dashboard/analytics/page.tsx`, after the existing stat cards section (around line 100), add:

```typescript
{/* PHASE 1: New Metrics Row 1 - Client Details */}
{data?.stats && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
    <StatCard
      title="Archived Clients"
      value={data.stats.archivedClients}
      icon={<Users className="w-5 h-5" />}
      color="purple"
    />
    <StatCard
      title="Onboarding - Completed"
      value={data.stats.onboardingStatus.completed}
      icon={<CheckCircle2 className="w-5 h-5" />}
      color="green"
    />
    <StatCard
      title="Onboarding - In Progress"
      value={data.stats.onboardingStatus.in_progress}
      icon={<Activity className="w-5 h-5" />}
      color="blue"
    />
    <StatCard
      title="Completion Rate"
      value={`${data.stats.completionRate}%`}
      icon={<TrendingUp className="w-5 h-5" />}
      color="green"
    />
  </div>
)}

{/* PHASE 1: New Metrics Row 2 - Project Details */}
{data?.stats && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
    <StatCard
      title="Total Projects"
      value={data.stats.totalProjects}
      icon={<Folder className="w-5 h-5" />}
      color="blue"
    />
    <StatCard
      title="Completed Projects"
      value={data.stats.completedProjects}
      icon={<CheckCircle2 className="w-5 h-5" />}
      color="green"
    />
    <StatCard
      title="Overdue Projects"
      value={data.stats.overdueProjects}
      icon={<AlertCircle className="w-5 h-5" />}
      color="red"
    />
    <StatCard
      title="Projects per Client"
      value={data.stats.projectsPerClient.toFixed(1)}
      icon={<Folder className="w-5 h-5" />}
      color="purple"
    />
  </div>
)}

{/* PHASE 1: New Metrics Row 3 - Content & AI */}
{data?.stats && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
    <StatCard
      title="Content This Week"
      value={data.stats.contentThisWeek}
      icon={<FileText className="w-5 h-5" />}
      color="green"
    />
    <StatCard
      title="AI Generations"
      value={data.stats.aiGenerations}
      icon={<Activity className="w-5 h-5" />}
      color="purple"
    />
    <StatCard
      title="Tokens Used"
      value={formatTokens(data.stats.totalTokens)}
      icon={<Activity className="w-5 h-5" />}
      color="blue"
    />
    <StatCard
      title="Avg Tokens/Gen"
      value={data.stats.aiGenerations > 0 
        ? formatTokens(data.stats.totalTokens / data.stats.aiGenerations)
        : '0'
      }
      icon={<TrendingUp className="w-5 h-5" />}
      color="green"
    />
  </div>
)}
```

---

## STEP 5: Add Helper Function

Add this helper function at the bottom of the page (before the closing brace):

```typescript
function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}
```

---

## STEP 6: Add Missing Imports

At the top of `/app/dashboard/analytics/page.tsx`, make sure you have:

```typescript
import { 
  Users, 
  CheckCircle2, 
  FileText, 
  Activity, 
  TrendingUp, 
  Folder,
  AlertCircle  // Add if missing
} from 'lucide-react'
```

---

## STEP 7: Update StatCard to Handle String Values

The `StatCard` component currently expects `number` for value. Update it to accept strings too:

```typescript
function StatCard({
  title,
  value,
  icon,
  trend,
  color
}: {
  title: string
  value: number | string  // <-- Change this line
  icon: React.ReactNode
  trend?: number
  color: 'red' | 'blue' | 'green' | 'purple'
}) {
  // ... rest of component unchanged
}
```

---

## STEP 8: Test

1. Restart dev server: `npm run dev`
2. Navigate to `/dashboard/analytics`
3. You should see:
   - **Original 4 cards** (Clients, Active Projects, Content, Journal)
   - **NEW Row 1:** 4 cards for client/onboarding metrics
   - **NEW Row 2:** 4 cards for project metrics
   - **NEW Row 3:** 4 cards for content/AI metrics
   - **Total: 16 stat cards** showing comprehensive metrics

---

## Expected Result

### Before:
```
[4 stat cards]
[Time selector]
[4 charts]
[2 breakdown charts]
```

### After:
```
[4 stat cards - Original]
[4 stat cards - Client Details]
[4 stat cards - Project Details]  
[4 stat cards - Content & AI]
[Time selector]
[4 charts - Unchanged]
[2 breakdown charts - Unchanged]
```

**Total Metrics Visible:** From 10 → 25 metrics!

---

## Troubleshooting

### If you get TypeScript errors:
```bash
npx tsc --noEmit | grep analytics
```

### If data doesn't show:
1. Check browser console for errors
2. Check `/api/analytics` response in Network tab
3. Verify tables exist: `ai_generations`, `ai_executions`

### If ai_generations or ai_executions tables don't exist:
These may not be set up yet. Skip those metrics or return `0`:

```typescript
// Fallback if tables don't exist
let totalGenerations = 0
let totalTokens = 0

try {
  const { count } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  totalGenerations = count || 0
} catch (error) {
  console.log('ai_generations table not found, skipping')
}
```

---

## Next Steps

After Phase 1 is complete, move to:
- **Phase 2:** Add 6 new charts for visualization
- **Phase 3:** Add complex calculations (avg times, etc.)
- **Phase 4:** Activity heatmap and deep insights

---

## Summary

**Time:** 1-2 hours  
**Files Modified:** 2 (`route.ts`, `page.tsx`)  
**New Metrics:** 15  
**Complexity:** Easy (mostly COUNT queries)  
**Impact:** High (comprehensive overview of all activities)

