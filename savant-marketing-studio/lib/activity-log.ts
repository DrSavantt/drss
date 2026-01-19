'use server'
import { createClient } from '@/lib/supabase/server';

export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'content_created'
  | 'content_updated'
  | 'content_deleted'
  | 'content_reassigned'      // When content is moved to different project/client
  | 'questionnaire_completed'
  | 'questionnaire_updated'
  | 'file_uploaded'
  | 'file_deleted'
  | 'ai_generation'
  | 'research_created'        // When deep research is saved
  | 'bulk_delete'             // When multiple items deleted at once
  | 'bulk_move'               // When multiple items moved at once
  | 'bulk_reassign'           // When multiple items reassigned at once
  | 'chat_linked'             // When AI chat is linked to a client
  | 'chat_summarized';        // When chat is summarized and continued

export type EntityType = 'client' | 'project' | 'content' | 'questionnaire' | 'file' | 'ai_execution' | 'chat' | 'research';

interface LogActivityParams {
  activityType: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  clientId?: string; // NEW: Optional client_id for filtering activities by client
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  activityType,
  entityType,
  entityId,
  entityName,
  clientId,
  metadata = {}
}: LogActivityParams) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return;
    }
    
    // Get current user - required for RLS
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return;
    }
    
    const { error } = await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      client_id: clientId || null,
      metadata
    });
    
    if (error) {
      // Failed to log activity
    }
  } catch (error) {
    console.error('[ACTIVITY LOG] Error:', error);
  }
}
