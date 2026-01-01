"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import { useSidebar } from "@/contexts/sidebar-context"
import { Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { collapsed, toggleMobile } = useSidebar()
  const [theme, setTheme] = useState<"dark" | "light">('dark')
  const [mounted, setMounted] = useState(false)

  // Load theme after mount (client-side only)
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('drss-theme') as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem('drss-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile Header - Only visible on mobile */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-b border-border z-30 lg:hidden">
        <div className="flex items-center justify-between h-full px-4">
          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              toggleMobile()
            }}
            className="text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <span className="font-semibold text-foreground">DRSS</span>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {!mounted ? (
              <Moon className="h-5 w-5" />
            ) : theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        "pt-16 lg:pt-0",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Desktop TopNav - Hidden on mobile */}
        <div className="hidden lg:block">
          <TopNav />
        </div>
        
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

