'use client'

import { create } from 'zustand'
import { Menu, X, Home, Folder, Layout, FileText, BookOpen, BarChart3 } from 'lucide-react'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { AnimatePresence, motion } from 'framer-motion'

interface MobileNavProps {
  userEmail: string | null
}

// Zustand store - guarantees state works across re-renders
const useMobileMenuStore = create<{
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))

export function MobileNav({ userEmail }: MobileNavProps) {
  const { isOpen, close, toggle } = useMobileMenuStore()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/dashboard/clients', icon: Folder, label: 'Clients' },
    { href: '/dashboard/projects/board', icon: Layout, label: 'Projects' },
    { href: '/dashboard/content', icon: FileText, label: 'Content' },
    { href: '/dashboard/journal', icon: BookOpen, label: 'Journal' },
  ]

  function isActiveRoute(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Auto-close on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, close])

  return (
    <>
      {/* Fixed Mobile Header - Respects iOS Safe Area */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border z-50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(4rem + env(safe-area-inset-top))'
        }}
      >
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" onClick={close}>
            <h1 className="text-red-primary font-bold text-xl">DRSS</h1>
          </Link>
          <button
            onClick={toggle}
            className="p-2 hover:bg-surface-highlight rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Centered Blur Modal Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Centered menu modal */}
            <div className="lg:hidden fixed inset-0 z-[101] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-surface border border-border rounded-lg shadow-xl max-w-sm w-full max-h-[85vh] overflow-y-auto"
              >
                {/* Menu header */}
                <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={close}
                    className="p-2 hover:bg-surface-highlight rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-silver hover:text-foreground" />
                  </button>
                </div>

                {/* Menu items */}
                <nav className="p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveRoute(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[48px]
                          ${isActive
                            ? 'bg-red-primary/10 text-red-primary font-medium border border-red-primary/20'
                            : 'text-foreground hover:bg-surface-highlight'
                          }
                        `}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}

                  {/* Theme Toggle */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-silver uppercase tracking-wide mb-2 px-4">Appearance</p>
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-surface-highlight min-h-[48px]">
                      <span className="text-sm text-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>

                  {/* User & Logout */}
                  {userEmail && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-silver uppercase tracking-wide mb-2 px-4">Account</p>
                      <p className="text-sm text-foreground px-4 mb-3 truncate">{userEmail}</p>
                      <form action={logout}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-primary hover:bg-surface-highlight transition-colors min-h-[48px]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </form>
                    </div>
                  )}
                </nav>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
