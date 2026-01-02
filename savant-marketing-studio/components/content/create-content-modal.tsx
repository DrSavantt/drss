'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, ChevronLeft, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// CREATE CONTENT MODAL - 2-Step Process
// Step 1: Select type (note or file)
// Step 2: Select client (if not pre-selected)
// ============================================================================

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string // Optional - if provided, skips step 2
  clientName?: string // For display purposes
}

type ContentType = 'note' | 'file' | null

export function CreateContentModal({ 
  isOpen, 
  onClose, 
  clientId,
  clientName 
}: CreateContentModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'client'>('type')
  const [selectedType, setSelectedType] = useState<ContentType>(null)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  // Fetch clients when modal opens and no clientId provided
  useEffect(() => {
    if (isOpen && !clientId) {
      fetchClients()
    }
  }, [isOpen, clientId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('type')
      setSelectedType(null)
      setSearchQuery('')
      setHoveredOption(null)
    }
  }, [isOpen])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type)
    
    // If clientId provided, skip to navigation
    if (clientId) {
      handleNavigate(clientId, type)
    } else {
      // Show client selector
      setStep('client')
    }
  }

  const handleClientSelect = (selectedClientId: string) => {
    handleNavigate(selectedClientId, selectedType)
  }

  const handleNavigate = (targetClientId: string, type: ContentType) => {
    if (type === 'note') {
      router.push(`/dashboard/clients/${targetClientId}/content/new`)
    } else if (type === 'file') {
      router.push(`/dashboard/clients/${targetClientId}/files/new`)
    }
    onClose()
  }

  const handleBack = () => {
    setStep('type')
    setSelectedType(null)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step === 'client' && !clientId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <DialogTitle className="text-xl">
              {step === 'type' ? 'Create Content' : 'Select Client'}
              {clientName && step === 'type' && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  for {clientName}
                </span>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'type' ? (
          // STEP 1: Select Content Type
          <div className="space-y-3 mt-4">
            {/* Create Note Option */}
            <button
              onClick={() => handleTypeSelect('note')}
              onMouseEnter={() => setHoveredOption('note')}
              onMouseLeave={() => setHoveredOption(null)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border border-border transition-all text-left",
                "hover:border-primary hover:bg-primary/5 hover:shadow-sm",
                hoveredOption === 'note' && "border-primary bg-primary/5 shadow-sm"
              )}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">Create Note</p>
                <p className="text-sm text-muted-foreground">
                  Write a text note with rich formatting
                </p>
              </div>
            </button>

            {/* Upload File Option */}
            <button
              onClick={() => handleTypeSelect('file')}
              onMouseEnter={() => setHoveredOption('upload')}
              onMouseLeave={() => setHoveredOption(null)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border border-border transition-all text-left",
                "hover:border-primary hover:bg-primary/5 hover:shadow-sm",
                hoveredOption === 'upload' && "border-primary bg-primary/5 shadow-sm"
              )}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">Upload File</p>
                <p className="text-sm text-muted-foreground">
                  Upload PDF, image, or document
                </p>
              </div>
            </button>
          </div>
        ) : (
          // STEP 2: Select Client
          <div className="space-y-4 mt-4">
            {/* Search */}
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              autoFocus
            />

            {/* Client List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading clients...</div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No clients found
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{client.name}</h3>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
