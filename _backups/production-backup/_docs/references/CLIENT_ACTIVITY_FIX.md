# Client-Specific Activity Log Fix

## Problem
The "Recent Activity" section on client detail pages showed ALL activities across the entire app instead of activities specific to that client. Every client detail page displayed identical activity entries.

## Solution Implemented

### 1. Database Schema Update
**File:** `supabase/migrations/20251223000002_add_client_id_to_activity_log.sql`

- Added `client_id` column to `activity_log` table
- Added index for efficient filtering: `idx_activity_log_client_id`
- Backfilled existing activities:
  - Client activities: `client_id = entity_id`
  - Project activities: Looked up from `projects.client_id`
  - Content activities: Looked up from `content_assets.client_id`

**To apply:** Run this migration in Supabase SQL Editor

### 2. Activity Logging Function Update
**File:** `lib/activity-log.ts`

- Added optional `clientId` parameter to `LogActivityParams` interface
- Updated `logActivity()` function to save `client_id` when provided
- All activity logs now include the related client ID

### 3. API Route Update
**File:** `app/api/activity-log/route.ts`

- Added support for `client_id` query parameter
- When `client_id` is provided, filters activities to only that client
- When not provided, returns all activities (for dashboard view)

**Usage:**
```typescript
// Get all activities (dashboard)
GET /api/activity-log?limit=10

// Get client-specific activities
GET /api/activity-log?client_id=abc-123&limit=10
```

### 4. Updated All Activity Logging Calls

Updated all `logActivity()` calls across the codebase to include `clientId`:

**Clients** (`app/actions/clients.ts`):
- `client_created` → `clientId: data.id`
- `client_updated` → `clientId: id`
- `client_deleted` → `clientId: id`

**Projects** (`app/actions/projects.ts`):
- `project_created` → `clientId: data.client_id`
- `project_updated` → `clientId: currentProject?.client_id`
- `project_status_changed` → `clientId: project?.client_id`
- `project_deleted` → `clientId: clientId`

**Content** (`app/actions/content.ts`):
- `content_created` → `clientId: clientId`
- `content_updated` → `clientId: currentContent?.client_id`
- `content_deleted` → `clientId: clientId`
- `file_uploaded` → `clientId: clientId`

**Questionnaire** (`app/actions/questionnaire.ts`):
- `questionnaire_completed` → `clientId: clientId`
- `questionnaire_updated` → `clientId: clientId`

## How It Works Now

1. **Client Detail Page** (`/dashboard/clients/[id]`):
   - Fetches: `GET /api/activity-log?client_id=abc-123&limit=4`
   - Shows only activities for that specific client
   - Includes: client updates, projects, content, questionnaires for that client

2. **Dashboard** (`/dashboard`):
   - Fetches: `GET /api/activity-log?limit=10`
   - Shows all activities across all clients (unchanged behavior)

3. **New Activities**:
   - All new activities automatically include `client_id`
   - Properly filtered when viewing client detail pages

## Testing

After running the migration, test:

1. ✅ Go to Client A's detail page → Should only show Client A's activities
2. ✅ Go to Client B's detail page → Should only show Client B's activities
3. ✅ Go to main dashboard → Should show ALL activities (unchanged)
4. ✅ Create a new project for Client A → Activity appears on Client A's page only
5. ✅ Update Client B → Activity appears on Client B's page only

## Files Modified

1. `supabase/migrations/20251223000002_add_client_id_to_activity_log.sql` (NEW)
2. `lib/activity-log.ts`
3. `app/api/activity-log/route.ts`
4. `app/actions/clients.ts`
5. `app/actions/projects.ts`
6. `app/actions/content.ts`
7. `app/actions/questionnaire.ts`

## Notes

- The `client-detail.tsx` component was already correctly passing `client_id` parameter
- The API just wasn't reading it - now it does
- Existing activities are backfilled by the migration
- Future activities will automatically include `client_id`

