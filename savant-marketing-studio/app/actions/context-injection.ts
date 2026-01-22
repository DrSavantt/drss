'use server'

import { createClient } from '@/lib/supabase/server'
import { extractFileContent } from '@/lib/ai/file-processor'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContextMention {
  type: 'client' | 'project' | 'content' | 'capture' | 'framework' | 'writing-framework'
  id: string
  name: string
}

export interface BuiltContext {
  text: string
  images: Array<{ base64: string; mediaType: string }>
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract plain text from TipTap JSON content structure
 */
function extractTextFromTipTap(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  
  const doc = json as { content?: Array<{ type?: string; content?: Array<{ text?: string; type?: string }> }> }
  if (!doc.content) return ''
  
  const extractFromNode = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as { type?: string; text?: string; content?: unknown[] }
    
    // Direct text node
    if (n.text) return n.text
    
    // Recursively extract from children
    if (n.content && Array.isArray(n.content)) {
      return n.content.map(extractFromNode).join(n.type === 'paragraph' ? '\n' : '')
    }
    
    return ''
  }
  
  return doc.content
    .map(extractFromNode)
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

// ============================================================================
// MAIN CONTEXT BUILDING FUNCTION
// ============================================================================

/**
 * Builds context string (and optional images) from an array of mentions.
 * Used by both AI Chat and TipTap AI Bar for consistency.
 * 
 * This is the SINGLE SOURCE OF TRUTH for building context from @mentions.
 * All AI features should use this function to ensure consistent context injection.
 */
export async function buildContextFromMentions(
  mentions: ContextMention[]
): Promise<BuiltContext> {
  if (!mentions || mentions.length === 0) {
    return { text: '', images: [] }
  }

  const supabase = await createClient()
  if (!supabase) {
    throw new Error('Failed to create Supabase client')
  }

  const contextParts: string[] = []
  const images: Array<{ base64: string; mediaType: string }> = []

  // Group mentions by type for batch queries
  const clientIds = mentions.filter(m => m.type === 'client').map(m => m.id)
  const projectIds = mentions.filter(m => m.type === 'project').map(m => m.id)
  const contentIds = mentions.filter(m => m.type === 'content').map(m => m.id)
  const captureIds = mentions.filter(m => m.type === 'capture').map(m => m.id)
  const frameworkIds = mentions
    .filter(m => m.type === 'writing-framework' || m.type === 'framework')
    .map(m => m.id)

  // ========================================================================
  // CLIENTS
  // ========================================================================
  if (clientIds.length) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, brand_data, intake_responses, industry, website')
      .in('id', clientIds)

    if (clients?.length) {
      contextParts.push(`## Referenced Clients\n${clients.map(c => {
        const parts = [`### ${c.name}`]
        if (c.industry) parts.push(`**Industry:** ${c.industry}`)
        if (c.website) parts.push(`**Website:** ${c.website}`)
        if (c.brand_data && Object.keys(c.brand_data).length > 0) {
          parts.push(`#### Brand Data\n\`\`\`json\n${JSON.stringify(c.brand_data, null, 2)}\n\`\`\``)
        }
        if (c.intake_responses && Object.keys(c.intake_responses).length > 0) {
          parts.push(`#### Questionnaire Responses\n\`\`\`json\n${JSON.stringify(c.intake_responses, null, 2)}\n\`\`\``)
        }
        return parts.join('\n')
      }).join('\n\n')}`)
    }
  }

  // ========================================================================
  // PROJECTS (with auto-fetch of linked client data)
  // ========================================================================
  if (projectIds.length) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, status, metadata, client_id')
      .in('id', projectIds)

    if (projects?.length) {
      // Collect unique client IDs from projects that weren't explicitly @mentioned
      const projectClientIds = [...new Set(
        projects
          .map(p => p.client_id)
          .filter((cid): cid is string => cid !== null && !clientIds.includes(cid))
      )]

      // Fetch those clients' brand data
      let projectClients: Array<{
        id: string
        name: string
        brand_data: unknown
        intake_responses: unknown
        industry: string | null
        website: string | null
      }> = []
      
      if (projectClientIds.length) {
        const { data } = await supabase
          .from('clients')
          .select('id, name, brand_data, intake_responses, industry, website')
          .in('id', projectClientIds)
        projectClients = data || []
      }

      // Create a lookup map for client data
      const clientLookup = new Map(projectClients.map(c => [c.id, c]))

      contextParts.push(`## Referenced Projects\n${projects.map(p => {
        const parts = [`### ${p.name}`]
        if (p.status) parts.push(`**Status:** ${p.status}`)
        if (p.description) parts.push(`**Description:** ${p.description}`)
        
