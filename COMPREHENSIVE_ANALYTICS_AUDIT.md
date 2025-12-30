# COMPREHENSIVE ANALYTICS AUDIT & IMPLEMENTATION PLAN

## Executive Summary

**Current State:** Basic analytics dashboard tracking 4 key metrics (clients, projects, content, journal)  
**Opportunity:** 50+ additional trackable metrics across 15+ database tables  
**Goal:** Create comprehensive "everything dashboard" showing ALL app activity

---

## PART 1: CURRENT STATE ANALYSIS

### ✅ What's Currently Tracked

**Dashboard Location:** `/dashboard/analytics`  
**API Endpoint:** `/api/analytics`  
**Visualization:** Recharts library (already installed)

#### Current Metrics (4 stat cards + 6 charts):

| Metric | Source | Type | Status |
|--------|--------|------|--------|
| Total Clients | `clients` table | Count | ✅ Working |
| Active Projects | `projects` table | Count (status != 'done') | ✅ Working |
| Total Content | `content_assets` table | Count | ✅ Working |
| Journal Entries | `journal_entries` RPC | Count | ✅ Working |
| Client Growth % | `clients` table | Trend | ✅ Working |
| Projects Completed | `projects` table | Time series | ✅ Working |
| Content Created | `content_assets` table | Time series | ✅ Working |
| Daily Activity | `activity_log` table | Time series | ✅ Working |
| Content by Type | `content_assets.asset_type` | Breakdown | ✅ Working |
| Projects by Status | `projects.status` | Breakdown | ✅ Working |

**Filters:** 7 days, 30 days, 90 days

---

## PART 2: ALL TRACKABLE METRICS (Complete Inventory)

### 📊 DATABASE TABLES AVAILABLE

Found **19 tables** with trackable data:

1. `clients` - Client profiles
2. `projects` - Project management
3. `content_assets` - Content library
4. `journal_entries` - Journal notes
5. `journal_chats` - AI journal conversations
6. `journal_folders` - Journal organization
7. `activity_log` - User actions
8. `ai_generations` - AI content generated
9. `ai_executions` - AI API calls
10. `ai_models` - AI model configurations
11. `marketing_frameworks` - Framework library
12. `framework_chunks` - Framework embeddings
13. `questionnaire_responses` - Completed questionnaires
14. `questionnaire_sections` - Questionnaire config
15. `questionnaire_questions` - Question config
16. `questionnaire_help` - Question help content
17. `client_questionnaire_overrides` - Custom forms
18. `client-files` - File uploads
19. `questionnaire-uploads` - Form file uploads

---

## PART 3: COMPREHENSIVE METRICS LIST (50+ Metrics)

### 👥 CLIENT METRICS (Priority: HIGH)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 1 | Total Clients | `clients` | `COUNT(*) WHERE deleted_at IS NULL` | ✅ Done |
| 2 | Active Clients | `clients` | `COUNT(*) WHERE deleted_at IS NULL` | ✅ Done |
| 3 | Archived Clients | `clients` | `COUNT(*) WHERE deleted_at IS NOT NULL` | Easy |
| 4 | Clients Onboarded (Complete) | `clients` | `COUNT(*) WHERE questionnaire_status = 'completed'` | Easy |
| 5 | Clients In Onboarding | `clients` | `COUNT(*) WHERE questionnaire_status = 'in_progress'` | Easy |
| 6 | Clients Not Started | `clients` | `COUNT(*) WHERE questionnaire_status = 'not_started'` | Easy |
| 7 | Onboarding Completion Rate | Calculated | `(completed / total) * 100` | Easy |
| 8 | New Clients This Week | `clients` | `COUNT(*) WHERE created_at >= 7 days ago` | Easy |
| 9 | New Clients This Month | `clients` | `COUNT(*) WHERE created_at >= 30 days ago` | ✅ Done |
| 10 | Avg Time to Complete Onboarding | `clients`, `questionnaire_responses` | Date diff calculation | Medium |
| 11 | Most Recent Client | `clients` | `ORDER BY created_at DESC LIMIT 1` | Easy |
| 12 | Client Growth Trend | `clients` | Time series by created_at | ✅ Done |

