"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { updateUserProfile } from "@/app/actions/settings"
import { Download, Upload, Loader2 } from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"

// Dynamic import for QuestionnaireSettings to reduce initial bundle
// dnd-kit (~30kb) only loads when the Questionnaire tab is clicked
const QuestionnaireSettings = dynamic(
  () => import("@/components/settings/questionnaire-settings").then(mod => mod.QuestionnaireSettings),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    ),
    ssr: false
  }
)

// ============================================================================
// EXACT v0 CODE - Only user data fetching added + Questionnaire tab
// ============================================================================

export function Settings() {
  const { collapsed, setCollapsed } = useSidebar()
  const [theme, setTheme] = useState("dark")
  const [autoSave, setAutoSave] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  
  // AI Configuration states
  const [defaultComplexity, setDefaultComplexity] = useState("balanced")
  const [monthlyBudgetAlert, setMonthlyBudgetAlert] = useState(50)
  const [autoSaveContent, setAutoSaveContent] = useState(true)
  const [defaultTemperature, setDefaultTemperature] = useState("0.7")
  
  // Saving states
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAI, setSavingAI] = useState(false)
  const [savingAppearance, setSavingAppearance] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [aiMessage, setAIMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [appearanceMessage, setAppearanceMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch user data and load settings
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user')
        const data = await res.json()
        if (data.email) {
          setUserEmail(data.email)
          // Use display_name from metadata if available, otherwise extract from email
          if (data.user_metadata?.display_name) {
            setUserName(data.user_metadata.display_name)
          } else {
            const name = data.email.split('@')[0]
            setUserName(name.charAt(0).toUpperCase() + name.slice(1))
          }
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
    
    // Load AI settings from localStorage
    const savedAI = localStorage.getItem('ai_settings')
    if (savedAI) {
      try {
        const settings = JSON.parse(savedAI)
        setDefaultComplexity(settings.defaultComplexity || 'balanced')
        setMonthlyBudgetAlert(settings.monthlyBudgetAlert || 50)
        setAutoSaveContent(settings.autoSaveContent ?? true)
        setDefaultTemperature(settings.defaultTemperature || '0.7')
      } catch (e) {
        console.error('Failed to load AI settings:', e)
      }
    }
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === 'dark' || newTheme === 'light') {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }

  // Handler: Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('displayName', userName)
      
      const result = await updateUserProfile(formData)
      
      if (result.error) {
        setProfileMessage({ type: 'error', text: result.error })
      } else {
        setProfileMessage({ type: 'success', text: result.message || 'Profile updated successfully' })
        // Clear message after 3 seconds
        setTimeout(() => setProfileMessage(null), 3000)
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Failed to save profile' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handler: Save AI settings
  const handleSaveAISettings = () => {
    setSavingAI(true)
    setAIMessage(null)
    
    try {
      const settings = {
        defaultComplexity,
        monthlyBudgetAlert,
        autoSaveContent,
        defaultTemperature,
      }
      localStorage.setItem('ai_settings', JSON.stringify(settings))
      setAIMessage({ type: 'success', text: 'AI settings saved successfully' })
      // Clear message after 3 seconds
      setTimeout(() => setAIMessage(null), 3000)
    } catch (error) {
      setAIMessage({ type: 'error', text: 'Failed to save AI settings' })
    } finally {
      setSavingAI(false)
    }
  }

  // Handler: Save appearance settings
  const handleSaveAppearance = () => {
    setSavingAppearance(true)
    setAppearanceMessage(null)
    
    try {
      setAppearanceMessage({ type: 'success', text: 'Appearance settings saved successfully' })
      // Clear message after 3 seconds
      setTimeout(() => setAppearanceMessage(null), 3000)
    } catch (error) {
      setAppearanceMessage({ type: 'error', text: 'Failed to save appearance settings' })
    } finally {
      setSavingAppearance(false)
    }
  }

  // Handler: Export data
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Fetch all user data from the backend
      const [clientsRes, projectsRes, journalRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
        fetch('/api/journal'),
      ])
      
      const data = {
        exportedAt: new Date().toISOString(),
        clients: clientsRes.ok ? await clientsRes.json() : [],
        projects: projectsRes.ok ? await projectsRes.json() : [],
        journal: journalRes.ok ? await journalRes.json() : [],
        settings: {
          ai: JSON.parse(localStorage.getItem('ai_settings') || '{}'),
          sidebar: localStorage.getItem('sidebar_collapsed'),
          theme: localStorage.getItem('theme'),
        }
      }
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `drss-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
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
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
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
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={loading} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={userEmail} disabled />
                </div>
                <div className="space-y-4">
                  <Label>Change PIN</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input type="password" placeholder="Current PIN" disabled />
                    <Input type="password" placeholder="New PIN" disabled />
                    <Input type="password" placeholder="Confirm PIN" disabled />
                  </div>
                  <p className="text-xs text-muted-foreground">PIN change coming soon</p>
                </div>
                
                {/* Success/Error Message */}
                {profileMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    profileMessage.type === 'success' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {profileMessage.text}
                  </div>
                )}
                
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
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
                <Select value={defaultComplexity} onValueChange={setDefaultComplexity}>
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
                  <Input 
                    id="budget" 
                    type="number" 
                    value={monthlyBudgetAlert} 
                    onChange={(e) => setMonthlyBudgetAlert(Number(e.target.value))}
                    className="pl-7" 
                  />
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
                <Switch checked={autoSaveContent} onCheckedChange={setAutoSaveContent} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temp">Default Temperature</Label>
                <Select value={defaultTemperature} onValueChange={setDefaultTemperature}>
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
              
              {/* Success/Error Message */}
              {aiMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  aiMessage.type === 'success' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {aiMessage.text}
                </div>
              )}
              
              <Button onClick={handleSaveAISettings} disabled={savingAI}>
                {savingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
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
                <p className="text-xs text-muted-foreground">Theme changes are applied immediately</p>
              </div>
              <div className="space-y-3">
                <Label>Sidebar</Label>
                <RadioGroup 
                  value={collapsed ? 'collapsed' : 'expanded'} 
                  onValueChange={(value) => setCollapsed(value === 'collapsed')}
                  className="flex gap-4"
                >
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
                <p className="text-xs text-muted-foreground">Sidebar changes are applied immediately</p>
              </div>
              
              {/* Success/Error Message */}
              {appearanceMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  appearanceMessage.type === 'success' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {appearanceMessage.text}
                </div>
              )}
              
              <Button onClick={handleSaveAppearance} disabled={savingAppearance}>
                {savingAppearance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questionnaire */}
        <TabsContent value="questionnaire">
          <QuestionnaireSettings />
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
                <h4 className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export All Data
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download a complete export of all your clients, projects, journal entries, and settings.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 bg-transparent"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export as JSON
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Data
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Import data from a previous export or migrate from another tool.
                </p>
                <Button variant="outline" className="mt-4 bg-transparent" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from File
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <Button variant="destructive" className="mt-4" disabled>
                  Delete All Data
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Feature disabled for safety</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

