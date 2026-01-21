'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  JournalFolder, 
  JournalFolderTreeNode, 
  FolderBreadcrumb,
  FolderTreeResult 
} from '@/types/journal'

// Note: Types should be imported directly from '@/types/journal' by consumers

// ============================================================================
// FOLDER CRUD OPERATIONS
// ============================================================================

/**
 * Get all folders for current user (flat list)
 * Includes chat counts for each folder
 */
export async function getJournalFolders(): Promise<(JournalFolder & { chat_count: number })[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get folders with chat counts using the RPC function
  const { data: folders, error } = await supabase
    .rpc('get_folder_tree', { p_user_id: user.id })
  
  if (error) {
    console.error('Error fetching folders:', error)
    // Fallback to direct query if RPC not available
    const { data: fallbackFolders } = await supabase
      .from('journal_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
    
    return (fallbackFolders || []).map(f => ({ ...f, chat_count: 0 }))
  }
  
  return folders || []
}

/**
 * Get folder tree structure for hierarchical UI
 * Builds nested tree from flat folder list
 */
export async function getJournalFolderTree(): Promise<JournalFolderTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get all folders with chat counts
  const { data: folders, error } = await supabase
    .rpc('get_folder_tree', { p_user_id: user.id }) as { data: FolderTreeResult[] | null, error: any }
  
  if (error || !folders) {
    console.error('Error fetching folder tree:', error)
    return []
  }
  
  // Build tree structure from flat list
  return buildFolderTree(folders)
}

/**
 * Build tree structure from flat folder list
 */
function buildFolderTree(folders: FolderTreeResult[]): JournalFolderTreeNode[] {
  // Create a map for quick lookup
  const folderMap = new Map<string, JournalFolderTreeNode>()
  
  // Initialize all folders as tree nodes
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      position: folder.sort_position,  // Map sort_position back to position
      parent_id: folder.parent_id,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
      user_id: '', // Not returned by RPC, but required by interface
      children: [],
      chat_count: folder.chat_count || 0,
      depth: 0,
      isExpanded: true
    })
  })
  
  // Build tree by linking children to parents
  const rootFolders: JournalFolderTreeNode[] = []
  
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!
    
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      // Add to parent's children
      const parent = folderMap.get(folder.parent_id)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      // Root folder
      rootFolders.push(node)
    }
  })
  
  // Sort children by position within each parent
  const sortChildren = (nodes: JournalFolderTreeNode[]) => {
    nodes.sort((a, b) => (a.position || 0) - (b.position || 0))
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(rootFolders)
  
  return rootFolders
}

/**
 * Get breadcrumb path for a folder
 * Returns array from root to target folder
 */
export async function getFolderBreadcrumbs(folderId: string): Promise<FolderBreadcrumb[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Use the database function to get path
  const { data, error } = await supabase
    .rpc('get_folder_path', { folder_id: folderId })
  
  if (error) {
    console.error('Error getting folder path:', error)
    return []
  }
  
  return (data || []).map((item: { id: string; name: string }) => ({
    id: item.id,
    name: item.name
  }))
}

/**
 * Create a new folder
 * @param name - Folder name
 * @param color - Folder color (hex)
 * @param parentId - Parent folder ID (null for root folder)
 */
export async function createJournalFolder(
  name: string, 
  color: string = '#EF4444',
  parentId: string | null = null
): Promise<JournalFolder> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Validate parent exists and belongs to user (if provided)
  if (parentId) {
    const { data: parentFolder, error: parentError } = await supabase
      .from('journal_folders')
      .select('id, user_id')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .single()
    
    if (parentError || !parentFolder) {
      throw new Error('Parent folder not found')
    }
    
    // Check depth limit (get parent's depth)
    const { data: ancestors } = await supabase
      .rpc('get_folder_path', { folder_id: parentId })
    
    if (ancestors && ancestors.length >= 10) {
      throw new Error('Maximum folder nesting depth reached (10 levels)')
    }
  }
  
  // Get max position among siblings
  let query = supabase
    .from('journal_folders')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
  
  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }
  
  const { data: existing } = await query.single()
  const nextPosition = (existing?.position || 0) + 1
  
  // Create the folder
  const { data, error } = await supabase
    .from('journal_folders')
    .insert({
      user_id: user.id,
      name,
      color,
      position: nextPosition,
      parent_id: parentId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating folder:', error)
    throw new Error(error.message || 'Failed to create folder')
  }
  
  revalidatePath('/dashboard/journal')
  return data
}

