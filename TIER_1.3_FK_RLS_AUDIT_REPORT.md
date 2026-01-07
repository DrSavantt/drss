# TIER 1.3 - FOREIGN KEY AND RLS POLICY AUDIT REPORT

**Date:** January 7, 2026  
**Database:** wiplhwpnpirduknbymvz (production)  
**Context:** Post-Tier 1.2 cleanup (dropped `frameworks` and `framework_embeddings` tables)

---

## EXECUTIVE SUMMARY

✅ **Foreign Keys:** All foreign keys are valid. No orphaned constraints detected.  
✅ **RLS Status:** All 18 tables have RLS enabled.  
⚠️ **Policy Gaps:** 7 tables missing INSERT/UPDATE/DELETE policies (some intentional, some need review).  
✅ **No Orphaned Policies:** No policies reference the dropped tables.

---

## FOREIGN KEY AUDIT

### Valid Foreign Keys (28 total)

All foreign key relationships are valid and reference existing tables.

#### User Data Tables → auth.users (10 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| activity_log | user_id | auth.users.id | CASCADE | ✅ Valid |
| ai_executions | user_id | auth.users.id | CASCADE | ✅ Valid |
| ai_generations | user_id | auth.users.id | CASCADE | ✅ Valid |
| clients | user_id | auth.users.id | CASCADE | ✅ Valid |
| clients | deleted_by | auth.users.id | NO ACTION | ✅ Valid |
| component_templates | user_id | auth.users.id | CASCADE | ✅ Valid |
| journal_chats | user_id | auth.users.id | CASCADE | ✅ Valid |
| journal_entries | user_id | auth.users.id | NO ACTION | ✅ Valid |
| journal_folders | user_id | auth.users.id | CASCADE | ✅ Valid |
| marketing_frameworks | user_id | auth.users.id | CASCADE | ✅ Valid |

**Note:** All user_id FKs properly cascade on user deletion except `journal_entries.user_id` and `clients.deleted_by` (soft delete tracking).

#### Client Hierarchy (6 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| projects | client_id | clients.id | CASCADE | ✅ Valid |
| content_assets | client_id | clients.id | CASCADE | ✅ Valid |
| pages | client_id | clients.id | CASCADE | ✅ Valid |
| ai_executions | client_id | clients.id | SET NULL | ✅ Valid |
| ai_generations | client_id | clients.id | SET NULL | ✅ Valid |
| activity_log | client_id | clients.id | CASCADE | ✅ Valid |

#### Project Relationships (2 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| content_assets | project_id | projects.id | CASCADE | ✅ Valid |
| pages | project_id | projects.id | SET NULL | ✅ Valid |

#### Page Builder (2 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| component_instances | page_id | pages.id | CASCADE | ✅ Valid |
| component_instances | template_id | component_templates.id | NO ACTION | ✅ Valid |

#### AI System (2 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| ai_models | provider_id | ai_providers.id | CASCADE | ✅ Valid |
| ai_executions | model_id | ai_models.id | NO ACTION | ✅ Valid |

#### Marketing Frameworks (1 FK)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| framework_chunks | framework_id | marketing_frameworks.id | CASCADE | ✅ Valid |

**✅ VERIFIED:** References `marketing_frameworks` (correct canonical table), NOT the dropped `frameworks` table.

#### Journal System (2 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| journal_chats | folder_id | journal_folders.id | SET NULL | ✅ Valid |
| journal_entries | chat_id | journal_chats.id | CASCADE | ✅ Valid |

#### Content & Questionnaire (3 FKs)

| Table | Column | References | Delete Rule | Status |
|-------|--------|------------|-------------|--------|
| content_assets | parent_id | content_assets.id | SET NULL | ✅ Valid (self-ref) |
| journal_entries | converted_to_content_id | content_assets.id | NO ACTION | ✅ Valid |
| questionnaire_questions | section_id | questionnaire_sections.id | CASCADE | ✅ Valid |

---

### Invalid/Orphaned Foreign Keys

**NONE FOUND** ✅

All foreign keys reference valid, existing tables. No references to the dropped `frameworks` or `framework_embeddings` tables.

---

### Missing Foreign Keys (Recommended)

**NONE REQUIRED** ✅

All expected relationships have proper foreign key constraints.

---

## RLS POLICY AUDIT

### Summary Statistics

