/**
 * Notification type definitions and schemas
 */
export const NOTIFICATION_TYPES = {
  // Campaign notifications
  CAMPAIGN_COMPLETED: 'campaign_completed',
  CAMPAIGN_FAILED: 'campaign_failed',
  CAMPAIGN_STARTED: 'campaign_started',
  
  // Video notifications
  VIDEO_PUBLISHED: 'video_published',
  VIDEO_FAILED: 'video_failed',
  VIDEO_PROCESSING: 'video_processing',
  
  // Workflow notifications
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_STARTED: 'workflow_started',
  
  // System notifications
  SYSTEM_ALERT: 'system_alert',
  QUOTA_WARNING: 'quota_warning',
  INTEGRATION_ERROR: 'integration_error',
};

/**
 * Validate notification payload based on type
 */
export function validateNotificationPayload(notificationType, data) {
  const schemas = {
    campaign_completed: {
      required: ['campaignName', 'status'],
      optional: ['stats', 'duration', 'campaignId'],
    },
    campaign_failed: {
      required: ['campaignName', 'error'],
      optional: ['campaignId', 'failedAt'],
    },
    campaign_started: {
      required: ['campaignName'],
      optional: ['campaignId', 'estimatedDuration', 'videoCount'],
    },
    
    video_published: {
      required: ['videoTitle', 'platform'],
      optional: ['videoId', 'duration', 'thumbnailUrl', 'videoUrl'],
    },
    video_failed: {
      required: ['videoTitle', 'error'],
      optional: ['videoId', 'platform'],
    },
    video_processing: {
      required: ['videoTitle', 'progress'],
      optional: ['videoId', 'estimatedTime'],
    },
    
    workflow_completed: {
      required: ['workflowName'],
      optional: ['workflowId', 'duration', 'steps'],
    },
    workflow_failed: {
      required: ['workflowName', 'error'],
      optional: ['workflowId', 'failedStep'],
    },
    workflow_started: {
      required: ['workflowName'],
      optional: ['workflowId', 'estimatedDuration'],
    },
    
    system_alert: {
      required: ['message', 'severity'],
      optional: ['alertType', 'details'],
    },
    quota_warning: {
      required: ['resource', 'currentUsage', 'limit'],
      optional: ['percentage', 'recommendedAction'],
    },
    integration_error: {
      required: ['integration', 'error'],
      optional: ['errorCode', 'suggestedFix'],
    },
  };

  const schema = schemas[notificationType];
  
  if (!schema) {
    return {
      valid: false,
      error: `Unknown notification type: ${notificationType}`,
    };
  }

  // Check required fields
  const missingFields = schema.required.filter(field => !(field in data));
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Enrich notification data with common fields
 */
export function enrichNotificationData(data, context = {}) {
  return {
    ...data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...context,
  };
}

/**
 * Format notification title based on type
 */
export function getNotificationTitle(notificationType, data) {
  const titles = {
    campaign_completed: `Campaign Completed: ${data.campaignName}`,
    campaign_failed: `Campaign Failed: ${data.campaignName}`,
    campaign_started: `Campaign Started: ${data.campaignName}`,
    
    video_published: `Video Published: ${data.videoTitle}`,
    video_failed: `Video Failed: ${data.videoTitle}`,
    video_processing: `Processing Video: ${data.videoTitle}`,
    
    workflow_completed: `Workflow Completed: ${data.workflowName}`,
    workflow_failed: `Workflow Failed: ${data.workflowName}`,
    workflow_started: `Workflow Started: ${data.workflowName}`,
    
    system_alert: `System Alert: ${data.message}`,
    quota_warning: `Quota Warning: ${data.resource}`,
    integration_error: `Integration Error: ${data.integration}`,
  };

  return titles[notificationType] || `Notification: ${notificationType}`;
}

/**
 * Get notification priority
 */
export function getNotificationPriority(notificationType) {
  const priorities = {
    // High priority
    workflow_failed: 'high',
    campaign_failed: 'high',
    video_failed: 'high',
    system_alert: 'high',
    integration_error: 'high',
    
    // Medium priority
    quota_warning: 'medium',
    
    // Low priority
    campaign_completed: 'low',
    campaign_started: 'low',
    video_published: 'low',
    video_processing: 'low',
    workflow_completed: 'low',
    workflow_started: 'low',
  };

  return priorities[notificationType] || 'medium';
}

/**
 * Get notification icon/emoji based on type
 */
export function getNotificationIcon(notificationType) {
  const icons = {
    campaign_completed: '🎉',
    campaign_failed: '❌',
    campaign_started: '🚀',
    
    video_published: '📹',
    video_failed: '⚠️',
    video_processing: '⏳',
    
    workflow_completed: '✅',
    workflow_failed: '🔴',
    workflow_started: '▶️',
    
    system_alert: '🔔',
    quota_warning: '⚠️',
    integration_error: '🔧',
  };

  return icons[notificationType] || '📬';
}

/**
 * Get notification color based on type (for UI/formatting)
 */
export function getNotificationColor(notificationType) {
  const priority = getNotificationPriority(notificationType);
  
  const colors = {
    high: '#ef4444',    // red
    medium: '#f59e0b',  // orange
    low: '#10b981',     // green
  };

  return colors[priority] || '#6b7280'; // gray
}

/**
 * Format notification summary (short text)
 */
export function formatNotificationSummary(notificationType, data) {
  const summaries = {
    campaign_completed: `${data.campaignName} completed with ${data.stats?.videosProcessed || 0} videos`,
    campaign_failed: `${data.campaignName} failed: ${data.error}`,
    campaign_started: `${data.campaignName} started`,
    
    video_published: `${data.videoTitle} published on ${data.platform}`,
    video_failed: `${data.videoTitle} failed: ${data.error}`,
    video_processing: `${data.videoTitle} processing (${data.progress}%)`,
    
    workflow_completed: `${data.workflowName} completed successfully`,
    workflow_failed: `${data.workflowName} failed: ${data.error}`,
    workflow_started: `${data.workflowName} started`,
    
    system_alert: data.message,
    quota_warning: `${data.resource} usage at ${data.currentUsage}/${data.limit}`,
    integration_error: `${data.integration} error: ${data.error}`,
  };

  return summaries[notificationType] || JSON.stringify(data);
}

/**
 * Prepare notification metadata
 */
export function prepareNotificationMetadata(notificationType, data) {
  return {
    type: notificationType,
    title: getNotificationTitle(notificationType, data),
    summary: formatNotificationSummary(notificationType, data),
    priority: getNotificationPriority(notificationType),
    icon: getNotificationIcon(notificationType),
    color: getNotificationColor(notificationType),
    timestamp: new Date().toISOString(),
  };
}