### 📁 PROJECT METRICS (Priority: HIGH)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 13 | Total Projects | `projects` | `COUNT(*) WHERE deleted_at IS NULL` | Easy |
| 14 | Active Projects | `projects` | `COUNT(*) WHERE status != 'done' AND deleted_at IS NULL` | ✅ Done |
| 15 | Completed Projects | `projects` | `COUNT(*) WHERE status = 'done'` | Easy |
| 16 | Backlog Projects | `projects` | `COUNT(*) WHERE status = 'backlog'` | Easy |
| 17 | In Progress Projects | `projects` | `COUNT(*) WHERE status = 'in_progress'` | Easy |
| 18 | In Review Projects | `projects` | `COUNT(*) WHERE status = 'in_review'` | Easy |
| 19 | Overdue Projects | `projects` | `COUNT(*) WHERE due_date < NOW() AND status != 'done'` | Easy |
| 20 | High Priority Projects | `projects` | `COUNT(*) WHERE priority = 'high' OR priority = 'urgent'` | Easy |
| 21 | Projects Completed This Week | `projects` | `COUNT(*) WHERE status = 'done' AND updated_at >= 7 days ago` | Easy |
| 22 | Projects Completed This Month | `projects` | Time series calculation | ✅ Done |
| 23 | Avg Time to Complete | `projects` | AVG(completed_at - created_at) | Medium |
| 24 | Projects per Client (Avg) | `projects`, `clients` | `COUNT(projects) / COUNT(clients)` | Easy |
| 25 | Completion Rate | Calculated | `(done / total) * 100` | Easy |

### 📄 CONTENT METRICS (Priority: HIGH)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 26 | Total Content Pieces | `content_assets` | `COUNT(*) WHERE deleted_at IS NULL` | ✅ Done |
| 27 | Content by Type (Breakdown) | `content_assets` | `GROUP BY asset_type` | ✅ Done |
| 28 | Content Created This Week | `content_assets` | `COUNT(*) WHERE created_at >= 7 days ago` | Easy |
| 29 | Content Created This Month | `content_assets` | Time series | ✅ Done |
| 30 | Content per Client (Avg) | `content_assets`, `clients` | `COUNT(content) / COUNT(clients)` | Easy |
| 31 | Most Used Content Type | `content_assets` | `GROUP BY asset_type ORDER BY COUNT DESC` | Easy |
| 32 | Total Storage Used | `content_assets` | `SUM(file_size)` if column exists | Medium |
| 33 | Recent Content (Last 7 days) | `content_assets` | `ORDER BY created_at DESC` | Easy |

### ✍️ JOURNAL METRICS (Priority: MEDIUM)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 34 | Total Journal Entries | `journal_entries` | `COUNT(*)` | ✅ Done |
| 35 | Entries This Week | `journal_entries` | `COUNT(*) WHERE created_at >= 7 days ago` | Easy |
| 36 | Entries This Month | `journal_entries` | `COUNT(*) WHERE created_at >= 30 days ago` | Easy |
| 37 | Total Journal Chats | `journal_chats` | `COUNT(*)` | Easy |
| 38 | Avg Entries per Day | `journal_entries` | `COUNT(*) / days_active` | Medium |
| 39 | Most Mentioned Clients | `journal_entries` | Parse `@mentions` from content | Hard |
| 40 | Most Used Tags | `journal_entries` | Parse `#tags` from content | Hard |
| 41 | Journal Folders Count | `journal_folders` | `COUNT(*)` | Easy |
| 42 | Entries per Folder | `journal_entries` | `GROUP BY folder_id` | Easy |

### 🤖 AI GENERATION METRICS (Priority: HIGH)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 43 | Total AI Generations | `ai_generations` | `COUNT(*)` | Easy |
| 44 | Generations This Week | `ai_generations` | `COUNT(*) WHERE created_at >= 7 days ago` | Easy |
| 45 | Generations This Month | `ai_generations` | `COUNT(*) WHERE created_at >= 30 days ago` | Easy |
| 46 | Generations by Type | `ai_generations` | `GROUP BY generation_type` | Easy |
| 47 | Total Tokens Used | `ai_executions` | `SUM(tokens_used)` | Easy |
| 48 | Estimated AI Cost | `ai_executions` | Calculate from tokens + model pricing | Medium |
| 49 | Most Used AI Model | `ai_executions` | `GROUP BY model ORDER BY COUNT DESC` | Easy |
| 50 | AI Generations per Client | `ai_generations` | `GROUP BY client_id` | Easy |
| 51 | Avg Tokens per Generation | `ai_executions` | `AVG(tokens_used)` | Easy |
| 52 | Total AI Executions | `ai_executions` | `COUNT(*)` | Easy |