        // Include client brand context for this project (auto-fetched)
        const client = p.client_id ? clientLookup.get(p.client_id) : null
        if (client) {
          parts.push(`\n#### Linked Client: ${client.name}`)
          if (client.industry) parts.push(`**Industry:** ${client.industry}`)
          if (client.website) parts.push(`**Website:** ${client.website}`)
          if (client.brand_data && Object.keys(client.brand_data).length > 0) {
            parts.push(`##### Brand Data\n\`\`\`json\n${JSON.stringify(client.brand_data, null, 2)}\n\`\`\``)
          }
          if (client.intake_responses && Object.keys(client.intake_responses).length > 0) {
            parts.push(`##### Questionnaire Responses\n\`\`\`json\n${JSON.stringify(client.intake_responses, null, 2)}\n\`\`\``)
          }
        }
        
        if (p.metadata && Object.keys(p.metadata).length > 0) {
          parts.push(`#### Project Metadata\n\`\`\`json\n${JSON.stringify(p.metadata, null, 2)}\n\`\`\``)
        }
        return parts.join('\n')
      }).join('\n\n')}`)
    }
  }

  // ========================================================================
  // CONTENT ASSETS (with image support for vision API)
  // ========================================================================
  if (contentIds.length) {
    const { data: contents } = await supabase
      .from('content_assets')
      .select('id, title, content, content_json, asset_type, metadata, file_url, file_type')
      .in('id', contentIds)

    if (contents?.length) {
      const contentParts: string[] = []

      for (const c of contents) {
        const parts = [`### ${c.title || 'Untitled'}`]
        if (c.asset_type) parts.push(`**Type:** ${c.asset_type}`)
        
        // Handle TipTap editor content
        if (c.content_json) {
          const text = extractTextFromTipTap(c.content_json)
          if (text) parts.push(`#### Content\n${text}`)
        } else if (c.content) {
          // Fall back to plain content field
          parts.push(`#### Content\n${c.content}`)
        }
        
        // Handle uploaded files (including images for vision API)
        if (c.file_url) {
          const extracted = await extractFileContent(c.file_url, c.file_type)
          
          if (extracted.isImage && extracted.base64 && extracted.mediaType) {
            // Store image for multi-modal message
            images.push({ base64: extracted.base64, mediaType: extracted.mediaType })
            parts.push(`**[Image attached - Claude can see this image]**`)
          } else if (extracted.text) {
            parts.push(`#### File Content\n${extracted.text}`)
          }
        }
        
        if (c.metadata && Object.keys(c.metadata).length > 0) {
          parts.push(`#### Metadata\n\`\`\`json\n${JSON.stringify(c.metadata, null, 2)}\n\`\`\``)
        }
        
        contentParts.push(parts.join('\n'))
      }

      if (contentParts.length) {
        contextParts.push(`## Referenced Content\n${contentParts.join('\n\n')}`)
      }
    }
  }

  // ========================================================================
  // CAPTURES (Journal Entries)
  // ========================================================================
  if (captureIds.length) {
    const { data: captures } = await supabase
      .from('journal_entries')
      .select('id, title, content, tags')
      .in('id', captureIds)

    if (captures?.length) {
      contextParts.push(`## Referenced Captures\n${captures.map(c => {
        const parts = [`### ${c.title || 'Untitled'}`]
        if (c.content) parts.push(c.content)
        if (c.tags?.length) {
          parts.push(`**Tags:** ${c.tags.join(', ')}`)
        }
        return parts.join('\n')
      }).join('\n\n')}`)
    }
  }

  // ========================================================================
  // FRAMEWORKS (Writing Frameworks / Marketing Frameworks)
  // ========================================================================
  if (frameworkIds.length) {
    const { data: frameworks } = await supabase
      .from('marketing_frameworks')
      .select('id, name, content, description, category')
      .in('id', frameworkIds)

    if (frameworks?.length) {
      contextParts.push(`## Referenced Frameworks\n${frameworks.map(f => {
        const parts = [`### ${f.name}`]
        if (f.category) parts.push(`**Category:** ${f.category}`)
        if (f.description) parts.push(`**Description:** ${f.description}`)
        if (f.content) parts.push(`#### Framework Content\n${f.content}`)
        return parts.join('\n')
      }).join('\n\n')}`)
    }
  }

  // ========================================================================
  // BUILD FINAL CONTEXT
  // ========================================================================
  if (contextParts.length === 0) {
    return { text: '', images }
  }

  return {
    text: `# CONTEXT FOR THIS MESSAGE
The user has attached the following context. Use this information to inform your response.

${contextParts.join('\n\n---\n\n')}`,
    images,
  }
}
