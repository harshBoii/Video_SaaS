import { NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/notifications/qstash-client';
import { prisma } from '@/app/lib/prisma';

/**
 * Dead Letter Queue (DLQ) Worker
 * Handles messages that failed after max retries
 * POST /api/workers/dlq
 */
export async function POST(request) {
  try {
    // Get QStash signature from headers
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    // Verify QStash signature
    const isValid = await verifySignature(signature, null, body);
    
    if (!isValid) {
      console.error('Invalid QStash signature for DLQ worker');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);
    const { companyId, companyName, notificationType, data, channel, channelConfig } = payload;

    console.error(`⚠️ DLQ: Notification permanently failed for company ${companyId}`);
    console.error(`Channel: ${channel}, Type: ${notificationType}`);

    // Log to database with detailed error info
    await prisma.notificationLog.create({
      data: {
        companyId,
        notificationType,
        channels: channel,
        success: false,
        error: 'Message moved to DLQ after max retries',
        metadata: {
          channel,
          isDLQ: true,
          originalPayload: payload,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Check failure count for this company/channel
    const recentFailures = await prisma.notificationLog.count({
      where: {
        companyId,
        channels: channel,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // If too many failures, deactivate the integration
    if (recentFailures >= 5) {
      console.error(`🚨 Deactivating ${channel} integration for company ${companyId} due to repeated failures`);
      
      switch (channel) {
        case 'slack':
          await prisma.slackIntegration.update({
            where: { companyId },
            data: { isActive: false },
          });
          break;
        
        case 'teams':
          await prisma.teamsIntegration.update({
            where: { companyId },
            data: { isActive: false },
          });
          break;
        
        case 'email':
          await prisma.emailIntegration.update({
            where: { companyId },
            data: { isActive: false },
          });
          break;
      }

      // Disable channel in notification preferences
      await prisma.notificationPreference.update({
        where: { companyId },
        data: {
          [`${channel}Enabled`]: false,
        },
      });

      // TODO: Send alert to company admin about integration failure
      // You might want to send an email notification here
      console.log(`📧 Admin notification needed for company ${companyId}`);
    }

    // Store in a separate DLQ table (optional)
    // await prisma.notificationDLQ.create({ ... });

    return NextResponse.json({
      success: true,
      message: 'DLQ message processed',
      action: recentFailures >= 5 ? 'integration_deactivated' : 'logged',
    });
  } catch (error) {
    console.error('DLQ worker error:', error);

    // Even if DLQ processing fails, return 200 to prevent infinite loops
    return NextResponse.json(
      {
        error: 'DLQ processing failed',
        message: error.message,
      },
      { status: 200 } // Don't retry DLQ failures
    );
  }
}

/**
 * GET endpoint to retrieve DLQ messages for manual inspection
 * GET /api/workers/dlq?companyId=xxx&limit=50
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Add authentication check
    // Only allow admins to view DLQ

    const where = {
      success: false,
      metadata: {
        path: ['isDLQ'],
        equals: true,
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const dlqMessages = await prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: dlqMessages.length,
      messages: dlqMessages,
    });
  } catch (error) {
    console.error('Error fetching DLQ messages:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch DLQ messages',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to retry a DLQ message manually
 * POST /api/workers/dlq/retry
 * Body: { messageId }
 */
export async function PUT(request) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    // Only allow admins to retry messages

    // Fetch the failed notification log
    const log = await prisma.notificationLog.findUnique({
      where: { id: messageId },
    });

    if (!log) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Extract original payload from metadata
    const originalPayload = log.metadata?.originalPayload;

    if (!originalPayload) {
      return NextResponse.json(
        { error: 'Original payload not found in metadata' },
        { status: 400 }
      );
    }

    // Re-trigger the notification using notification-service
    const { sendNotificationToChannel } = await import('@/app/lib/notifications/notification-service');
    
    await sendNotificationToChannel({
      companyId: log.companyId,
      channel: log.channels,
      notificationType: log.notificationType,
      data: originalPayload.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification retry triggered',
    });
  } catch (error) {
    console.error('Error retrying DLQ message:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retry message',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
