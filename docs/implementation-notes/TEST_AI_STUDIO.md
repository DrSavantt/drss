# AI Studio Testing Guide

## Quick Test Checklist

### Pre-requisites
- [ ] App is running (`npm run dev`)
- [ ] User is logged in
- [ ] At least one client exists
- [ ] At least one project exists for a client

---

## Test 1: Project Selector

### Test 1.1: Initial State
1. Navigate to `/dashboard/ai/generate`
2. **Expected**: Project dropdown is disabled
3. **Expected**: Placeholder says "Select client first"

### Test 1.2: Enable Project Dropdown
1. Select a client from the client dropdown
2. **Expected**: Project dropdown becomes enabled
3. **Expected**: Placeholder changes to "Select project..."
4. **Expected**: Projects load (check browser console for network request)

### Test 1.3: View Projects
1. Click on project dropdown
2. **Expected**: See "No project" option at top
3. **Expected**: See list of projects for selected client
4. **Expected**: No projects from other clients appear

### Test 1.4: Select Project
1. Select a project from dropdown
2. **Expected**: Project name appears in dropdown
3. **Expected**: Dropdown closes

### Test 1.5: Change Client
1. Change to a different client
2. **Expected**: Project dropdown resets to empty
3. **Expected**: New projects load for new client
4. **Expected**: Old project is no longer selected

### Test 1.6: Generate with Project
1. Select client: "Acme Corp"
2. Select project: "Website Redesign"
3. Enter prompt: "Write a headline for our new website"
4. Click "Generate Content"
5. **Expected**: Content generates successfully
6. **Expected**: If auto-save is on, content is saved
7. **Verify in Database**:
   ```sql
   SELECT title, client_id, project_id 
   FROM content_assets 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - **Expected**: `project_id` matches selected project

### Test 1.7: Generate without Project
1. Select client: "Acme Corp"
2. Leave project as "No project"
3. Enter prompt: "Write a headline"
4. Click "Generate Content"
5. **Expected**: Content generates successfully
6. **Verify in Database**:
   ```sql
   SELECT title, client_id, project_id 
   FROM content_assets 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - **Expected**: `project_id` is NULL

---

## Test 2: Generation History

### Test 2.1: Initial Load
1. Navigate to `/dashboard/ai/generate`
2. **Expected**: History section is collapsed by default
3. **Expected**: Shows "Recent Generations" header
4. **Expected**: Shows "Show" button with down chevron

### Test 2.2: Expand History (Empty State)
1. Click "Show" button
2. **Expected**: Section expands
3. **Expected**: If no history: Shows empty state with icon
4. **Expected**: Message: "No generation history yet"

### Test 2.3: Expand History (With Data)
1. Generate at least one piece of content first
2. Click "Show" button on history section
3. **Expected**: Section expands
4. **Expected**: Shows list of recent generations
5. **Expected**: Most recent generation is at top
6. **Expected**: Each item shows:
   - Truncated prompt (first 80 chars)
   - Model badge (e.g., "Claude Sonnet 4")
   - Client name (if applicable)
   - Date
   - Token count
   - Cost badge (green, right-aligned)

### Test 2.4: History Item Details
1. Look at a history item
2. **Verify**:
   - Prompt is truncated with "..." if > 80 chars
   - Model name is displayed correctly
   - Client name matches the client used
   - Date is formatted correctly (e.g., "12/26/2024")
   - Token count is displayed (e.g., "1234 tokens")
   - Cost is displayed with 4 decimal places (e.g., "$0.0023")