### 📝 QUESTIONNAIRE METRICS (Priority: MEDIUM)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 53 | Questionnaires Sent | `clients` | `COUNT(*) WHERE questionnaire_token IS NOT NULL` | Easy |
| 54 | Questionnaires Completed | `questionnaire_responses` OR `clients` | `COUNT(*) WHERE status = 'completed'` | Easy |
| 55 | Questionnaires In Progress | `clients` | `COUNT(*) WHERE questionnaire_status = 'in_progress'` | Easy |
| 56 | Completion Rate | Calculated | `(completed / sent) * 100` | Easy |
| 57 | Avg Time to Complete | `questionnaire_responses` | Date diff calculation | Medium |
| 58 | Total Questions | `questionnaire_questions` | `COUNT(*) WHERE enabled = true` | Easy |
| 59 | Total Sections | `questionnaire_sections` | `COUNT(*) WHERE enabled = true` | Easy |
| 60 | Custom Forms Created | `client_questionnaire_overrides` | `COUNT(DISTINCT client_id)` | Easy |

### 📚 FRAMEWORK METRICS (Priority: LOW)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 61 | Total Frameworks | `marketing_frameworks` | `COUNT(*)` | Easy |
| 62 | Active Frameworks | `marketing_frameworks` | `COUNT(*) WHERE enabled = true` | Easy |
| 63 | Frameworks by Category | `marketing_frameworks` | `GROUP BY category` | Easy |
| 64 | Most Used Frameworks | Join with `ai_generations` | Complex query | Hard |
| 65 | Framework Embeddings Count | `framework_chunks` | `COUNT(*)` | Easy |

### 📊 ACTIVITY & SYSTEM METRICS (Priority: MEDIUM)

| # | Metric | Source | SQL | Complexity |
|---|--------|--------|-----|------------|
| 66 | Total Activities Logged | `activity_log` | `COUNT(*)` | Easy |
| 67 | Daily Activity Trend | `activity_log` | Time series by date | ✅ Done |
| 68 | Activities This Week | `activity_log` | `COUNT(*) WHERE created_at >= 7 days ago` | Easy |
| 69 | Most Active Day | `activity_log` | `GROUP BY DATE(created_at) ORDER BY COUNT DESC` | Easy |
| 70 | Actions per Client | `activity_log` | `GROUP BY client_id` | Easy |
| 71 | Total Uploaded Files | `client-files`, `questionnaire-uploads` | `COUNT(*)` | Easy |
| 72 | Storage Used (Total) | File storage buckets | Supabase Storage API | Hard |

---

## PART 4: RECOMMENDED DASHBOARD LAYOUT

### CURRENT LAYOUT:
```
[4 Stat Cards: Clients, Projects, Content, Journal]
[Time Period Selector: 7d, 30d, 90d]
[4 Line Charts: Client Growth, Projects Done, Content Created, Activity]
[2 Bar Charts: Content by Type, Projects by Status]
```

### PROPOSED COMPREHENSIVE LAYOUT:

