'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Users, FolderKanban, FileText, CheckCircle, 
  Upload, Edit
} from 'lucide-react';
import { metroItemVariants, metroContainerVariants } from '@/lib/animations';

interface Activity {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/activity-log?limit=10');
      const data = await res.json();
      setActivities(data || []);
      setLoading(false);
    } catch (error) {
      console.error('[ACTIVITY] ERROR:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    if (type.includes('client')) return <Users className="w-4 h-4" />;
    if (type.includes('project')) return <FolderKanban className="w-4 h-4" />;
    if (type.includes('content')) return <FileText className="w-4 h-4" />;
    if (type.includes('questionnaire')) return <CheckCircle className="w-4 h-4" />;
    if (type.includes('file')) return <Upload className="w-4 h-4" />;
    return <Edit className="w-4 h-4" />;
  };

  const getActivityText = (activity: Activity) => {
    const name = activity.entity_name || 'Item';
    
    switch (activity.activity_type) {
      case 'client_created': 
        return `Created new client "${name}"`;
      
      case 'client_updated': 
        return `Updated "${name}"`;
      
      case 'client_deleted': 
        return `Deleted client "${name}"`;
      
      case 'project_created': 
        return `Created new project "${name}"`;
      
      case 'project_status_changed': {
        const statusMap: Record<string, string> = {
          'backlog': 'Backlog',
          'in_progress': 'In Progress',
          'in_review': 'In Review',
          'done': 'Done'
        };
        
        const newStatus = statusMap[activity.metadata?.new_status as string] || activity.metadata?.new_status;
        
        return `Moved "${name}" to ${newStatus}`;
      }
      
      case 'project_updated': 
        return `Updated project "${name}"`;
      
      case 'project_deleted': 
        return `Deleted project "${name}"`;
      
      case 'questionnaire_completed': 
        return `Completed onboarding for "${name}"`;
      
      case 'questionnaire_updated': 
        return `Updated questionnaire for "${name}"`;
      
      case 'file_uploaded': {
        const fileSize = activity.metadata?.file_size as number;
        const sizeText = fileSize ? ` (${(fileSize / 1024).toFixed(1)} KB)` : '';
        return `Uploaded "${name}"${sizeText}`;
      }
      
      case 'file_deleted':
        return `Deleted file "${name}"`;
      
      case 'content_created': 
        return `Created new content "${name}"`;
      
      case 'content_updated':
        return `Updated content "${name}"`;
      
      case 'content_deleted':
        return `Deleted content "${name}"`;
      
      default: 
        // Fallback: convert snake_case to Title Case
        return activity.activity_type
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-hover-bg rounded-lg animate-pulse">
            <div className="w-4 h-4 bg-muted/30 rounded mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/30 rounded w-3/4" />
              <div className="h-3 bg-muted/30 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-2"
      variants={metroContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent activity</p>
      ) : (
        activities.map((activity) => (
          <motion.div 
            key={activity.id}
            variants={metroItemVariants}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-hover-bg transition-colors cursor-default"
          >
            <div className="text-muted-foreground mt-0.5">
              {getActivityIcon(activity.activity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
