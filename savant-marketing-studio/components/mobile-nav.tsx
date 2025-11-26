'use client'

import { Menu, X, Home, Folder, Layout, FileText, BookOpen } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

interface MobileNavProps {
  userEmail: string | null
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/clients', icon: Folder, label: 'Clients' },
    { href: '/dashboard/projects/board', icon: Layout, label: 'Projects' },
    { href: '/dashboard/content', icon: FileText, label: 'Content' },
    { href: '/dashboard/journal', icon: BookOpen, label: 'Journal' },
  ]

  function isActiveRoute(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-charcoal border-b border-mid-gray z-50 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <Link href="/dashboard">
            <h1 className="text-red-primary font-bold text-xl">DRSS</h1>
          </Link>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-dark-gray rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X size={24} className="text-foreground" />
            ) : (
              <Menu size={24} className="text-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-pure-black/80 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`
        lg:hidden fixed top-0 right-0 bottom-0 w-64 bg-charcoal border-l border-mid-gray z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <nav className="pt-20 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all
                  ${isActive 
                    ? 'bg-dark-gray text-red-primary font-medium' 
                    : 'text-silver hover:text-foreground hover:bg-dark-gray'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* User Info & Logout */}
          <div className="mt-8 pt-6 border-t border-mid-gray">
            {userEmail && (
              <div className="px-4 mb-4">
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Account</p>
                <p className="text-sm text-light-gray truncate">{userEmail}</p>
              </div>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-primary hover:text-red-bright hover:bg-dark-gray transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </form>
          </div>
        </nav>
      </div>
    </>
  )
}
