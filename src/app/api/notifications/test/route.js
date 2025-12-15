import { NextResponse } from 'next/server';
import { sendNotificationToChannel } from '@/app/lib/notifications/notification-service';
import { sendSlackNotification, verifySlackToken } from '@/app/lib/integrations/slack-handler';
import { sendTeamsNotification, verifyTeamsWebhook } from '@/app/lib/integrations/teams-handler';
import { sendEmailNotification, verifyEmailConfig } from '@/app/lib/integrations/email-handler';
import { decrypt } from '@/app/lib/integrations/encryption';
import { prisma } from '@/app/lib/prisma';

/**
 * Test Notification Integrations
 * POST /api/notifications/test
 * Body: { companyId, channel }
 * channel: 'email' | 'slack' | 'teams' | 'all'
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, channel } = body;

    // Validate input
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel is required (email, slack, teams, or all)' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session || session.user.companyId !== companyId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log(`Testing ${channel} notification for company ${companyId}`);

    // Fetch company integrations
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
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Test data
    const testData = {
      campaignName: 'Test Campaign',
      status: 'Completed',
      stats: {
        videosProcessed: 5,
        totalViews: 250,
      },
    };

    const results = {};

    // Test specific channel or all channels
    if (channel === 'all' || channel === 'email') {
      results.email = await testEmailIntegration(company);
    }

    if (channel === 'all' || channel === 'slack') {
      results.slack = await testSlackIntegration(company);
    }

    if (channel === 'all' || channel === 'teams') {
      results.teams = await testTeamsIntegration(company);
    }

    // Check if any tests failed
    const hasFailures = Object.values(results).some(result => !result.success);

    return NextResponse.json({
      success: !hasFailures,
      message: hasFailures 
        ? 'Some integrations failed the test'
        : 'All integrations tested successfully',
      results,
    });
  } catch (error) {
    console.error('Test notification error:', error);

    return NextResponse.json(
      {
        error: 'Failed to test notification',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Test email integration
 */
async function testEmailIntegration(company) {
  try {
    if (!company.emailIntegration?.isActive) {
      return {
        success: false,
        error: 'Email integration not configured or inactive',
      };
    }

    // Verify email configuration
    const verification = await verifyEmailConfig(company.emailIntegration.fromEmail);

    if (!verification.valid) {
      return {
        success: false,
        error: `Email verification failed: ${verification.error}`,
      };
    }

    // Send test email
    const result = await sendEmailNotification({
      fromEmail: company.emailIntegration.fromEmail,
      toEmail: company.email || company.emailIntegration.fromEmail,
      replyTo: company.emailIntegration.replyTo,
      notificationType: 'campaign_completed',
      data: {
        campaignName: 'Test Campaign',
        status: 'Completed',
        stats: {
          videosProcessed: 5,
          totalViews: 250,
        },
        companyName: company.name,
      },
    });

    return {
      success: true,
      message: 'Test email sent successfully',
      emailId: result.emailId,
      recipient: company.email || company.emailIntegration.fromEmail,
    };
  } catch (error) {
    console.error('Email test error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test Slack integration
 */
async function testSlackIntegration(company) {
  try {
    if (!company.slackIntegration?.isActive) {
      return {
        success: false,
        error: 'Slack integration not configured or inactive',
      };
    }

    // Decrypt bot token
    const botToken = decrypt(company.slackIntegration.botToken);

    if (!botToken) {
      return {
        success: false,
        error: 'Failed to decrypt Slack bot token',
      };
    }

    // Verify token is valid
    const verification = await verifySlackToken(botToken);

    if (!verification.valid) {
      return {
        success: false,
        error: `Slack token verification failed: ${verification.error}`,
      };
    }

    // Send test message
    const result = await sendSlackNotification({
      botToken,
      channelId: company.slackIntegration.channelId,
      notificationType: 'campaign_completed',
      data: {
        campaignName: 'Test Campaign',
        status: 'Completed',
        stats: {
          videosProcessed: 5,
          totalViews: 250,
        },
        companyName: company.name,
      },
    });

    return {
      success: true,
      message: 'Test message sent to Slack successfully',
      messageId: result.messageId,
      channel: result.channel,
      channelName: company.slackIntegration.channelName,
    };
  } catch (error) {
    console.error('Slack test error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test Microsoft Teams integration
 */
async function testTeamsIntegration(company) {
  try {
    if (!company.teamsIntegration?.isActive) {
      return {
        success: false,
        error: 'Teams integration not configured or inactive',
      };
    }

    // Decrypt webhook URL
    const webhookUrl = decrypt(company.teamsIntegration.webhookUrl);

    if (!webhookUrl) {
      return {
        success: false,
        error: 'Failed to decrypt Teams webhook URL',
      };
    }

    // Verify webhook is valid
    const verification = await verifyTeamsWebhook(webhookUrl);

    if (!verification.valid) {
      return {
        success: false,
        error: `Teams webhook verification failed: ${verification.error}`,
      };
    }

    // Send test message
    const result = await sendTeamsNotification({
      webhookUrl,
      notificationType: 'campaign_completed',
      data: {
        campaignName: 'Test Campaign',
        status: 'Completed',
        stats: {
          videosProcessed: 5,
          totalViews: 250,
        },
        companyName: company.name,
      },
    });

    return {
      success: true,
      message: 'Test message sent to Teams successfully',
      status: result.status,
      channelName: company.teamsIntegration.channelName,
    };
  } catch (error) {
    console.error('Teams test error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get test notification types
 * GET /api/notifications/test
 */
export async function GET(request) {
  try {
    const { NOTIFICATION_TYPES } = await import('@/app/lib/notifications/notification-formatter');

    return NextResponse.json({
      success: true,
      availableTypes: Object.entries(NOTIFICATION_TYPES).map(([key, value]) => ({
        key,
        value,
      })),
      channels: ['email', 'slack', 'teams', 'all'],
      usage: {
        endpoint: 'POST /api/notifications/test',
        body: {
          companyId: 'string (required)',
          channel: 'email | slack | teams | all (required)',
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch test info',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
