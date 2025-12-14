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
  | 'questionnaire_completed'
  | 'questionnaire_updated'
  | 'file_uploaded'
  | 'file_deleted';

export type EntityType = 'client' | 'project' | 'content' | 'questionnaire' | 'file';

interface LogActivityParams {
  activityType: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  activityType,
  entityType,
  entityId,
  entityName,
  metadata = {}
}: LogActivityParams) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('[ACTIVITY LOG] No database connection');
      return;
    }
    
    // Get current user - required for RLS
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[ACTIVITY LOG] No authenticated user');
      return;
    }
    
    const { error } = await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      metadata
    });
    
    if (error) {
      console.error('[ACTIVITY LOG] Failed to log:', error);
    }
  } catch (error) {
    console.error('[ACTIVITY LOG] Error:', error);
  }
}
