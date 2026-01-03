"use client"

import { memo, useMemo } from "react"
import { Moon, Sun, Bell, User, Settings as SettingsIcon, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/app/actions/auth"

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface TopNavProps {
  user?: User | null
}

export const TopNav = memo(function TopNav({ user }: TopNavProps) {
  const [theme, setTheme] = useState<"dark" | "light">('dark') // Always start with 'dark' for SSR
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Compute display name and initials from user data
  const { displayName, displayEmail, initials } = useMemo(() => {
    const fullName = user?.user_metadata?.full_name
    const email = user?.email
    
    const name = fullName || email?.split('@')[0] || 'User'
    const emailDisplay = email || 'user@drss.studio'
    
    // Generate initials from name
    const nameInitials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
    
    return {
      displayName: name,
      displayEmail: emailDisplay,
      initials: nameInitials
    }
  }, [user])

  // Load saved theme after mount (client-side only)
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('drss-theme') as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      document.documentElement.classList.toggle('light', savedTheme === 'light')
    }
  }, [])

  // Save theme when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('drss-theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.documentElement.classList.toggle('light', theme === 'light')
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-border bg-background px-6">
      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
        {!mounted ? (
          // Placeholder during SSR - use same icon as default theme
          <Moon className="h-5 w-5" />
        ) : theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Bell className="h-5 w-5" />
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => router.push('/dashboard/settings')}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => router.push('/dashboard/settings')}
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
})

TopNav.displayName = 'TopNav'
