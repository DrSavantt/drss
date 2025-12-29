import { AppShell } from "@/components/layout/app-shell"
import { ProjectsKanban } from "@/components/projects/projects-kanban"

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsKanban />
    </AppShell>
  )
}
