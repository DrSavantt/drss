'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Upload, Image, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
}

interface ContentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
}

type ContentType = 'note' | 'file' | null

export function ContentCreateModal({ isOpen, onClose, clients }: ContentCreateModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'client'>('type')
  const [selectedType, setSelectedType] = useState<ContentType>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('type')
      setSelectedType(null)
      setSearchQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type)
    setStep('client')
  }

  const handleClientSelect = (clientId: string) => {
    if (selectedType === 'note') {
      router.push(`/dashboard/clients/${clientId}/content/new`)
    } else if (selectedType === 'file') {
      router.push(`/dashboard/clients/${clientId}/files/new`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {step === 'client' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-surface-highlight rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-silver" />
              </button>
            )}
            <h2 className="text-xl font-bold text-foreground">
              {step === 'type' ? 'Create Content' : 'Select Client'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-silver" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'type' ? (
            <div className="space-y-3">
              <ContentTypeButton
                icon={FileText}
                title="Create Note"
                description="Write a text note with rich formatting"
                onClick={() => handleTypeSelect('note')}
              />
              
              <ContentTypeButton
                icon={Upload}
                title="Upload File"
                description="Upload PDF, image, or document"
                onClick={() => handleTypeSelect('file')}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full px-4 py-2.5 bg-charcoal border border-mid-gray rounded-lg text-foreground placeholder-silver/50 focus:border-red-primary focus:outline-none transition-colors"
                autoFocus
              />

              {/* Client List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-silver/70">
                    No clients found
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className="w-full flex items-center gap-3 p-4 bg-charcoal hover:bg-charcoal/80 border border-mid-gray hover:border-red-primary/50 rounded-xl transition-all group text-left"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-red-primary/10 group-hover:bg-red-primary/20 rounded-lg transition-colors flex-shrink-0">
                        <span className="text-sm font-bold text-red-primary">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">{client.name}</h3>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ContentTypeButtonProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
}

function ContentTypeButton({ icon: Icon, title, description, onClick }: ContentTypeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-charcoal hover:bg-charcoal/80 border border-mid-gray hover:border-red-primary/50 rounded-xl transition-all group"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-red-primary/10 group-hover:bg-red-primary/20 rounded-lg transition-colors flex-shrink-0">
        <Icon className="w-6 h-6 text-red-primary" />
      </div>
      
      <div className="flex-1 text-left">
        <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
        <p className="text-xs text-silver/70">{description}</p>
      </div>
    </button>
  )
}

