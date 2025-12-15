import { prisma } from '@/app/lib/prisma';
import { publishToTopic, publishToMultipleTopics, TOPICS, generateDeduplicationId } from './qstash-client';
import { validateNotificationPayload } from './notification-formatter';

/**
 * Main notification service - orchestrates sending notifications across channels
 */
export async function sendNotification({ companyId, notificationType, data, resourceId = null }) {
  try {
    // Validate payload
    const validationResult = validateNotificationPayload(notificationType, data);
    if (!validationResult.valid) {
      throw new Error(`Invalid notification payload: ${validationResult.error}`);
    }

    // Fetch company preferences and integrations
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        notificationPreference: true,
        slackIntegration: true,
        teamsIntegration: true,
        emailIntegration: true,
      },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // Determine which channels to notify
    const channels = determineChannels(company);

    if (channels.length === 0) {
      console.log(`No active notification channels for company ${companyId}`);
      return {
        success: true,
        message: 'No active channels',
        channels: [],
      };
    }

    // Prepare messages for each channel
    const messages = prepareMessages({
      channels,
      companyId,
      notificationType,
      data,
      resourceId,
      company,
    });

    // Publish to QStash topics
    const result = await publishToMultipleTopics(messages);

    // Log notification attempt
    await logNotificationAttempt({
      companyId,
      notificationType,
      channels: channels.map(c => c.type),
      success: result.success,
      data,
    });

    return {
      success: result.success,
      channels: channels.map(c => c.type),
      messageIds: result.results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.messageId),
      failed: result.failed,
    };
  } catch (error) {
    console.error('Notification service error:', error);
    
    // Log failed attempt
    await logNotificationAttempt({
      companyId,
      notificationType,
      channels: [],
      success: false,
      error: error.message,
      data,
    }).catch(console.error);

    throw error;
  }
}

/**
 * Send notification to specific channel only
 */
export async function sendNotificationToChannel({ companyId, channel, notificationType, data, resourceId = null }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        slackIntegration: true,
        teamsIntegration: true,
        emailIntegration: true,
      },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    const channelConfig = getChannelConfig(company, channel);
    
    if (!channelConfig) {
      throw new Error(`Channel ${channel} not configured or inactive`);
    }

    const deduplicationId = generateDeduplicationId(companyId, notificationType, resourceId);

    const payload = {
      companyId,
      notificationType,
      data,
      channel,
      channelConfig,
      timestamp: new Date().toISOString(),
    };

    const topic = TOPICS[channel.toUpperCase()];
    
    const result = await publishToTopic({
      topic,
      payload,
      deduplicationId,
      retries: 3,
    });

    return {
      success: true,
      channel,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(`Send to ${channel} error:`, error);
    throw error;
  }
}

/**
 * Determine which channels should receive the notification
 */
function determineChannels(company) {
  const channels = [];
  const prefs = company.notificationPreference;

  // Email
  if (prefs?.emailEnabled && company.emailIntegration?.isActive) {
    channels.push({
      type: 'email',
      config: {
        fromEmail: company.emailIntegration.fromEmail,
        replyTo: company.emailIntegration.replyTo,
        toEmail: company.email, // Default to company email
      },
    });
  }

  // Slack
  if (prefs?.slackEnabled && company.slackIntegration?.isActive) {
    channels.push({
      type: 'slack',
      config: {
        botToken: company.slackIntegration.botToken,
        channelId: company.slackIntegration.channelId,
        teamId: company.slackIntegration.slackTeamId,
      },
    });
  }

  // Microsoft Teams
  if (prefs?.teamsEnabled && company.teamsIntegration?.isActive) {
    channels.push({
      type: 'teams',
      config: {
        webhookUrl: company.teamsIntegration.webhookUrl,
        channelName: company.teamsIntegration.channelName,
      },
    });
  }

  return channels;
}

/**
 * Get specific channel configuration
 */
function getChannelConfig(company, channel) {
  switch (channel.toLowerCase()) {
    case 'email':
      if (company.emailIntegration?.isActive) {
        return {
          fromEmail: company.emailIntegration.fromEmail,
          replyTo: company.emailIntegration.replyTo,
          toEmail: company.email,
        };
      }
      break;
    
    case 'slack':
      if (company.slackIntegration?.isActive) {
        return {
          botToken: company.slackIntegration.botToken,
          channelId: company.slackIntegration.channelId,
          teamId: company.slackIntegration.slackTeamId,
        };
      }
      break;
    
    case 'teams':
      if (company.teamsIntegration?.isActive) {
        return {
          webhookUrl: company.teamsIntegration.webhookUrl,
          channelName: company.teamsIntegration.channelName,
        };
      }
      break;
  }
  
  return null;
}

/**
 * Prepare messages for QStash topics
 */
function prepareMessages({ channels, companyId, notificationType, data, resourceId, company }) {
  return channels.map(channel => {
    const deduplicationId = generateDeduplicationId(companyId, notificationType, resourceId);
    
    const payload = {
      companyId,
      companyName: company.name,
      notificationType,
      data,
      channel: channel.type,
      channelConfig: channel.config,
      timestamp: new Date().toISOString(),
    };

    return {
      topic: TOPICS[channel.type.toUpperCase()],
      payload,
      deduplicationId,
      retries: 3,
    };
  });
}

/**
 * Log notification attempt to database
 */
async function logNotificationAttempt({ companyId, notificationType, channels, success, error = null, data }) {
  try {


    console.log('Notification attempt:', {
      companyId,
      notificationType,
      channels,
      success,
      error,
      timestamp: new Date().toISOString(),
    });



    await prisma.notificationLog.create({
      data: {
        companyId,
        notificationType,
        channels: channels.join(','),
        success,
        error,
        metadata: JSON.stringify(data),
      },
    });

  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Batch send notifications (useful for bulk operations)
 */
export async function sendBulkNotifications(notifications) {
  const results = await Promise.allSettled(
    notifications.map(notification => sendNotification(notification))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    success: failed === 0,
    successful,
    failed,
    total: notifications.length,
    results,
  };
}
