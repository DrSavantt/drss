# Questionnaire Server Action Timeout - Debug Instructions

## 🔬 DIAGNOSTIC TOOLS CREATED

### 1. Test API Route
**File**: `app/api/test-questionnaire-config/route.ts`

This API route isolates the database queries from the client-side context to help identify if the issue is:
- Supabase connection
- Database tables missing
- RLS policies blocking
- Query syntax errors

### 2. Enhanced Logging
**File**: `app/actions/questionnaire-config.ts`

Added comprehensive logging to both server actions:
- `getSections()` - Now logs every step
- `getQuestionsWithHelp()` - Now logs every step

### 3. RLS Fix Script
**File**: `supabase/fix_questionnaire_rls.sql`

SQL script to check and fix Row Level Security policies that might be blocking reads.

---

## 🧪 TESTING PROCEDURE

### TEST 1: API Route Test

1. **Open browser** and navigate to:
   ```
   http://localhost:3000/api/test-questionnaire-config
   ```

2. **Check the response** - You should see JSON output:

   **✅ Success Response:**
   ```json
   {
     "success": true,
     "sections": 8,
     "questions": 34,
     "help": 0,
     "sectionNames": [
       "Avatar Definition",
       "Dream Outcome & Value Equation",
       ...
     ],
     "firstSection": { "id": 1, "title": "Avatar Definition", ... }
   }
   ```

   **❌ Error Response:**
   ```json
   {
     "error": "relation \"questionnaire_sections\" does not exist",
     "code": "42P01"
   }
   ```
   OR
   ```json
   {
     "error": "permission denied for table questionnaire_sections",
     "code": "42501"
   }
   ```
   OR
   ```json
   {
     "error": "Supabase client is null"
   }
   ```

3. **Check server terminal** for console logs:
   ```
   [Test API] Starting...
   [Test API] Creating Supabase client...
   [Test API] Supabase client created ✓
   [Test API] Testing simple query...
   [Test API] Simple query worked ✓
   [Test API] Fetching all sections...
   [Test API] Sections fetched: 8
   [Test API] Fetching all questions...
   [Test API] Questions fetched: 34
   [Test API] ALL QUERIES SUCCESSFUL ✓
   ```

---

### TEST 2: Check Context Fetch Logs

1. **Hard refresh** the questionnaire page (Cmd+Shift+R)
2. **Click "Start Questionnaire"**
3. **Check browser console** for these logs:

   **Expected logs:**
   ```
   [Context] useEffect RAN - state: { isLoaded: false, isLoading: false }
   [Context] Proceeding with fetch...
   [Context] FETCH START
   [Context] Calling server actions...
   ```

4. **Check server terminal** for server action logs:

   **If working:**
   ```
   [getSections] SERVER ACTION CALLED
   [getSections] Creating Supabase client...
   [getSections] Supabase client created ✓
   [getSections] Querying database...
   [getSections] Query complete. Rows: 8 Error: none
   [getSections] Returning 8 sections
   
   [getQuestionsWithHelp] SERVER ACTION CALLED
   [getQuestionsWithHelp] Creating Supabase client...
   [getQuestionsWithHelp] Supabase client created ✓
   [getQuestionsWithHelp] Querying questions...
   [getQuestionsWithHelp] Questions query complete. Rows: 34 Error: none
   [getQuestionsWithHelp] Querying help...
   [getQuestionsWithHelp] Help query complete. Rows: 0 Error: none
   [getQuestionsWithHelp] Returning 34 questions with help
   ```

   **If timing out:**
   ```
   (no logs appear - hangs at "Calling server actions...")
   ```

   **If erroring:**
   ```
   [getSections] SERVER ACTION CALLED
   [getSections] Creating Supabase client...
   [getSections] Supabase client is NULL - check environment variables
   ```

---

## 🔍 DIAGNOSIS SCENARIOS

### Scenario A: "Supabase client is null"

**Cause**: Environment variables missing

**Fix**:
1. Check `.env.local` file exists:
   ```bash
   cd savant-marketing-studio
   ls -la .env.local
   ```

2. Verify it contains:
   ```bash
   cat .env.local | grep SUPABASE
   ```

   Should show:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

3. If missing, create `.env.local` with your Supabase credentials
4. Restart dev server:
   ```bash
   npm run dev
   ```

---

### Scenario B: "relation does not exist"

**Cause**: Database tables not created

**Fix**:
1. Run the migration:
   ```bash
   # In Supabase SQL Editor or via CLI:
   psql <your_connection_string> < supabase/migrations/20251224000000_questionnaire_config_tables.sql
   ```

2. Seed the data:
   ```bash
   psql <your_connection_string> < supabase/seed_questionnaire_config.sql
   ```

3. Verify tables exist:
   ```sql
   SELECT COUNT(*) FROM questionnaire_sections;  -- Should be 8
   SELECT COUNT(*) FROM questionnaire_questions; -- Should be 34
   ```

---

### Scenario C: "permission denied"

**Cause**: RLS policies blocking access

**Fix**:
1. Run the RLS fix script:
   ```bash
   psql <your_connection_string> < supabase/fix_questionnaire_rls.sql
   ```

2. This will:
   - Enable RLS on all questionnaire tables
   - Create policies allowing authenticated users to read
   - Verify policies are in place

3. Alternatively, in Supabase Dashboard:
   - Go to Database → Tables → `questionnaire_sections`
   - Click "RLS disabled" button to enable it
   - Add policy: SELECT for authenticated users with `true` condition
   - Repeat for `questionnaire_questions` and `questionnaire_help`

---

### Scenario D: Server actions hang (no logs appear)

**Possible causes**:
1. **Server action import issue** - Context importing wrong functions
2. **Cookies/headers issue** - Server client creation hanging
3. **Network timeout** - Supabase connection slow

**Fix**:
1. Check if API route works (TEST 1 above)
   - If API works but server actions don't, it's an import/calling issue
   - If API also hangs, it's a Supabase connection issue

2. Check Supabase connection:
   ```bash
   # Test connection directly
   psql <your_connection_string>
   ```

3. If connection is slow, check Supabase dashboard for:
   - Database health
   - Ongoing operations
   - Connection pool status

---

## 📊 EXPECTED OUTCOMES

### ✅ Success Case
- API route returns sections and questions counts
- Server terminal shows all log messages
- Context fetch completes in < 1 second
- Page loads with database config (not static fallback)
- Console shows: `[Context] STATE UPDATED - isLoaded should be TRUE now`

### ⚠️ Fallback Case (Current State)
- API route might timeout or error
- Server actions timeout after 5 seconds
- Page loads with static config fallback
- Questionnaire works but uses hardcoded questions
- Console shows: `[Context] Using static fallback data - page will render`

---

## 🎯 NEXT STEPS

Based on the TEST 1 result, follow the appropriate scenario fix above.

**Most Likely Issue**: RLS policies are blocking access (Scenario C)

**Quick Fix** (if Scenario C):
```bash
cd savant-marketing-studio
psql <your_connection_string> < supabase/fix_questionnaire_rls.sql
```

Then hard refresh and test again.

---

## 📝 REPORT BACK

Please provide:

1. **API Route Response** (from TEST 1):
   ```
   [Paste the JSON response or error here]
   ```

2. **Server Terminal Logs** (from TEST 2):
   ```
   [Paste the logs that appear when you click Start Questionnaire]
   ```

3. **Browser Console Logs** (from TEST 2):
   ```
   [Paste the [Context] and [getSections] logs]
   ```

This will tell us exactly what's causing the timeout!

