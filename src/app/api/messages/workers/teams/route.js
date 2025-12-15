import { NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/notifications/qstash-client';
import { sendTeamsNotification } from '@/app/lib/integrations/teams-handler';
import { decrypt } from '@/app/lib/integrations/encryption';
import { prisma } from '@/app/lib/prisma';

/**
 * Microsoft Teams Worker - Processes Teams notifications from QStash
 * POST /api/workers/teams
 */
export async function POST(request) {
  try {
    // Get QStash signature from headers
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    // Verify QStash signature
    const isValid = await verifySignature(signature, null, body);
    
    if (!isValid) {
      console.error('Invalid QStash signature for Teams worker');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);
    const { companyId, companyName, notificationType, data, channelConfig } = payload;

    console.log(`Processing Teams notification for company ${companyId}: ${notificationType}`);

    // Validate payload
    if (!companyId || !notificationType || !channelConfig) {
      throw new Error('Missing required fields in payload');
    }

    // Decrypt webhook URL
    const webhookUrl = decrypt(channelConfig.webhookUrl);

    if (!webhookUrl) {
      throw new Error('Failed to decrypt Teams webhook URL');
    }

    // Send Teams notification
    const result = await sendTeamsNotification({
      webhookUrl,
      notificationType,
      data: {
        ...data,
        companyName,
      },
    });

    // Log success
    await logNotificationDelivery({
      companyId,
      channel: 'teams',
      notificationType,
      success: true,
      metadata: {
        channelName: channelConfig.channelName,
        status: result.status,
      },
    });

    // Update last success timestamp
    await prisma.teamsIntegration.update({
      where: { companyId },
      data: {
        updatedAt: new Date(),
      },
    });

    console.log(`Teams message sent successfully to ${channelConfig.channelName || 'channel'}`);

    return NextResponse.json({
      success: true,
      channel: 'teams',
      status: result.status,
    });
  } catch (error) {
    console.error('Teams worker error:', error);

    // Log failure
    try {
      const payload = JSON.parse(await request.text());
      await logNotificationDelivery({
        companyId: payload.companyId,
        channel: 'teams',
        notificationType: payload.notificationType,
        success: false,
        error: error.message,
      });

      // If webhook is invalid (404), deactivate integration
      if (error.message.includes('404') || error.message.includes('invalid')) {
        await prisma.teamsIntegration.update({
          where: { companyId: payload.companyId },
          data: { isActive: false },
        });
        console.log(`Deactivated Teams integration for company ${payload.companyId}`);
      }
    } catch (logError) {
      console.error('Failed to log Teams error:', logError);
    }

    // Return 500 to trigger QStash retry (unless webhook error)
    const statusCode = error.message.includes('404') || error.message.includes('invalid')
      ? 200 // Don't retry webhook errors
      : 500;

    return NextResponse.json(
      {
        error: 'Teams delivery failed',
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
