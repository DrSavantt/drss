# Analytics Dashboard Setup Guide

## Prerequisites
- Supabase project set up
- Database tables created (clients, projects, content_assets, journal_chats, journal_entries)
- User authenticated

## Setup Steps

### Step 1: Create RPC Function in Supabase

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- ============================================
-- RPC FUNCTION: count_journal_entries
-- ============================================
-- Returns the total count of journal entries for the authenticated user
-- Counts all entries across all chats owned by the user

CREATE OR REPLACE FUNCTION count_journal_entries()
RETURNS INTEGER AS $$
DECLARE
  entry_count INTEGER;
BEGIN
  -- Count journal entries for all chats owned by the current user
  SELECT COUNT(*) INTO entry_count
  FROM journal_entries je
  INNER JOIN journal_chats jc ON je.chat_id = jc.id
  WHERE jc.user_id = auth.uid();
  
  RETURN COALESCE(entry_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION count_journal_entries() TO authenticated;
```

5. Click **Run** or press `Cmd/Ctrl + Enter`
6. Verify success message appears

### Step 2: Test the RPC Function

Run this test query in SQL Editor:

```sql
-- Test the function (should return a number)
SELECT count_journal_entries();
```

Expected result: A number (e.g., 0, 15, 128)

### Step 3: Verify Code Changes

Ensure these files are updated:
- ✅ `app/api/analytics/route.ts` - Enhanced with stat cards data
- ✅ `app/dashboard/analytics/page.tsx` - Added StatCard and BreakdownCard components
- ✅ `supabase/migrations/20251220000001_add_count_journal_entries_rpc.sql` - Migration file created

### Step 4: Test the Analytics Page

1. Start the development server (if not running):
```bash
cd savant-marketing-studio
npm run dev
```

2. Navigate to: http://localhost:3000/dashboard/analytics

3. Verify the following elements appear:

#### Stat Cards (Top Row)
- [ ] **Total Clients** - Shows count with red icon
- [ ] **Active Projects** - Shows count with blue icon
- [ ] **Content Pieces** - Shows count with green icon
- [ ] **Journal Entries** - Shows count with purple icon
- [ ] **Growth Percentage** - Shows on Total Clients card (if data available)

#### Time Period Selector
- [ ] Three buttons: 7 Days, 30 Days, 90 Days
- [ ] Active period highlighted in red
- [ ] Clicking changes the time series data

#### Time Series Charts (4 Charts)
- [ ] **Client Growth** - Line chart in red
- [ ] **Projects Completed** - Line chart in green
- [ ] **Content Created** - Line chart in blue
- [ ] **Daily Activity** - Line chart in purple

#### Breakdown Charts (Bottom Row)
- [ ] **Content by Type** - Bar chart showing distribution
- [ ] **Projects by Status** - Bar chart showing distribution

### Step 5: Test Data Updates

#### Add a Client
1. Go to Clients page
2. Add a new client
3. Return to Analytics
4. Verify "Total Clients" count increased

#### Complete a Project
1. Go to Projects page
2. Change a project status to "done"
3. Return to Analytics
4. Verify "Active Projects" count decreased

#### Create Content
1. Go to Content Library
2. Add a new content piece
3. Return to Analytics
4. Verify "Content Pieces" count increased

#### Add Journal Entry
1. Go to Journal page
2. Create a new entry
3. Return to Analytics
4. Verify "Journal Entries" count increased

### Step 6: Test Responsive Design

#### Mobile (< 768px)
- [ ] Stat cards stack vertically (1 column)
- [ ] Time period buttons scroll horizontally
- [ ] Charts stack vertically (1 column)
- [ ] All text is readable
- [ ] Tap targets are at least 44px

#### Tablet (768px - 1024px)
- [ ] Stat cards show 2 columns
- [ ] Charts stack vertically (1 column)

#### Desktop (> 1024px)
- [ ] Stat cards show 4 columns
- [ ] Time series charts show 2 columns
- [ ] Breakdown charts show 2 columns

## Troubleshooting

### Issue: "Function count_journal_entries does not exist"

**Symptoms:**
- Analytics page shows error
- Console shows RPC error
- Journal Entries stat shows 0 or error

**Solution:**
1. Open Supabase SQL Editor
2. Run the RPC function creation SQL (Step 1)
3. Verify with test query (Step 2)
4. Refresh analytics page

### Issue: Stat cards show 0 for everything

**Possible Causes:**
1. No data in database yet
2. RLS policies blocking access
3. User not authenticated

**Solution:**
1. Add some test data (clients, projects, content)
2. Verify RLS policies allow user access
3. Check authentication status
4. Look for errors in browser console

### Issue: Growth percentage shows NaN or Infinity

**Cause:** No clients in previous period (division by zero)

**Solution:** This is expected behavior when there's no historical data. The code handles this:
```typescript
const clientGrowth = clientsLastMonth && clientsLastMonth > 0
  ? Math.round(((clientsThisMonth || 0) - clientsLastMonth) / clientsLastMonth * 100)
  : 0
```

### Issue: Charts not rendering

**Possible Causes:**
1. recharts not installed
2. Data format incorrect
3. Browser compatibility

**Solution:**
1. Install recharts: `npm install recharts`
2. Check browser console for errors
3. Verify data structure in Network tab

### Issue: Slow page load

**Possible Causes:**
1. Large dataset
2. Missing database indexes
3. Complex RLS policies

**Solution:**
1. Check query performance in Supabase dashboard
2. Verify indexes exist on:
   - clients.user_id
   - projects.client_id
   - content_assets.client_id
   - journal_entries.chat_id
   - journal_chats.user_id
3. Consider caching strategy for production

## Performance Benchmarks

### Expected Load Times
- **Initial page load**: < 2 seconds
- **Period change**: < 500ms
- **Data refresh**: < 1 second

### Database Query Times
- **Total clients**: ~50ms
- **Active projects**: ~50ms
- **Total content**: ~50ms
- **Journal entries**: ~100ms (RPC with join)
- **Time series data**: ~200ms each
- **Total API response**: ~500ms (parallel queries)

## Database Indexes

Verify these indexes exist for optimal performance:

```sql
-- Check existing indexes
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'projects', 'content_assets', 'journal_chats', 'journal_entries')
ORDER BY tablename, indexname;
```

Required indexes:
- `idx_clients_user_id` on clients(user_id)
- `idx_projects_client_id` on projects(client_id)
- `idx_content_assets_client_id` on content_assets(client_id)
- `idx_journal_chats_user_id` on journal_chats(user_id)
- `idx_journal_entries_chat_id` on journal_entries(chat_id)

## Security Considerations

### RLS Policies
The RPC function uses `auth.uid()` to ensure users only see their own data:

```sql
WHERE jc.user_id = auth.uid()
```

### API Route Protection
The API route verifies authentication:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Data Isolation
All queries filter by user_id or client_id to ensure data isolation.

## Production Deployment

### Pre-Deployment Checklist
- [ ] RPC function created in production database
- [ ] Indexes verified
- [ ] RLS policies tested
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Responsive design verified
- [ ] Browser compatibility tested

### Deployment Steps
1. Run migration in production Supabase:
   ```sql
   -- Run in production SQL Editor
   CREATE OR REPLACE FUNCTION count_journal_entries() ...
   ```

2. Deploy code changes:
   ```bash
   git push origin main
   ```

3. Verify in production:
   - Visit analytics page
   - Check all metrics load
   - Test period changes
   - Verify responsive design

### Monitoring
- Monitor API response times
- Check error rates in logs
- Track user engagement with analytics
- Monitor database query performance

## Success Criteria

✅ All stat cards display real data
✅ Growth percentage calculates correctly
✅ Time series charts render smoothly
✅ Breakdown charts show distributions
✅ Page loads in < 2 seconds
✅ Responsive on all devices
✅ No console errors
✅ Data updates in real-time

## Next Steps

After successful setup:
1. Monitor usage and performance
2. Gather user feedback
3. Consider additional metrics
4. Implement caching if needed
5. Add export functionality
6. Create automated reports

## Support

If you encounter issues not covered in this guide:
1. Check browser console for errors
2. Review Supabase logs
3. Verify RLS policies
4. Check database indexes
5. Review API response in Network tab

## Resources

- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Recharts Documentation](https://recharts.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

