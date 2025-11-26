'use client'

import { motion } from 'framer-motion'
import { InteractiveCard } from '@/components/interactive-card'
import { AnimatedButton } from '@/components/animated-button'
import { EmptyState } from '@/components/empty-state'
import { ClientGridSkeleton } from '@/components/skeleton-loader'
import { Building2, Mail, Globe, ArrowRight, Users, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ClientsPage() {
  const router = useRouter()
  interface Client {
    id: string
    name: string
    email: string | null
    website: string | null
    created_at: string
  }
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients')
        const data = await response.json()
        setClients(data)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  if (loading) {
    return <ClientGridSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-silver mt-1">Manage all your client accounts</p>
        </div>
        <Link href="/dashboard/clients/new">
          <AnimatedButton variant="primary" className="flex items-center gap-2">
            <PlusCircle size={18} />
            Add Client
          </AnimatedButton>
        </Link>
      </div>

      {/* Client Grid */}
      {clients.length === 0 ? (
        <div>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Get started by creating your first client to organize projects and content."
            cta={{
              label: 'Add Your First Client',
              href: '/dashboard/clients/new'
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id}>
              <InteractiveCard 
                className="p-6 group relative overflow-hidden"
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative">
                  {/* Client avatar with scale on hover */}
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-red-primary to-red-bright rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Building2 size={28} className="text-pure-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-red-primary transition-colors">
                    {client.name}
                  </h3>

                  {/* Client info */}
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-silver">
                        <Mail size={14} />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2 text-sm text-silver">
                        <Globe size={14} />
                        <span className="truncate">{client.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Hover arrow */}
                  <motion.div
                    className="absolute top-4 right-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="text-red-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </motion.div>

                  {/* Created date */}
                  <p className="mt-4 text-xs text-slate">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
              </InteractiveCard>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
