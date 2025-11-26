# 🚨 SCROLL FIX - QUICK REFERENCE

## What I did
Created 3 fixed files for you to copy over:

1. ✅ **globals.css** - Proper scroll handling (no position: fixed)
2. ✅ **manifest.json** - Unique PWA ID (prevents PocketOptions popup)
3. ✅ **layout.tsx** - Simple viewport settings

## Copy these files

Replace these in your project:
- `app/globals.css` → [Download from outputs]
- `public/manifest.json` → [Download from outputs]  
- `app/layout.tsx` → [Download from outputs]

## Deploy

```bash
git add .
git commit -m "fix: restore scrolling"
git push origin main
```

## Fix PocketOptions popup

After deploy:
1. Delete BOTH apps from home screen
2. Re-add DRSS to home screen (fresh)
3. PocketOptions won't interfere anymore

## Key changes

❌ **REMOVED** (was breaking scroll):
- `position: fixed` on html/body
- `overflow: hidden` on html/body

✅ **KEPT** (prevents white space):
- `overscroll-behavior: none`
- Safe area padding
- Pull-to-refresh prevention

✅ **ADDED** (fixes PWA interference):
- Unique `id` in manifest
- Custom start_url with query param

---

**The files are ready. Just copy and deploy.** 🚀
