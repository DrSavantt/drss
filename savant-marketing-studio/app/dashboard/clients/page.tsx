import { ClientList } from "@/components/clients/client-list"

// Force dynamic rendering - needs fresh data on each request
export const dynamic = 'force-dynamic'

// ============================================================================
// EXACT v0 CODE - AppShell wrapper removed (handled by dashboard/layout.tsx)
// ============================================================================

export default function ClientsPage() {
  return <ClientList />
}

