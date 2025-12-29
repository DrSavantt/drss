"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Globe, Mail, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/ui/stat-card"
import { FolderKanban, FileText, Sparkles, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientQuestionnaire } from "./client-questionnaire"

interface ClientDetailProps {
  clientId: string
}

// Mock data - in real app would fetch from API
const mockClient = {
  id: "1",
  name: "Acme Corporation",
  email: "hello@acme.com",
  website: "https://acme.com",
  status: "onboarded" as const,
  industry: "SaaS",
  projectCount: 5,
  contentCount: 23,
  aiCalls: 42,
  aiSpend: 125.5,
  brandVoice: "Bold, Direct, Professional",
  targetAudience: "B2B SMB decision-makers",
}

const recentActivity = [
  { action: "Email sequence generated", time: "2 hours ago" },
  { action: "Project moved to Review", time: "5 hours ago" },
  { action: "Landing page copy created", time: "1 day ago" },
  { action: "Questionnaire updated", time: "2 days ago" },
]

export function ClientDetail({ clientId }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const client = mockClient

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Onboarding Complete
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {client.email}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {client.website}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Generate Content</DropdownMenuItem>
              <DropdownMenuItem>Add Project</DropdownMenuItem>
              <DropdownMenuItem>Export Data</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Archive Client</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
          <TabsTrigger value="ai">AI History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Projects" value={client.projectCount} icon={FolderKanban} />
            <StatCard title="Content Pieces" value={client.contentCount} icon={FileText} />
            <StatCard title="AI Calls" value={client.aiCalls} icon={Zap} />
            <StatCard title="AI Spend" value={`$${client.aiSpend.toFixed(2)}`} icon={Sparkles} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions for this client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{activity.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Brand Summary */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Brand Summary</CardTitle>
                <CardDescription>Key brand attributes from questionnaire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Brand Voice</p>
                    <p className="mt-1">{client.brandVoice}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="mt-1">{client.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                    <p className="mt-1">{client.targetAudience}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>All projects for {client.name}</CardDescription>
                </div>
                <Button size="sm">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Projects will appear here</p>
                <p className="text-sm text-muted-foreground">View all projects in the Projects tab</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>All content assets for {client.name}</CardDescription>
                </div>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  New Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Content assets will appear here</p>
                <p className="text-sm text-muted-foreground">Generate content in AI Studio</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaire" className="mt-6">
          <ClientQuestionnaire clientName={client.name} />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>AI Generation History</CardTitle>
              <CardDescription>All AI-generated content for {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">AI generation history will appear here</p>
                <p className="text-sm text-muted-foreground">Track usage and costs per generation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