```
┌─────────────────────────────────────────────────────────────────┐
│  ANALYTICS DASHBOARD                                    [Filters]│
│  Last 30 Days                          [7d] [30d] [90d] [All]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 OVERVIEW (Top Summary Cards)                                │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Total Clients│ Active Projects│ Content Pieces│ AI Generations │
│     24       │      15        │      156      │      89        │
│  ↑ 12%       │  ↓ 5%         │  ↑ 23%        │  ↑ 45%         │
└──────────────┴──────────────┴──────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  👥 CLIENT METRICS                                              │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Total: 24    │ Onboarded: 18│ In Progress: 4│ Not Started: 2  │
│ Completion Rate: 75%  │ New This Week: 3  │ Avg Onboard: 5d  │
│                                                                 │
│ [Client Growth Chart - Line]                                   │
│ [Onboarding Funnel Chart - Funnel/Bar]                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📁 PROJECT METRICS                                             │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Total: 48    │ Active: 15   │ Completed: 28 │ Overdue: 3       │
│ Completion Rate: 58% │ Avg Complete: 14d  │ Per Client: 2    │
│                                                                 │
│ [Projects by Status - Bar]  [Priority Distribution - Pie]     │
│ [Project Completion Trend - Line]                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📄 CONTENT METRICS                                             │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Total: 156   │ This Week: 12│ Per Client: 6.5│ Storage: 2.3 GB │
│                                                                 │
│ [Content by Type - Bar]  [Content Creation Trend - Line]      │
│ [Top 5 Content Types - List]                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI METRICS                                                  │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Generations: 89│ Tokens: 2.4M │ Cost: $3.20  │ This Week: 15   │
│                                                                 │
│ [AI Usage Trend - Line]  [Generations by Type - Bar]          │
│ [Token Usage by Model - Pie]  [Cost Trend - Line]             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✍️ JOURNAL METRICS                                             │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Entries: 234 │ This Week: 18│ Chats: 45    │ Folders: 8       │
│ Avg Per Day: 3.2  │ Most Tagged: #marketing  │ Top @: client-x │
│                                                                 │
│ [Journal Activity - Line]  [Top Tags - Bar]                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📝 QUESTIONNAIRE METRICS                                       │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Sent: 24     │ Completed: 18│ In Progress: 4│ Completion: 75% │
│ Avg Time: 5d │ Questions: 32│ Sections: 8  │ Custom: 3        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 ACTIVITY & SYSTEM                                           │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Actions: 1.2k│ This Week: 89│ Most Active: Mon│ Files: 234    │
│                                                                 │
│ [Daily Activity Heatmap - Calendar]  [Actions by Type - Pie]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 5: IMPLEMENTATION PLAN

### PHASE 1: Quick Wins (1-2 hours) - Priority: HIGH

**Add these 15 metrics with minimal code changes:**

1. **Archived Clients** - Simple count with `deleted_at IS NOT NULL`
2. **Clients by Onboarding Status** - 3 counts by questionnaire_status
3. **Onboarding Completion Rate** - Simple calculation
4. **Total Projects** - Add to existing query
5. **Completed Projects** - Count where status = 'done'
6. **Overdue Projects** - Count where due_date < NOW()
7. **Projects per Client** - Division
8. **Completion Rate %** - Calculation
9. **Content This Week** - Add time filter
10. **Content per Client** - Division
11. **Journal Entries This Week** - Add time filter
12. **Total AI Generations** - New query to `ai_generations`
13. **Generations This Month** - Time filter
14. **Total Tokens Used** - SUM from `ai_executions`
15. **Questionnaires Completed** - Count from `clients` or `questionnaire_responses`

**Implementation:**
- Add 10 new stat cards
- Update existing API endpoint `/api/analytics`
- No new charts needed yet

---

### PHASE 2: Enhanced Visualizations (2-3 hours) - Priority: HIGH

**Add these charts:**

1. **Onboarding Funnel** - Bar chart: Not Started → In Progress → Completed
2. **Projects by Priority** - Pie chart
3. **AI Usage Trend** - Line chart over time
4. **AI Cost Trend** - Line chart with $ values
5. **Token Usage by Model** - Pie chart
6. **Journal Activity** - Line chart over time

**Implementation:**
- Add 6 new chart components (reuse existing patterns)
- Fetch time series data for new charts
- Add proper date formatting

---

### PHASE 3: Advanced Metrics (3-4 hours) - Priority: MEDIUM

**Complex calculations:**

1. **Avg Time to Complete Onboarding** - Date math
2. **Avg Time to Complete Projects** - Date math
3. **Most Used Content Types** - Sorting and ranking
4. **Most Mentioned Clients** - Parse @mentions
5. **Most Used Tags** - Parse #tags
6. **AI Cost per Generation** - Division with model pricing
7. **Storage Used** - File size aggregation

**Implementation:**
- Add utility functions for date calculations
- Add parsing functions for mentions/tags
- Query optimization for performance

---

### PHASE 4: Activity Heatmap & Deep Insights (4-5 hours) - Priority: LOW

**Advanced visualizations:**

1. **Activity Heatmap** - Calendar view showing activity by day
2. **Client Activity Timeline** - Who's most active
3. **Framework Usage** - Which frameworks are used most
4. **Performance Trends** - Month-over-month comparisons
5. **Custom Date Range Picker** - Beyond 7/30/90 days

**Implementation:**
- Add calendar heatmap component
- Add date range picker
- Complex aggregation queries

---

## PART 6: SAMPLE QUERIES FOR TOP 10 METRICS

### 1. Clients by Onboarding Status
```typescript
// In /api/analytics route
const { data: clientsByStatus } = await supabase
  .from('clients')
  .select('questionnaire_status')
  .eq('user_id', user.id)
  .is('deleted_at', null)

const statusCounts = {
  not_started: 0,
  in_progress: 0,
  completed: 0
}

clientsByStatus?.forEach(c => {
  const status = c.questionnaire_status || 'not_started'
  statusCounts[status]++
})
```

### 2. Total AI Generations
```typescript
const { count: totalGenerations } = await supabase
  .from('ai_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
```

### 3. Total Tokens Used
```typescript
const { data: executions } = await supabase
  .from('ai_executions')
  .select('tokens_used')
  .eq('user_id', user.id)

const totalTokens = executions?.reduce((sum, e) => sum + (e.tokens_used || 0), 0) || 0
```

### 4. Estimated AI Cost
```typescript
// Model pricing (example)
const PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
  'claude-3': { input: 0.015, output: 0.075 }
}

