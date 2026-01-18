# Mobile Testing Checklist

This checklist should be used to manually verify mobile responsiveness and catch runtime issues that static code analysis cannot detect.

---

## Browser Setup

- [ ] Open Chrome DevTools (F12 or Cmd+Option+I)
- [ ] Toggle Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
- [ ] Test at these widths: 320px, 375px, 428px, 768px
- [ ] Test both portrait and landscape orientations
- [ ] Enable "Slow 3G" throttling to test loading states
- [ ] Clear cache between tests if needed

### Recommended Test Devices
| Device | Width | Pixel Ratio |
|--------|-------|-------------|
| iPhone SE | 320px | 2x |
| iPhone 12/13 | 390px | 3x |
| iPhone 14 Pro Max | 428px | 3x |
| iPad Mini | 768px | 2x |
| Samsung Galaxy S21 | 360px | 3x |

---

## Console Check Per Page

For each page, with DevTools Console open (filter: Errors & Warnings):

| Page | URL | Errors | Warnings | Notes |
|------|-----|--------|----------|-------|
| Dashboard | /dashboard | | | |
| Clients | /dashboard/clients | | | |
| Client Detail | /dashboard/clients/[id] | | | |
| Projects | /dashboard/projects/board | | | |
| Project Detail | /dashboard/projects/[id] | | | |
| AI Chat | /dashboard/ai/chat | | | |
| Analytics | /dashboard/analytics | | | |
| Journal | /dashboard/journal | | | |
| Content | /dashboard/content | | | |
| Public Form | /form/[token] | | | |
| Settings | /dashboard/settings | | | |
| Questionnaire Settings | /dashboard/settings/questionnaire | | | |
| Frameworks | /dashboard/frameworks | | | |
| Deep Research | /dashboard/deep-research | | | |
| Archive | /dashboard/archive | | | |

### Common Console Issues to Watch For
- ❌ `TypeError: Cannot read property of undefined`
- ❌ `ResizeObserver loop limit exceeded`
- ❌ `Failed to fetch` or network errors
- ❌ `Hydration mismatch` warnings
- ❌ `Missing key prop` warnings
- ❌ `Invalid DOM nesting` warnings
- ⚠️ `Component mounted/unmounted` memory leaks

---

## Visual Inspection Per Page

For each page at each breakpoint, verify:

| Check | 320px | 375px | 428px | 768px |
|-------|-------|-------|-------|-------|
| No horizontal scroll | | | | |
| Text readable (not tiny) | | | | |
| No overlapping elements | | | | |
| Buttons large enough (44px min) | | | | |
| Images not cropped badly | | | | |
| Tables scroll horizontally | | | | |
| Cards stack properly | | | | |

---

## Interaction Tests

For each page, test these interactions on mobile:

### Navigation
- [ ] All buttons clickable (no dead zones)
- [ ] All links work correctly
- [ ] Back navigation works
- [ ] Navigation menu opens/closes
- [ ] Active page is highlighted

### Forms
- [ ] Forms submit correctly
- [ ] Validation errors display properly
- [ ] Required field indicators visible
- [ ] Date pickers work
- [ ] File uploads work

### Modals & Overlays
- [ ] Modals open centered
- [ ] Modals closeable (X button and backdrop)
- [ ] Modal content scrollable if long
- [ ] Dropdowns position correctly
- [ ] Tooltips readable (not cut off)

### Scrolling
- [ ] Page scrolls smoothly
- [ ] No "stuck" areas
- [ ] Pull-to-refresh doesn't interfere (if applicable)
- [ ] Sticky headers work correctly
- [ ] Infinite scroll loads more (if applicable)

### Touch Interactions
- [ ] Tap targets at least 44x44px
- [ ] No hover-only interactions
- [ ] Swipe gestures work (if any)
- [ ] Long-press menus work (if any)

---

## Keyboard Tests (Virtual Keyboard)

Test on actual mobile device or Chrome DevTools with touch simulation:

- [ ] Input fields don't get covered by keyboard
- [ ] Can scroll to see focused input
- [ ] Form submission works with keyboard open
- [ ] Keyboard dismisses appropriately (on submit, outside tap)
- [ ] Number inputs show numeric keyboard
- [ ] Email inputs show email keyboard
- [ ] Autofill/autocomplete works

### Problem Areas to Check
- Fixed-position elements (headers, footers)
- Chat input areas
- Bottom-aligned forms
- Multi-step forms

---

## Accessibility Quick Check

### Images & Media
- [ ] No missing alt text on images
- [ ] Decorative images have empty alt=""
- [ ] Icons have aria-labels

### Focus Management
- [ ] All interactive elements focusable
- [ ] Focus order makes sense
- [ ] Focus visible (ring/outline)
- [ ] No focus traps

### Color & Contrast
- [ ] Text has 4.5:1 contrast ratio
- [ ] Large text has 3:1 contrast ratio
- [ ] Color not sole indicator of state

### Screen Reader
- [ ] VoiceOver (iOS) announces content
- [ ] TalkBack (Android) announces content
- [ ] ARIA labels are descriptive
- [ ] Dynamic content announced

---

## Performance Checks

- [ ] Page loads in < 3s on 3G
- [ ] No layout shifts during load (CLS)
- [ ] Images lazy-load correctly
- [ ] No janky scrolling
- [ ] Animations at 60fps

### Network Tab Checks
- [ ] No failed requests
- [ ] No unnecessary API calls
- [ ] Images appropriately sized
- [ ] Resources cached properly

---

## Test Results Log

### Date: ___________
### Tester: ___________
### Device/Browser: ___________

| Issue | Page | Severity | Screenshot | Status |
|-------|------|----------|------------|--------|
| | | | | |
| | | | | |
| | | | | |

### Severity Levels
- 🔴 **Critical**: App broken, blocking functionality
- 🟠 **High**: Feature broken but workaround exists
- 🟡 **Medium**: Usability issue, annoying but usable
- 🟢 **Low**: Cosmetic issue only

---

## Quick Reference Commands

### Chrome DevTools
```
Toggle Device Mode: Cmd+Shift+M (Mac) / Ctrl+Shift+M (Win)
Responsive Mode: Click "Responsive" dropdown
Throttling: Network tab > Throttling dropdown
Console Filter: Click "Default levels" to filter
```

### Lighthouse Mobile Audit
```
1. DevTools > Lighthouse tab
2. Select "Mobile" device
3. Check: Performance, Accessibility, Best Practices
4. Click "Analyze page load"
```

### Taking Screenshots
```
DevTools > Cmd+Shift+P > "Capture screenshot"
- Capture full size screenshot (entire page)
- Capture node screenshot (selected element)
```
