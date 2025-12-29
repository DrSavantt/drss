# File Organization Guide

Quick reference for maintaining organized workspace structure.

## 📁 Where to Put New Files

### SQL Files

| File Type | Location | Naming Convention |
|-----------|----------|-------------------|
| New migrations | `supabase/migrations/` | `YYYYMMDD_descriptive_name.sql` |
| Migration copies (reference) | `_sql/migrations/` | `YYYY-MM-DD_descriptive_name.sql` |
| Schema definitions | `_sql/schema/` | `tablename_schema.sql` |
| Seed data | `_sql/seeds/` | `seed_tablename.sql` |
| Stored procedures | `_sql/functions/` | `fn_function_name.sql` |
| RLS policies | `_sql/schema/` | `rls_tablename.sql` |

### Documentation

| File Type | Location |
|-----------|----------|
| Implementation guides | `_docs/references/` |
| Feature planning | `_docs/plans/` |
| Fix documentation | `_docs/references/` |
| Session summaries | `_docs/references/` |
| Project README | Root directory |

### Code Files (Never Move!)

| File Type | Location |
|-----------|----------|
| React components | `components/` |
| App routes | `app/` |
| Utilities | `lib/` |
| React hooks | `hooks/` |
| Type definitions | `types/` |
| Static assets | `public/` |
| Global styles | `styles/` |

### Other Files

| File Type | Location |
|-----------|----------|
| Backup files | `_archive/backups/` |
| Old versions | `_archive/old-versions/` |
| Temporary notes | `_misc/` |
| Experiments | `_misc/` |
| Build scripts | `scripts/` |

## 🚫 Never Move These

Essential configuration files that must stay in root:

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.ts`, `next.config.js`, `next.config.mjs`
- `tailwind.config.js`, `tailwind.config.ts`
- `postcss.config.mjs`
- `components.json` (Shadcn UI)
- `middleware.ts`
- `next-env.d.ts`
- `.eslintrc.json`
- `.prettierrc`
- `.gitignore`
- `.env*` files
- `README.md`

## 📋 Quick Commands

### Check for clutter
```bash
# List non-essential files in root
find . -maxdepth 1 -type f | grep -v "package\|tsconfig\|next.config\|tailwind\|\.env\|middleware\|\.gitignore\|README"

# Find all SQL files
find . -name "*.sql" -type f 2>/dev/null

# Find all markdown files
find . -name "*.md" -type f 2>/dev/null

# Find backup files
find . -type f \( -name "*backup*" -o -name "*old*" -o -name "*.bak" \) 2>/dev/null
```

### Organize files
```bash
# Move SQL file to reference
cp supabase/migrations/YYYYMMDD_name.sql _sql/migrations/YYYY-MM-DD_descriptive_name.sql

# Move doc to references
mv NEW_DOC.md _docs/references/

# Archive old file
mv old_file.sql _archive/old-versions/
```

### View organization
```bash
# See organized structure
tree -L 2 _archive _docs _sql _misc

# Count organized files
echo "Migrations: $(ls -1 _sql/migrations/ | wc -l)"
echo "Schema: $(ls -1 _sql/schema/ | wc -l)"
echo "Docs: $(ls -1 _docs/references/ | wc -l)"
```

## 🎯 Best Practices

### SQL Files
1. **Always** keep original migrations in `supabase/migrations/` with timestamps
2. **Copy** (don't move) to `_sql/migrations/` for reference with clean names
3. Use descriptive names that explain what the migration does
4. Group related migrations by date in the filename

### Documentation
1. One topic per document
2. Use descriptive filenames (FEATURE_DESCRIPTION.md)
3. Keep README.md in root, everything else in `_docs/`
4. Implementation guides → `_docs/references/`
5. Future plans → `_docs/plans/`

### Archives
1. **Never delete** - archive instead
2. Use `_archive/old-versions/` for superseded files
3. Use `_archive/backups/` for pre-change backups
4. Keep archive files compressed if large

### Misc Files
1. Use `_misc/` for experiments and temporary work
2. Clean up `_misc/` weekly
3. Promote useful files to proper locations
4. Delete truly temporary files after use

## 🔄 Weekly Maintenance

1. Check root for new clutter files
2. Move any loose docs to `_docs/references/`
3. Review `_misc/` and clean up
4. Ensure new migrations have descriptive copies in `_sql/migrations/`
5. Archive any superseded files

## ✅ Organization Checklist

Before committing:
- [ ] Root directory only has essential config files
- [ ] All docs are in `_docs/`
- [ ] SQL files have descriptive names
- [ ] No duplicate files in multiple locations
- [ ] Old versions are archived, not deleted
- [ ] Application folders are untouched
- [ ] Supabase migrations are intact

---

**Last Updated:** December 23, 2024  
**Status:** ✅ Workspace Organized

