import { AppShell } from "@/components/layout/app-shell"
import { ClientList } from "@/components/clients/client-list"

export default function ClientsPage() {
  return (
    <AppShell>
      <ClientList />
    </AppShell>
  )
}
