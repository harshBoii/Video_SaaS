import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;

    // Get all campaigns where user is assigned
    const userCampaigns = await prisma.campaignAssignment.findMany({
      where: { employeeId },
      select: { campaignId: true }
    });

    const campaignIds = userCampaigns.map(c => c.campaignId);

    if (campaignIds.length === 0) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    // Get all unresolved comments on videos in those campaigns
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

    // Format response
    const notifications = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      timestamp: comment.timestamp,
      priority: comment.priority,
      status: comment.status,
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
    return NextResponse.json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    }, { status: 500 });
  }
}
