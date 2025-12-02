import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function verifyToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('[JWT VERIFY ERROR]', error.message);
    return null;
  }
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export async function GET(req) {
  try {
    const decoded = await verifyToken();
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.userId },
      select: { id: true }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get campaigns where user is assigned
    const campaigns = await prisma.campaign.findMany({
      where: {
        assignments: {
          some: {
            employeeId: employee.id
          }
        },
        status: 'active'
      },
      select: { id: true }
    });

    const campaignIds = campaigns.map(c => c.id);

    // Get recent views
    const recentViews = await prisma.videoView.findMany({
      where: {
        video: {
          campaignId: { in: campaignIds }
        }
      },
      include: {
        video: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.floor(limit / 2)
    });

    // Get recent comments
    const recentComments = await prisma.comment.findMany({
      where: {
        video: {
          campaignId: { in: campaignIds }
        },
        status: 'OPEN'
      },
      include: {
        video: {
          select: {
            title: true
          }
        },
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.floor(limit / 2)
    });

    // Combine and format activities
    const activities = [
      ...recentViews.map(view => ({
        type: 'view',
        message: `New view on "${view.video.title}"`,
        time: formatTimeAgo(view.createdAt),
        createdAt: view.createdAt
      })),
      ...recentComments.map(comment => ({
        type: 'comment',
        message: `${comment.employee ? `${comment.employee.firstName} ${comment.employee.lastName}` : comment.guestName || 'Guest'} commented on "${comment.video.title}"`,
        time: formatTimeAgo(comment.createdAt),
        createdAt: comment.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(({ createdAt, ...rest }) => rest); // Remove createdAt from final output

    return NextResponse.json({
      success: true,
      activity: activities
    });

  } catch (error) {
    console.error('[GET ACTIVITY ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
