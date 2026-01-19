"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateClient } from "@/app/actions/clients"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditClientDialogProps {
  client: {
    id: string
    name: string
    email?: string | null
    website?: string | null
    industry?: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const industries = [
  "saas",
  "ecommerce",
  "finance",
  "healthcare",
  "marketing",
  "technology",
  "other",
]

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(client.name)
  const [email, setEmail] = useState(client.email || "")
  const [website, setWebsite] = useState(client.website || "")
  const [industry, setIndustry] = useState(client.industry || "")
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens with new client data
  useEffect(() => {
    if (open) {
      setName(client.name)
      setEmail(client.email || "")
      setWebsite(client.website || "")
      setIndustry(client.industry || "")
      setError(null)
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("email", email)
      formData.append("website", website)
      formData.append("industry", industry)

      const result = await updateClient(client.id, formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        onOpenChange(false)
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to update client:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update the client's profile information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@acme.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind.charAt(0).toUpperCase() + ind.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

