/**
 * Safely extracts client name from Supabase relation
 * Handles both array (one-to-many) and object (one-to-one) cases
 */
export function getClientName(
  clients: { name: string } | { name: string }[] | null | undefined
): string | undefined {
  if (!clients) return undefined
  if (Array.isArray(clients)) return clients[0]?.name
  return clients.name
}


