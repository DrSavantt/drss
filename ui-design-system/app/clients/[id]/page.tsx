import { AppShell } from "@/components/layout/app-shell"
import { ClientDetail } from "@/components/clients/client-detail"

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  return (
    <AppShell>
      <ClientDetail clientId={id} />
    </AppShell>
  )
}
