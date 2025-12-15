/**
 * Send a notification to Microsoft Teams channel via webhook
 */
export async function sendTeamsNotification({ webhookUrl, notificationType, data }) {
  try {
    const card = formatTeamsMessage(notificationType, data);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Teams webhook failed: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    console.error('Teams notification error:', error);
    
    // Handle specific Teams errors
    if (error.message.includes('404')) {
      throw new Error('Teams webhook URL is invalid or deleted');
    }
    if (error.message.includes('400')) {
      throw new Error('Invalid message format for Teams');
    }
    
    throw new Error(`Teams error: ${error.message}`);
  }
}

/**
 * Verify Teams webhook URL is valid
 */
export async function verifyTeamsWebhook(webhookUrl) {
  try {
    const testCard = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: 'Connection Test',
                weight: 'Bolder',
                size: 'Medium',
              },
              {
                type: 'TextBlock',
                text: 'Your Teams integration is working correctly!',
                wrap: true,
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCard),
    });

    return { valid: response.ok, status: response.status };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Format notification into Microsoft Teams Adaptive Card format
 */
function formatTeamsMessage(notificationType, data) {
  const templates = {
    campaign_completed: {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '🎉 Campaign Completed',
                weight: 'Bolder',
                size: 'Large',
                color: 'Good',
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Campaign:',
                    value: data.campaignName,
                  },
                  {
                    title: 'Status:',
                    value: data.status,
                  },
                  {
                    title: 'Videos Processed:',
                    value: String(data.stats?.videosProcessed || 0),
                  },
                  {
                    title: 'Total Views:',
                    value: String(data.stats?.totalViews || 0),
                  },
                ],
              },
              {
                type: 'TextBlock',
                text: `Completed at ${new Date().toLocaleString()}`,
                size: 'Small',
                color: 'Accent',
                spacing: 'Medium',
              },
            ],
          },
        },
      ],
    },
    
    video_published: {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '📹 Video Published',
                weight: 'Bolder',
                size: 'Large',
                color: 'Good',
              },
              {
                type: 'TextBlock',
                text: `**${data.videoTitle}** has been published successfully.`,
                wrap: true,
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Platform:',
                    value: data.platform,
                  },
                  {
                    title: 'Duration:',
                    value: data.duration,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    
    workflow_failed: {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '⚠️ Workflow Failed',
                weight: 'Bolder',
                size: 'Large',
                color: 'Attention',
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Workflow:',
                    value: data.workflowName,
                  },
                  {
                    title: 'Error:',
                    value: data.error,
                  },
                ],
              },
              {
                type: 'TextBlock',
                text: `Failed at ${new Date().toLocaleString()}`,
                size: 'Small',
                color: 'Accent',
                spacing: 'Medium',
              },
            ],
          },
        },
      ],
    },
  };

  return templates[notificationType] || {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: notificationType,
              weight: 'Bolder',
              size: 'Medium',
            },
            {
              type: 'TextBlock',
              text: JSON.stringify(data, null, 2),
              wrap: true,
              fontType: 'Monospace',
            },
          ],
        },
      },
    ],
  };
}
