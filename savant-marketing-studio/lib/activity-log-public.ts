'use server'
import { createClient } from '@/lib/supabase/server';

/**
 * Log activity for public form submissions
 * Uses provided user_id instead of auth context
 */
export async function logPublicActivity(
  userId: string,
  entityId: string,
  activityType: string,
  entityName?: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return;
    }
    
    // Insert activity log with provided user_id
    // Note: RLS policies may need adjustment for public submissions
    const { error } = await supabase.from('activity_log').insert({
      user_id: userId,
      activity_type: activityType,
      entity_type: 'questionnaire',
      entity_id: entityId,
      entity_name: entityName,
      metadata
    });
    
    if (error) {
      // Log but don't throw - activity logging is non-critical
    }
  } catch (error) {
    console.error('[PUBLIC ACTIVITY LOG] Error:', error);
  }
}
