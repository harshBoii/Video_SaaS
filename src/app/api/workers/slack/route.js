import { NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/notifications/qstash-client';
import { sendSlackNotification } from '@/app/lib/integrations/slack-handler';
import { decrypt } from '@/app/lib/integrations/encryption';
import { prisma } from '@/app/lib/prisma';

/**
 * Slack Worker - Processes Slack notifications from QStash
 * POST /api/workers/slack
 */
export async function POST(request) {
  try {
    // Get QStash signature from headers
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    // Verify QStash signature
    const isValid = await verifySignature(signature, null, body);
    
    if (!isValid) {
      console.error('Invalid QStash signature for Slack worker');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);
    const { companyId, companyName, notificationType, data, channelConfig } = payload;

    console.log(`Processing Slack notification for company ${companyId}: ${notificationType}`);

    // Validate payload
    if (!companyId || !notificationType || !channelConfig) {
      throw new Error('Missing required fields in payload');
    }

    // Decrypt bot token
    const botToken = decrypt(channelConfig.botToken);

    if (!botToken) {
      throw new Error('Failed to decrypt Slack bot token');
    }

    // Send Slack notification
    const result = await sendSlackNotification({
      botToken,
      channelId: channelConfig.channelId,
      notificationType,
      data: {
        ...data,
        companyName,
      },
    });

    // Log success
    await logNotificationDelivery({
      companyId,
      channel: 'slack',
      notificationType,
      success: true,
      metadata: {
        messageId: result.messageId,
        slackChannel: result.channel,
        teamId: channelConfig.teamId,
      },
    });

    // Update last success timestamp
    await prisma.slackIntegration.update({
      where: { companyId },
      data: {
        // You can add lastSuccessAt field to track this
        updatedAt: new Date(),
      },
    });

    console.log(`Slack message sent successfully to channel ${channelConfig.channelId}`);

    return NextResponse.json({
      success: true,
      channel: 'slack',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Slack worker error:', error);

    // Log failure
    try {
      const payload = JSON.parse(await request.text());
      await logNotificationDelivery({
        companyId: payload.companyId,
        channel: 'slack',
        notificationType: payload.notificationType,
        success: false,
        error: error.message,
      });

      // If bot token is invalid, deactivate integration
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        await prisma.slackIntegration.update({
          where: { companyId: payload.companyId },
          data: { isActive: false },
        });
        console.log(`Deactivated Slack integration for company ${payload.companyId}`);
      }
    } catch (logError) {
      console.error('Failed to log Slack error:', logError);
    }

    // Return 500 to trigger QStash retry (unless auth error)
    const statusCode = error.message.includes('invalid') || error.message.includes('expired') 
      ? 200 // Don't retry auth errors
      : 500;

    return NextResponse.json(
      {
        error: 'Slack delivery failed',
        message: error.message,
      },
      { status: statusCode }
    );
  }
}

/**
 * Log notification delivery to database
 */
async function logNotificationDelivery({ companyId, channel, notificationType, success, error = null, metadata = {} }) {
  try {
    await prisma.notificationLog.create({
      data: {
        companyId,
        notificationType,
        channels: channel,
        success,
        error,
        metadata: {
          channel,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (err) {
    console.error('Failed to log notification delivery:', err);
  }
}