- **Total Tables:** 18 (excluding views)
- **Tables with RLS Enabled:** 18 (100%)
- **Total Policies:** 48
- **Tables with Complete CRUD Policies:** 11
- **Tables with Read-Only Policies:** 7

---

### Tables WITH Complete RLS Coverage (Full CRUD)

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| clients | 2 | 1 | 2 | 1 | ✅ OK |
| projects | 1 | 1 | 1 | 1 | ✅ OK |
| content_assets | 1 | 1 | 1 | 1 | ✅ OK |
| journal_chats | 1 | 1 | 1 | 1 | ✅ OK |
| journal_entries | 1 | 1 | 1 | 1 | ✅ OK |
| journal_folders | 1 | 1 | 1 | 1 | ✅ OK |
| marketing_frameworks | 1 | 1 | 1 | 1 | ✅ OK |

**Notes:**
- `clients` has 2 SELECT policies: one for authenticated users (owner), one for public questionnaire token access
- `clients` has 2 UPDATE policies: one for authenticated users (owner), one for public questionnaire submission
- All policies properly enforce `auth.uid() = user_id` pattern

---

### Tables WITH Partial RLS Coverage (Review Needed)

#### Activity Tracking (Missing UPDATE/DELETE - Intentional)

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| activity_log | 1 | 1 | 0 | 0 | ⚠️ Audit log - immutable after insert |
| ai_executions | 1 | 1 | 0 | 0 | ⚠️ Execution log - immutable |
| ai_generations | 1 | 1 | 0 | 0 | ⚠️ Generation log - immutable |

**Recommendation:** ✅ OK as-is. Audit tables should be immutable.

---

#### Reference/Config Tables (Public Read-Only)

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| ai_models | 1 | 0 | 0 | 0 | 📖 Reference data (public read) |
| ai_providers | 1 | 0 | 0 | 0 | 📖 Reference data (public read) |
| questionnaire_sections | 2 | 0 | 0 | 0 | 📖 Config data (public + auth read) |
| questionnaire_questions | 2 | 0 | 0 | 0 | 📖 Config data (public + auth read) |

**Policy Details:**
- `ai_models`: `"Anyone can view models"` (qual: `true`)
- `ai_providers`: `"Anyone can view providers"` (qual: `true`)
- `questionnaire_sections`: 
  - `"Anonymous can read enabled sections"` (qual: `enabled IS TRUE`)
  - `"Authenticated users can read all sections"` (qual: `true`)
- `questionnaire_questions`:
  - `"Anonymous can read enabled questions"` (qual: `enabled IS TRUE`)
  - `"Authenticated users can read all questions"` (qual: `true`)

**Recommendation:** ✅ OK as-is. These are managed via migrations, not user actions.

---

#### User Content Tables (Missing CRUD - NEEDS REVIEW)

| Table | SELECT | INSERT | UPDATE | DELETE | Issue |
|-------|--------|--------|--------|--------|-------|
| component_templates | 1 | 0 | 0 | 0 | ⚠️ Users should be able to create/edit templates |
| component_instances | 1 | 0 | 0 | 0 | ⚠️ Users should be able to create/edit instances |
| pages | 1 | 0 | 0 | 0 | ⚠️ Users should be able to create/edit pages |
| framework_chunks | 1 | 0 | 0 | 0 | ⚠️ Should support INSERT for RAG system |

**Current Policies:**
- `component_templates`: `"Users can access their own templates"` (qual: `auth.uid() = user_id`)
- `component_instances`: `"Users can access component instances for their pages"` (checks via `pages.client_id`)
- `pages`: `"Users can access pages for their clients"` (checks via `clients.user_id`)
- `framework_chunks`: `"Users can access chunks for their frameworks"` (checks via `marketing_frameworks.user_id`)

---

## POLICY ISSUES FOUND

### Critical Issues

**NONE** ✅

All policies reference valid tables and columns.

---

### Warnings - Missing CRUD Policies

| Table | Issue | Recommended Fix | Priority |
|-------|-------|-----------------|----------|
| component_templates | Missing INSERT/UPDATE/DELETE | Add policies for users to manage their templates | **HIGH** |
| component_instances | Missing INSERT/UPDATE/DELETE | Add policies for users to manage instances via pages | **HIGH** |
| pages | Missing INSERT/UPDATE/DELETE | Add policies for users to manage their pages | **HIGH** |
| framework_chunks | Missing INSERT/UPDATE/DELETE | Add policies for RAG chunk creation/updates | **MEDIUM** |