/**
 * Update a folder's properties
 */
export async function updateJournalFolder(
  folderId: string, 
  name: string, 
  color?: string
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const updates: { name: string; color?: string; updated_at: string } = { 
    name,
    updated_at: new Date().toISOString()
  }
  if (color) updates.color = color
  
  const { error } = await supabase
    .from('journal_folders')
    .update(updates)
    .eq('id', folderId)
    .eq('user_id', user.id)  // Security: only update own folders
  
  if (error) {
    throw new Error('Failed to update folder')
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Move a folder to a new parent
 * @param folderId - Folder to move
 * @param newParentId - New parent folder ID (null to move to root)
 */
export async function moveFolder(
  folderId: string, 
  newParentId: string | null
): Promise<JournalFolder> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Validate folder exists and belongs to user
  const { data: folder, error: folderError } = await supabase
    .from('journal_folders')
    .select('*')
    .eq('id', folderId)
    .eq('user_id', user.id)
    .single()
  
  if (folderError || !folder) {
    throw new Error('Folder not found')
  }
  
  // If same parent, no-op
  if (folder.parent_id === newParentId) {
    return folder
  }
  
  // Validate new parent (if provided)
  if (newParentId) {
    // Check parent exists and belongs to user
    const { data: parentFolder, error: parentError } = await supabase
      .from('journal_folders')
      .select('id')
      .eq('id', newParentId)
      .eq('user_id', user.id)
      .single()
    
    if (parentError || !parentFolder) {
      throw new Error('Target parent folder not found')
    }
    
    // Check for circular reference using database function
    // This is also enforced by trigger, but check here for better error message
    const { data: isDescendant } = await supabase
      .rpc('is_folder_descendant', { 
        potential_descendant: newParentId,
        potential_ancestor: folderId 
      })
    
    if (isDescendant) {
      throw new Error('Cannot move folder into its own subfolder')
    }
    
    // Check depth limit
    const { data: ancestors } = await supabase
      .rpc('get_folder_path', { folder_id: newParentId })
    
    // Also count descendants of the folder being moved
    const { data: descendants } = await supabase
      .rpc('get_folder_descendants', { folder_id: folderId })
    
    const maxDescendantDepth = descendants?.reduce(
      (max: number, d: { depth: number }) => Math.max(max, d.depth), 
      0
    ) || 0
    
    const newDepth = (ancestors?.length || 0) + 1 + maxDescendantDepth
    if (newDepth > 10) {
      throw new Error('Move would exceed maximum folder depth (10 levels)')
    }
  }
  
  // Get max position in new parent
  let positionQuery = supabase
    .from('journal_folders')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
  
  if (newParentId) {
    positionQuery = positionQuery.eq('parent_id', newParentId)
  } else {
    positionQuery = positionQuery.is('parent_id', null)
  }
  
  const { data: lastSibling } = await positionQuery.single()
  const newPosition = (lastSibling?.position || 0) + 1
  
  // Perform the move
  const { data: updatedFolder, error: updateError } = await supabase
    .from('journal_folders')
    .update({ 
      parent_id: newParentId,
      position: newPosition,
      updated_at: new Date().toISOString()
    })
    .eq('id', folderId)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (updateError) {
    console.error('Error moving folder:', updateError)
    throw new Error(updateError.message || 'Failed to move folder')
  }
  
  revalidatePath('/dashboard/journal')
  return updatedFolder
}

/**
 * Delete a folder
 * Note: Child folders will be deleted (CASCADE)
 * Chats in deleted folders will have folder_id set to null (ON DELETE SET NULL)
 */
export async function deleteJournalFolder(folderId: string): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // First, move all chats in this folder (and descendants) to root
  // This is handled by FK constraint, but explicit handling gives better UX
  const { data: descendants } = await supabase
    .rpc('get_folder_descendants', { folder_id: folderId })
  
  const folderIds = [folderId, ...(descendants?.map((d: { id: string }) => d.id) || [])]
  
  // Update chats to remove folder association
  await supabase
    .from('journal_chats')
    .update({ folder_id: null })
    .in('folder_id', folderIds)
    .eq('user_id', user.id)
  
  // Delete the folder (CASCADE will delete descendants)
  const { error } = await supabase
    .from('journal_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)
  
  if (error) {
    throw new Error('Failed to delete folder')
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Reorder a folder within its parent
 */
export async function reorderFolder(
  folderId: string,
  newPosition: number
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get the folder to find its parent
  const { data: folder, error: folderError } = await supabase
    .from('journal_folders')
    .select('parent_id, position')
    .eq('id', folderId)
    .eq('user_id', user.id)
    .single()
  
  if (folderError || !folder) {
    throw new Error('Folder not found')
  }
  
  // Get all siblings
  let siblingsQuery = supabase
    .from('journal_folders')
    .select('id, position')
    .eq('user_id', user.id)
    .neq('id', folderId)
    .order('position', { ascending: true })
  
  if (folder.parent_id) {
    siblingsQuery = siblingsQuery.eq('parent_id', folder.parent_id)
  } else {
    siblingsQuery = siblingsQuery.is('parent_id', null)
  }
  
  const { data: siblings } = await siblingsQuery
  
  // Reorder siblings
  const updates: { id: string; position: number }[] = []
  let pos = 0
  
  siblings?.forEach((sibling) => {
    if (pos === newPosition) {
      pos++ // Skip the target position for the moved folder
    }
    if (sibling.position !== pos) {
      updates.push({ id: sibling.id, position: pos })
    }
    pos++
  })
  
  // Update positions
  for (const update of updates) {
    await supabase
      .from('journal_folders')
      .update({ position: update.position })
      .eq('id', update.id)
  }
  
  // Update the moved folder
  await supabase
    .from('journal_folders')
    .update({ position: newPosition })
    .eq('id', folderId)
  
  revalidatePath('/dashboard/journal')
}

// ============================================================================
// CHAT-FOLDER OPERATIONS
// ============================================================================

/**
 * Move a chat to a folder
 */
export async function moveChatToFolder(
  chatId: string, 
  folderId: string | null
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Validate folder belongs to user (if provided)
  if (folderId) {
    const { data: folder, error: folderError } = await supabase
      .from('journal_folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single()
    
    if (folderError || !folder) {
      throw new Error('Folder not found')
    }
  }
  
  const { error } = await supabase
    .from('journal_chats')
    .update({ folder_id: folderId })
    .eq('id', chatId)
    .eq('user_id', user.id)
  
  if (error) {
    throw new Error('Failed to move chat')
  }
  
  revalidatePath('/dashboard/journal')
}

// ============================================================================
// QUICK CAPTURES (Chats without folders)
// ============================================================================

/**
 * Get count of chats without a folder (Quick Captures)
 */
export async function getQuickCaptureCount(): Promise<number> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { count, error } = await supabase
    .from('journal_chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('folder_id', null)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error getting quick capture count:', error)
    return 0
  }
  
  return count || 0
}

/**
 * Get chats without a folder (Quick Captures) with entry counts
 */
export async function getChatsWithoutFolder() {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get chats without folder
  const { data: chats, error } = await supabase
    .from('journal_chats')
    .select(`
      id,
      name,
      type,
      linked_id,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .is('folder_id', null)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching chats without folder:', error)
    return []
  }
  
  if (!chats || chats.length === 0) {
    return []
  }
  
  // Get entry counts for each chat
  const chatIds = chats.map(c => c.id)
  const { data: entryCounts } = await supabase
    .from('journal_entries')
    .select('chat_id')
    .in('chat_id', chatIds)
    .is('deleted_at', null)
  
  const countMap: Record<string, number> = {}
  entryCounts?.forEach(entry => {
    countMap[entry.chat_id] = (countMap[entry.chat_id] || 0) + 1
  })
  
  return chats.map(chat => ({
    ...chat,
    entry_count: countMap[chat.id] || 0
  }))
}

/**
 * Get chats in a specific folder with entry counts
 */
export async function getChatsInFolder(folderId: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get chats in folder
  const { data: chats, error } = await supabase
    .from('journal_chats')
    .select(`
      id,
      name,
      type,
      linked_id,
      folder_id,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .eq('folder_id', folderId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching chats in folder:', error)
    return []
  }
  
  if (!chats || chats.length === 0) {
    return []
  }
  
  // Get entry counts for each chat
  const chatIds = chats.map(c => c.id)
  const { data: entryCounts } = await supabase
    .from('journal_entries')
    .select('chat_id')
    .in('chat_id', chatIds)
    .is('deleted_at', null)
  
  const countMap: Record<string, number> = {}
  entryCounts?.forEach(entry => {
    countMap[entry.chat_id] = (countMap[entry.chat_id] || 0) + 1
  })
  
  return chats.map(chat => ({
    ...chat,
    entry_count: countMap[chat.id] || 0
  }))
}

// ============================================================================
// TIMELINE & COUNTS
// ============================================================================

/**
 * Get unified journal timeline (chats with entry counts and previews)
 */
export async function getUnifiedJournalTimeline(folderId?: string | null) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Build query for chats
  let query = supabase
    .from('journal_chats')
    .select(`
      id,
      name,
      type,
      linked_id,
      folder_id,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  
  // Filter by folder if specified
  if (folderId) {
    query = query.eq('folder_id', folderId)
  }
  
  const { data: chats, error } = await query
  
  if (error) {
    console.error('Error fetching timeline:', error)
    return []
  }
  
  if (!chats || chats.length === 0) {
    return []
  }
  
  // Get entry counts for each chat
  const chatIds = chats.map(c => c.id)
  const { data: entryCounts } = await supabase
    .from('journal_entries')
    .select('chat_id')
    .in('chat_id', chatIds)
    .is('deleted_at', null)
  
  const countMap: Record<string, number> = {}
  entryCounts?.forEach(entry => {
    countMap[entry.chat_id] = (countMap[entry.chat_id] || 0) + 1
  })
  
  // Get latest entry for each chat to show preview
  const { data: latestEntries } = await supabase
    .from('journal_entries')
    .select('chat_id, content, tags, created_at')
    .in('chat_id', chatIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  // Group by chat_id and take first (latest)
  const latestMap: Record<string, { content: string; tags: string[]; created_at: string }> = {}
  latestEntries?.forEach(entry => {
    if (!latestMap[entry.chat_id]) {
      latestMap[entry.chat_id] = entry
    }
  })
  
  return chats.map(chat => ({
    ...chat,
    entry_count: countMap[chat.id] || 0,
    latest_entry: latestMap[chat.id] || null
  }))
}

/**
 * Get total counts for all items
 */
export async function getJournalCounts() {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Total chats
  const { count: totalChats } = await supabase
    .from('journal_chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  // Total entries
  const { count: totalEntries } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  // Total folders
  const { count: totalFolders } = await supabase
    .from('journal_folders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  return {
    totalChats: totalChats || 0,
    totalEntries: totalEntries || 0,
    totalFolders: totalFolders || 0
  }
}
