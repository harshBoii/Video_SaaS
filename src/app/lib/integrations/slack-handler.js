import { WebClient } from '@slack/web-api';

/**
 * Send a notification to Slack channel
 */
export async function sendSlackNotification({ botToken, channelId, notificationType, data }) {
  try {
    const client = new WebClient(botToken);
    
    const blocks = formatSlackMessage(notificationType, data);
    
    const result = await client.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: `Notification: ${notificationType}`, // Fallback text
    });

    return {
      success: true,
      messageId: result.ts,
      channel: result.channel,
    };
  } catch (error) {
    console.error('Slack notification error:', error);
    
    // Handle specific Slack errors
    if (error.data?.error === 'channel_not_found') {
      throw new Error('Slack channel not found or bot not invited');
    }
    if (error.data?.error === 'invalid_auth') {
      throw new Error('Slack bot token is invalid or expired');
    }
    if (error.data?.error === 'not_in_channel') {
      throw new Error('Bot must be invited to the channel');
    }
    
    throw new Error(`Slack error: ${error.message}`);
  }
}

/**
 * Fetch available channels for a workspace
 */
export async function fetchSlackChannels(botToken) {
  try {
    const client = new WebClient(botToken);
    
    // Fetch public channels
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
    });

    return result.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      isMember: channel.is_member,
    }));
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    throw new Error(`Failed to fetch channels: ${error.message}`);
  }
}

/**
 * Verify Slack bot token is valid
 */
export async function verifySlackToken(botToken) {
  try {
    const client = new WebClient(botToken);
    const result = await client.auth.test();
    
    return {
      valid: true,
      teamId: result.team_id,
      teamName: result.team,
      botUserId: result.user_id,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Exchange OAuth code for bot token
 */
export async function exchangeSlackCode(code) {
  try {
    const client = new WebClient();
    
    const result = await client.oauth.v2.access({
      client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`, // ✅ ADD THIS
    });

    return {
      botToken: result.access_token,
      teamId: result.team.id,
      teamName: result.team.name,
      scope: result.scope,
    };
  } catch (error) {
    console.error('Slack OAuth error:', error);
    throw new Error(`OAuth exchange failed: ${error.message}`);
  }
}

/**
 * Format notification into Slack Block Kit format
 */
function formatSlackMessage(notificationType, data) {
  const templates = {
    campaign_completed: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 Campaign Completed',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Campaign:*\n${data.campaignName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${data.status}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Videos Processed:*\n${data.stats?.videosProcessed || 0}`,
          },
          {
            type: 'mrkdwn',
            text: `*Total Views:*\n${data.stats?.totalViews || 0}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Completed at ${new Date().toLocaleString()}`,
          },
        ],
      },
    ],
    
    video_published: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📹 Video Published',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${data.videoTitle}* has been published successfully.`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Platform:*\n${data.platform}`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${data.duration}`,
          },
        ],
      },
    ],
    
    workflow_failed: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Workflow Failed',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Workflow:* ${data.workflowName}\n*Error:* ${data.error}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Failed at ${new Date().toLocaleString()}`,
          },
        ],
      },
    ],
  };

  return templates[notificationType] || [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${notificationType}*\n${JSON.stringify(data, null, 2)}`,
      },
    },
  ];
}