**Context:** These tables are actively used by the application but currently lack write policies. This may cause errors when users try to create/edit content.

---

### Orphaned Policy Check

**Query:** Searched all policies for references to `frameworks` or `framework_embeddings`.

**Result:** Found 1 policy mentioning "frameworks" in its logic:

```sql
-- framework_chunks policy (READ-ONLY)
"Users can access chunks for their frameworks"
qual: (EXISTS ( SELECT 1
   FROM marketing_frameworks
  WHERE ((marketing_frameworks.id = framework_chunks.framework_id) 
    AND (marketing_frameworks.user_id = auth.uid()))))
```

✅ **VERIFIED:** This policy correctly references `marketing_frameworks` (the canonical table), NOT the dropped `frameworks` table.

**Conclusion:** No orphaned policies found.

---

## SOFT DELETE PATTERNS

Several tables implement soft deletes:

| Table | Columns | Foreign Key | Notes |
|-------|---------|-------------|-------|
| clients | deleted_at, deleted_by | deleted_by → auth.users.id | ✅ Tracks who deleted |
| content_assets | deleted_at, is_archived | - | ⚠️ Dual pattern (deleted + archived) |
| journal_chats | deleted_at | - | ✅ Simple soft delete |
| journal_entries | deleted_at | - | ✅ Simple soft delete |
| projects | deleted_at | - | ✅ Simple soft delete |

**Recommendation:** Consider standardizing on one pattern. `content_assets` has both `deleted_at` AND `is_archived` which may be confusing.

---

## PRIORITY ACTIONS

### Tier 1.4 - Add Missing CRUD Policies (HIGH Priority)

1. **component_templates**
   - Add INSERT policy: `auth.uid() = user_id`
   - Add UPDATE policy: `auth.uid() = user_id`
   - Add DELETE policy: `auth.uid() = user_id`

2. **pages**
   - Add INSERT policy: User owns the client
   - Add UPDATE policy: User owns the client
   - Add DELETE policy: User owns the client

3. **component_instances**
   - Add INSERT policy: User owns the page's client
   - Add UPDATE policy: User owns the page's client
   - Add DELETE policy: User owns the page's client

4. **framework_chunks** (if RAG upload is needed)
   - Add INSERT policy: User owns the parent framework
   - Add UPDATE policy: User owns the parent framework
   - Add DELETE policy: User owns the parent framework

### Tier 1.5 - Soft Delete Standardization (MEDIUM Priority)

- Review `content_assets` dual delete/archive pattern
- Document intended behavior for each soft delete column
- Consider adding indexes on `deleted_at IS NULL` for performance

### Future Considerations

- Review if `journal_entries.user_id` should CASCADE instead of NO ACTION
- Consider adding UPDATE/DELETE policies to activity_log if archival is needed
- Add database functions to enforce soft delete patterns consistently

---

## VERIFICATION QUERIES

These queries can be run to verify the audit findings:

```sql
-- Check all foreign keys are valid
SELECT count(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
-- Expected: 28

-- Check all tables have RLS enabled
SELECT count(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 18

-- Check total policy count
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
-- Expected: 48

-- Verify no broken FKs to dropped tables
SELECT * FROM pg_constraint 
WHERE contype = 'f' 
  AND pg_get_constraintdef(oid) LIKE '%frameworks%'
  AND pg_get_constraintdef(oid) NOT LIKE '%marketing_frameworks%';
-- Expected: 0 rows
```

---

## CONCLUSION

The database is in **good structural health** following the Tier 1.2 cleanup:

✅ All foreign keys are valid  
✅ No orphaned constraints or policies  
✅ RLS is enabled on all tables  
✅ Core user data tables have complete CRUD policies  
⚠️ Page builder and component system needs write policies added (Tier 1.4)  
⚠️ Soft delete patterns need standardization (Tier 1.5)  

**Next Steps:** Proceed to Tier 1.4 to add missing CRUD policies for the page builder system.

---

**End of Audit Report**  
**Generated:** January 7, 2026  
**Auditor:** Database Cleanup Tier 1.3  
**Status:** ✅ COMPLETE - Ready for Tier 1.4

