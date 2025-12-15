import { NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/notifications/qstash-client';
import { sendEmailNotification } from '@/app/lib/integrations/email-handler';
import { prisma } from '@/app/lib/prisma';

/**
 * Email Worker - Processes email notifications from QStash
 * POST /api/workers/email
 */
export async function POST(request) {
  try {
    // Get QStash signature from headers
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    // Verify QStash signature
    const isValid = await verifySignature(signature, null, body);
    
    if (!isValid) {
      console.error('Invalid QStash signature for email worker');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);
    const { companyId, companyName, notificationType, data, channelConfig } = payload;

    console.log(`Processing email notification for company ${companyId}: ${notificationType}`);

    // Validate payload
    if (!companyId || !notificationType || !channelConfig) {
      throw new Error('Missing required fields in payload');
    }

    // Send email notification
    const result = await sendEmailNotification({
      fromEmail: channelConfig.fromEmail,
      toEmail: channelConfig.toEmail,
      replyTo: channelConfig.replyTo,
      notificationType,
      data: {
        ...data,
        companyName, // Include company name in email
      },
    });

    // Log success
    await logNotificationDelivery({
      companyId,
      channel: 'email',
      notificationType,
      success: true,
      metadata: {
        emailId: result.emailId,
        recipient: channelConfig.toEmail,
      },
    });

    console.log(`Email sent successfully to ${channelConfig.toEmail}`);

    return NextResponse.json({
      success: true,
      channel: 'email',
      emailId: result.emailId,
    });
  } catch (error) {
    console.error('Email worker error:', error);

    // Log failure
    try {
      const payload = JSON.parse(await request.text());
      await logNotificationDelivery({
        companyId: payload.companyId,
        channel: 'email',
        notificationType: payload.notificationType,
        success: false,
        error: error.message,
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    // Return 500 to trigger QStash retry
    return NextResponse.json(
      {
        error: 'Email delivery failed',
        message: error.message,
      },
      { status: 500 }
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
