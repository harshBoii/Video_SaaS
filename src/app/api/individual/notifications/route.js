// app/api/individual/notifications/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('[NOTIFICATIONS] JWT verify error:', err.message);
    return null;
  }
}

export async function GET() {
  try {
    const decoded = await getUserFromToken();
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = decoded.id;

    // campaigns where user is assigned
    const userCampaigns = await prisma.campaignAssignment.findMany({
      where: { employeeId },
      select: { campaignId: true }
    });

    const campaignIds = userCampaigns.map(c => c.campaignId);

    if (campaignIds.length === 0) {
      return NextResponse.json({ success: true, notifications: [], count: 0 });
    }

    // unresolved comments on videos in those campaigns
    const comments = await prisma.comment.findMany({
      where: {
        status: 'OPEN',
        video: {
          campaignId: { in: campaignIds }
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        video: {
          select: {
            id: true,
            title: true,
            streamId: true,
            campaignId: true,
            campaign: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const notifications = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      timestamp: comment.timestamp,      // seconds in video
      priority: comment.priority,        // HIGH / MEDIUM / LOW
      status: comment.status,           // OPEN
      createdAt: comment.createdAt,
      commenter: comment.employee ? {
        id: comment.employee.id,
        name: `${comment.employee.firstName} ${comment.employee.lastName}`,
        email: comment.employee.email
      } : {
        id: null,
        name: comment.guestName || 'Anonymous',
        email: null
      },
      video: {
        id: comment.video.id,
        title: comment.video.title,
        streamId: comment.video.streamId,
        campaign: {
          id: comment.video.campaign.id,
          name: comment.video.campaign.name
        }
      }
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Notifications Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}
