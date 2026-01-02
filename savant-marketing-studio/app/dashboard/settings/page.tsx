import { Settings } from "@/components/settings/settings"

// Force dynamic rendering - user-specific settings
export const dynamic = 'force-dynamic'

// ============================================================================
// EXACT v0 CODE - AppShell wrapper removed (handled by dashboard/layout.tsx)
// ============================================================================

export default function SettingsPage() {
  return <Settings />
}

