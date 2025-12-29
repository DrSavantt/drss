# PHASE 1.2-1.4: ERROR HANDLING & STABILITY - CURSOR PROMPT

🎯 **MODEL RECOMMENDATION:** Expensive (Claude Sonnet or GPT-4)
This requires understanding error boundaries and React patterns.

---

## [COPY THIS INTO CURSOR]

```
TASK: Add error boundaries and loading states throughout the app

CONTEXT:
The app needs proper error handling and user feedback for async operations.

REQUIREMENTS:

## 1. Add Error Boundaries

Create error boundary components at layout level:

**File: components/error-boundary.tsx**
```typescript
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service in production
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.href = '/dashboard'
              }}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Wrap layouts with error boundaries:**

In `app/dashboard/layout.tsx`, wrap the content:
```typescript
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary>
      {/* existing layout code */}
      {children}
    </ErrorBoundary>
  )
}
```

Do the same for:
- app/layout.tsx (global boundary)
- app/form/[token]/layout.tsx (public form boundary)

## 2. Add Loading States to All Form Buttons

Find all buttons that trigger async actions and add loading states.

**Pattern to follow:**
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function MyForm() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await someServerAction()
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

**Apply this pattern to:**
- All client creation/edit forms
- All project creation/edit forms
- All content creation/edit forms
- Questionnaire submit buttons
- Journal entry submissions
- File upload buttons
- Delete confirmation buttons

## 3. Complete Incomplete Components

**File: app/components/tag-modal.tsx**

This component has a TODO marker. Review and complete it:
- If it's used anywhere, complete the functionality
- If it's not used, remove the file
- If it's partial, finish the implementation

Check these files for TODOs:
- app/components/tag-modal.tsx
- components/journal/journal-sidebar.tsx

For each TODO:
- If it's critical functionality, implement it
- If it's a nice-to-have, add to backlog and remove TODO comment
- If it's obsolete, remove the comment

## 4. Add Global Loading Indicator

Create a global loading bar for route transitions.

**File: components/loading-bar.tsx**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function LoadingBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div className="h-full bg-red-primary animate-pulse" />
    </div>
  )
}
```

Add to app/layout.tsx:
```typescript
import { LoadingBar } from '@/components/loading-bar'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoadingBar />
        {children}
      </body>
    </html>
  )
}
```

## 5. Verification

After implementation:
- Click every button → should show loading state
- Trigger an error → should show error boundary
- Navigate between pages → should show loading bar
- Check console → no React errors

OUTPUT:
- List of all forms updated with loading states
- Confirmation error boundaries are in place
- Status of TODO items (completed/removed/backlogged)
```

## [END CURSOR PROMPT]

---

📋 **AFTER CURSOR COMPLETES:**

1. **Test:** Click every button in the app
2. **Expected:** All show loading states during async operations
3. **Test:** Trigger error (disconnect network, submit form)
4. **Expected:** Error boundary catches it, shows friendly message
5. **Commit:** `feat: add error boundaries and loading states throughout app`

---

**Phase 1 Complete:** App is now production-stable. Move to Phase 2.
