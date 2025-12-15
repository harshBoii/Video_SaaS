import { NextResponse } from 'next/server';
import { sendNotification } from '@/app/lib/notifications/notification-service';
import { validateNotificationPayload } from '@/app/lib/notifications/notification-formatter';

/**
 * Send Notification
 * POST /api/notifications/send
 * Body: { companyId, notificationType, data, resourceId? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, notificationType, data, resourceId } = body;

    // TODO: Add authentication check
    // Verify the requesting user/service has permission to send notifications for this company
    // const session = await getServerSession();
    // if (!session || !hasPermission(session.user, companyId)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!notificationType) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Data object is required' },
        { status: 400 }
      );
    }

    // Validate notification payload
    const validation = validateNotificationPayload(notificationType, data);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid notification data',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    console.log(`Sending notification: ${notificationType} for company ${companyId}`);

    // Send notification via service
    const result = await sendNotification({
      companyId,
      notificationType,
      data,
      resourceId,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      channels: result.channels,
      messageIds: result.messageIds,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Notification send error:', error);

    return NextResponse.json(
      {
        error: 'Failed to send notification',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get notification status
 * GET /api/notifications/send?companyId=xxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check

    // Import prisma
    const { prisma } = await import('@/app/lib/prisma');

    // Fetch company notification settings
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        notificationPreference: true,
        slackIntegration: {
          select: {
            isActive: true,
            channelName: true,
            installedAt: true,
          },
        },
        teamsIntegration: {
          select: {
            isActive: true,
            channelName: true,
            installedAt: true,
          },
        },
        emailIntegration: {
          select: {
            isActive: true,
            fromEmail: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get recent notification logs
    const recentLogs = await prisma.notificationLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate success rates
    const totalNotifications = recentLogs.length;
    const successfulNotifications = recentLogs.filter(log => log.success).length;
    const successRate = totalNotifications > 0 
      ? ((successfulNotifications / totalNotifications) * 100).toFixed(2)
      : 0;

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
      },
      preferences: company.notificationPreference,
      integrations: {
        slack: company.slackIntegration,
        teams: company.teamsIntegration,
        email: company.emailIntegration,
      },
      statistics: {
        totalNotifications,
        successfulNotifications,
        failedNotifications: totalNotifications - successfulNotifications,
        successRate: `${successRate}%`,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Error fetching notification status:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch notification status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