### Test 2.5: Load Generation from History
1. Click on any history item
2. **Expected**: Output area populates with that generation's content
3. **Expected**: Prompt field populates with original prompt
4. **Expected**: Client selector updates to that client
5. **Expected**: Metadata shows (model, cost, tokens)
6. **Expected**: "Saved" badge does NOT appear (it's a reload)

### Test 2.6: Collapse History
1. Click "Hide" button
2. **Expected**: Section collapses
3. **Expected**: Chevron points down
4. **Expected**: History list is hidden

### Test 2.7: History Auto-Refresh
1. Expand history section
2. Note the number of items
3. Generate new content
4. **Expected**: History automatically refreshes
5. **Expected**: New generation appears at top of list
6. **Expected**: Item count increases by 1

### Test 2.8: History Scrolling
1. Generate 15+ pieces of content (if needed)
2. Expand history section
3. **Expected**: List is scrollable
4. **Expected**: Max height is ~384px (24rem)
5. **Expected**: Scroll bar appears if > 10 items

---

## Test 3: Integration Tests

### Test 3.1: Full Workflow
1. Select client: "Acme Corp"
2. Select project: "Website Redesign"
3. Select content type: "Landing Page"
4. Select complexity: "Balanced"
5. Enter prompt: "Write a hero section for a SaaS product"
6. Enable auto-save
7. Click "Generate Content"
8. **Expected**: Content generates
9. **Expected**: Shows metadata (model, cost, tokens, "Saved" badge)
10. **Expected**: History refreshes and shows new item
11. Click on the new history item
12. **Expected**: Content reloads correctly

### Test 3.2: Client Switching
1. Select "Client A"
2. **Expected**: Projects for Client A load
3. Select "Project A1"
4. Switch to "Client B"
5. **Expected**: Project dropdown resets
6. **Expected**: Projects for Client B load
7. **Expected**: Project A1 is no longer selected

### Test 3.3: History with Multiple Clients
1. Generate content for "Client A"
2. Generate content for "Client B"
3. Generate content for "Client C"
4. Expand history
5. **Expected**: All generations appear
6. **Expected**: Each shows correct client name
7. Click on "Client A" generation
8. **Expected**: Client selector changes to "Client A"
9. **Expected**: Projects for Client A load

---

## Test 4: Error Handling

### Test 4.1: Network Error (Projects)
1. Disconnect internet or block API
2. Select a client
3. **Expected**: Project dropdown shows "Select project..."
4. **Expected**: Only "No project" option available
5. **Expected**: Console shows error (not user-facing)

### Test 4.2: Network Error (History)
1. Disconnect internet or block API
2. Reload page
3. Expand history section
4. **Expected**: Shows empty state OR error message
5. **Expected**: No crash or infinite loading

### Test 4.3: Invalid Client ID
1. Manually change URL or state to invalid client ID
2. Try to generate content
3. **Expected**: Error message appears
4. **Expected**: No crash

---

## Test 5: Performance

### Test 5.1: Project Loading Speed
1. Select a client with many projects (10+)
2. **Measure**: Time from selection to dropdown populated
3. **Expected**: < 500ms

### Test 5.2: History Loading Speed
1. Have 20+ generations in history
2. Reload page
3. **Measure**: Time from page load to history available
4. **Expected**: < 1 second

### Test 5.3: No Unnecessary Fetches
1. Open browser DevTools → Network tab
2. Select a client
3. **Expected**: ONE request to `/api/projects?client_id=...`
4. Select same client again
5. **Expected**: NO new request (uses cached data)

---

## Test 6: Edge Cases

### Test 6.1: Client with No Projects
1. Create a client with no projects
2. Select that client
3. **Expected**: Project dropdown shows only "No project"
4. **Expected**: Can still generate content

### Test 6.2: Very Long Prompt in History
1. Generate content with a 500+ character prompt
2. Expand history
3. **Expected**: Prompt is truncated to 80 chars + "..."
4. **Expected**: No layout issues

### Test 6.3: Generation with $0 Cost
1. Use Gemini Flash (free model)
2. Generate content
3. Expand history
4. **Expected**: Shows "$0.0000"
5. **Expected**: Still displays correctly

### Test 6.4: Generation without Client
1. Try to generate without selecting client
2. **Expected**: Generate button is disabled
3. **Expected**: Cannot proceed

---

## Test 7: Browser Compatibility

### Test 7.1: Chrome/Edge
- [ ] All features work
- [ ] Dropdowns render correctly
- [ ] History scrolls smoothly

### Test 7.2: Firefox
- [ ] All features work
- [ ] Dropdowns render correctly
- [ ] History scrolls smoothly

### Test 7.3: Safari
- [ ] All features work
- [ ] Dropdowns render correctly
- [ ] History scrolls smoothly

---

## Test 8: Mobile Responsiveness

### Test 8.1: Mobile View (< 768px)
1. Resize browser to mobile width
2. **Expected**: Configuration and Output stack vertically
3. **Expected**: Project dropdown is full width
4. **Expected**: History items are full width
5. **Expected**: All text is readable

### Test 8.2: Tablet View (768px - 1024px)
1. Resize browser to tablet width
2. **Expected**: Layout adjusts appropriately
3. **Expected**: All features remain accessible

---

## Database Verification Queries

### Check Recent Generations
```sql
SELECT 
  ae.id,
  ae.task_type,
  ae.created_at,
  c.name as client_name,
  am.display_name as model_name,
  ae.total_cost_usd,
  ae.input_tokens + ae.output_tokens as total_tokens
FROM ai_executions ae
LEFT JOIN clients c ON ae.client_id = c.id
LEFT JOIN ai_models am ON ae.model_id = am.id
WHERE ae.user_id = '[YOUR_USER_ID]'
ORDER BY ae.created_at DESC
LIMIT 10;
```

### Check Content with Project Links
```sql
SELECT 
  ca.id,
  ca.title,
  c.name as client_name,
  p.name as project_name,
  ca.created_at
FROM content_assets ca
LEFT JOIN clients c ON ca.client_id = c.id
LEFT JOIN projects p ON ca.project_id = p.id
WHERE ca.metadata->>'ai_generated' = 'true'
ORDER BY ca.created_at DESC
LIMIT 10;
```

### Check Projects by Client
```sql
SELECT 
  p.id,
  p.name,
  c.name as client_name
FROM projects p
JOIN clients c ON p.client_id = c.id
ORDER BY c.name, p.name;
```

---

## API Testing (Optional)

### Test Projects API
```bash
# Get all projects
curl http://localhost:3000/api/projects

# Get projects for specific client
curl http://localhost:3000/api/projects?client_id=CLIENT_UUID_HERE
```

### Test History API
```bash
# Get recent history (default 20)
curl http://localhost:3000/api/ai/history

# Get limited history
curl http://localhost:3000/api/ai/history?limit=5
```

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No linter errors
- ✅ No TypeScript errors
- ✅ Proper error handling
- ✅ Good user experience
- ✅ Fast performance
- ✅ Correct data in database

---

## Troubleshooting

### Projects Not Loading
1. Check browser console for errors
2. Verify API endpoint: `/api/projects?client_id=...`
3. Check database: Does client have projects?
4. Check RLS policies on `projects` table

### History Not Loading
1. Check browser console for errors
2. Verify API endpoint: `/api/ai/history`
3. Check database: Do you have `ai_executions` records?
4. Check RLS policies on `ai_executions` table

### Content Not Saving with Project
1. Check browser console for errors
2. Verify `project_id` is being passed to `generateContent()`
3. Check database: Does `content_assets` have `project_id` column?
4. Check the saved record in database

---

## Report Issues

If any test fails, report with:
1. Test number and name
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser and version
6. Console errors (if any)
7. Network tab screenshot (if relevant)