const { data: executions } = await supabase
  .from('ai_executions')
  .select('model, tokens_used, completion_tokens')
  .eq('user_id', user.id)

let totalCost = 0
executions?.forEach(e => {
  const pricing = PRICING[e.model] || { input: 0.01, output: 0.03 }
  const inputCost = (e.tokens_used || 0) / 1000 * pricing.input
  const outputCost = (e.completion_tokens || 0) / 1000 * pricing.output
  totalCost += inputCost + outputCost
})
```

### 5. Overdue Projects
```typescript
const today = new Date().toISOString()

const { count: overdueProjects } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)
  .neq('status', 'done')
  .lt('due_date', today)
```

### 6. Projects per Client
```typescript
const { count: totalProjects } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)

const { count: totalClients } = await supabase
  .from('clients')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .is('deleted_at', null)

const projectsPerClient = totalClients > 0 
  ? (totalProjects / totalClients).toFixed(1)
  : 0
```

### 7. Content This Week
```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const { count: contentThisWeek } = await supabase
  .from('content_assets')
  .select('*', { count: 'exact', head: true })
  .in('client_id', clientIds)
  .is('deleted_at', null)
  .gte('created_at', sevenDaysAgo.toISOString())
```

### 8. Onboarding Completion Rate
```typescript
const { data: clients } = await supabase
  .from('clients')
  .select('questionnaire_status')
  .eq('user_id', user.id)
  .is('deleted_at', null)

const total = clients?.length || 0
const completed = clients?.filter(c => c.questionnaire_status === 'completed').length || 0

const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
```

### 9. AI Generations Trend
```typescript
// Similar to existing time series
const { data: generationsData } = await supabase
  .from('ai_generations')
  .select('created_at')
  .eq('user_id', user.id)
  .gte('created_at', startDate.toISOString())
  .order('created_at', { ascending: true })

const generationsTrend = processTimeSeries(generationsData || [], days, false)
```

### 10. Journal Entries This Week
```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const { count: entriesThisWeek } = await supabase
  .from('journal_entries')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', sevenDaysAgo.toISOString())
```

---

## PART 7: EFFORT ESTIMATION

### Summary by Phase:

| Phase | Metrics Added | Charts Added | Effort | Priority |
|-------|--------------|--------------|--------|----------|
| Phase 1 | 15 | 0 | 1-2 hours | HIGH |
| Phase 2 | 0 | 6 | 2-3 hours | HIGH |
| Phase 3 | 7 | 0 | 3-4 hours | MEDIUM |
| Phase 4 | 5 | 4 | 4-5 hours | LOW |
| **TOTAL** | **27 new metrics** | **10 new charts** | **10-14 hours** | - |

### Quick Start: Just Phase 1 + Phase 2 = Comprehensive Dashboard in 3-5 hours

---

## PART 8: RECOMMENDED NEXT STEPS

1. **Immediate (Today):** Implement Phase 1 - Add 15 stat card metrics
2. **This Week:** Implement Phase 2 - Add visualizations
3. **Next Week:** Implement Phase 3 - Advanced calculations
4. **Future:** Phase 4 - Activity heatmap and deep insights

### Files to Modify:

1. `/app/api/analytics/route.ts` - Add new queries
2. `/app/dashboard/analytics/page.tsx` - Add new stat cards and charts
3. Create `/lib/analytics/calculations.ts` - Utility functions

---

## APPENDIX A: TABLES NOT YET USED

These tables exist but aren't in analytics yet:
- `ai_models` - Could show which models are configured
- `ai_providers` - Could show provider distribution
- `client-files` - File upload counts
- `questionnaire-uploads` - Form file uploads
- `marketing_frameworks` - Framework usage

---

## APPENDIX B: MOCK DATA FOR TESTING

```typescript
// Add to analytics page for testing
const MOCK_DATA = {
  stats: {
    totalClients: 24,
    activeProjects: 15,
    totalContent: 156,
    journalEntries: 234,
    clientGrowth: 12,
    aiGenerations: 89,
    tokensUsed: 2400000,
    estimatedCost: 3.20,
    questionnairesCompleted: 18,
    overdueProjects: 3
  }
}
```

---

## CONCLUSION

**Current:** 10 metrics tracked  
**Possible:** 70+ metrics available  
**Recommended:** 37 high-priority metrics  
**Effort:** 10-14 hours total  
**Quick Win:** 3-5 hours gets 80% value  

The foundation is already built (Recharts, API structure). Just need to add queries and display components.

