"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// ============================================================================
// EXACT v0 CODE - Only user data fetching added
// ============================================================================

export function Settings() {
  const [theme, setTheme] = useState("dark")
  const [sidebar, setSidebar] = useState("expanded")
  const [autoSave, setAutoSave] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user')
        const data = await res.json()
        if (data.email) {
          setUserEmail(data.email)
          // Extract name from email (before @)
          const name = data.email.split('@')[0]
          setUserName(name.charAt(0).toUpperCase() + name.slice(1))
        }
        
        // Get current theme
        const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark'
        setTheme(currentTheme)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === 'dark' || newTheme === 'light') {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue={loading ? "" : userName} disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={loading ? "" : userEmail} disabled />
              </div>
              <div className="space-y-4">
                <Label>Change PIN</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input type="password" placeholder="Current PIN" />
                  <Input type="password" placeholder="New PIN" />
                  <Input type="password" placeholder="Confirm PIN" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure your AI generation defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="complexity">Default Complexity</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Gemini Flash / Haiku)</SelectItem>
                    <SelectItem value="balanced">Balanced (Claude Sonnet)</SelectItem>
                    <SelectItem value="best">Best (Claude Opus)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">Monthly AI Budget Alert</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="budget" type="number" defaultValue="50.00" className="pl-7" />
                </div>
                <p className="text-xs text-muted-foreground">You'll be notified when you reach this amount</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Generated Content</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save all AI-generated content to library
                  </p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temp">Default Temperature</Label>
                <Select defaultValue="0.7">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">0.3 - More focused</SelectItem>
                    <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                    <SelectItem value="0.7">0.7 - Creative</SelectItem>
                    <SelectItem value="0.9">0.9 - Very creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <RadioGroup value={theme} onValueChange={handleThemeChange} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="font-normal">
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="font-normal">
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="font-normal">
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <Label>Sidebar</Label>
                <RadioGroup value={sidebar} onValueChange={setSidebar} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expanded" id="expanded" />
                    <Label htmlFor="expanded" className="font-normal">
                      Expanded
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="collapsed" id="collapsed" />
                    <Label htmlFor="collapsed" className="font-normal">
                      Collapsed
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data */}
        <TabsContent value="data">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export and manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium">Export All Data</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download a complete export of all your clients, projects, content, and frameworks.
                </p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Export as JSON
                </Button>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium">Import Data</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Import data from a previous export or migrate from another tool.
                </p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Import from File
                </Button>
              </div>
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <Button variant="destructive" className="mt-4">
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

