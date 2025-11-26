# EMERGENCY SCROLL FIX - DEPLOYMENT GUIDE

## What was wrong
The previous fixes used `position: fixed` and `overflow: hidden` on html/body which completely blocked ALL scrolling.

## What I fixed
1. **globals.css** - Removed aggressive positioning, kept only bounce prevention
2. **manifest.json** - Added unique PWA ID to prevent iOS interference with PocketOptions
3. **layout.tsx** - Simplified viewport settings

## How to deploy

### Step 1: Copy files to your project

```bash
# Copy globals.css
cp /path/to/downloads/globals.css app/globals.css

# Copy manifest.json  
cp /path/to/downloads/manifest.json public/manifest.json

# Copy layout.tsx
cp /path/to/downloads/layout.tsx app/layout.tsx
```

### Step 2: Test locally

```bash
npm run dev
```

Open http://localhost:3000

**Test checklist:**
- ✅ Can scroll on desktop
- ✅ Can scroll on mobile (Chrome DevTools)
- ✅ No white space at top when scrolling up
- ✅ No bounce past content
- ✅ Dashboard works normally

### Step 3: Deploy to Vercel

```bash
git add app/globals.css public/manifest.json app/layout.tsx
git commit -m "fix: restore scrolling and prevent PWA interference"
git push origin main
```

Vercel will auto-deploy.

### Step 4: Fix PocketOptions interference

After deploying:

1. **Delete DRSS from iPhone home screen**
2. **Delete PocketOptions from iPhone home screen** (temporarily)
3. Go to Safari → drss-mvp.vercel.app
4. Add to Home Screen (fresh install)
5. Test - should work without PocketOptions popup
6. Re-add PocketOptions if needed

The new manifest with `"id": "/?source=drss-pwa"` makes iOS treat them as separate apps.

## What changed

### globals.css
- ❌ Removed: `position: fixed` on html/body
- ❌ Removed: `overflow: hidden` on html/body  
- ✅ Kept: `overscroll-behavior: none` (prevents bounce)
- ✅ Kept: Safe area padding for notch
- ✅ Added: Custom scrollbar styling

### manifest.json
- ✅ Added: Unique `"id"` field
- ✅ Added: Query parameter to start_url
- ✅ Updated: More specific scope

### layout.tsx
- ✅ Simplified: Viewport meta tag
- ✅ Removed: Complex metadata viewport object
- ✅ Kept: PWA meta tags

## Testing on mobile

1. Open in Safari
2. Should scroll normally
3. Try to pull down at very top → should be locked (no white space)
4. Try to bounce at bottom → should be locked
5. Scroll in middle → should work smoothly

## If still broken

Clear Safari cache:
1. Settings → Safari → Clear History and Website Data
2. Restart iPhone
3. Visit site fresh
4. Add to home screen fresh

---

**Files are in your Downloads folder. Copy them over and deploy.** 🚀
