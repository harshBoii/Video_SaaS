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

export async function GET(req) {
  try {
    const decoded = await verifyToken();
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get URL params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.userId },
      select: { id: true, companyId: true }
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

    if (campaignIds.length === 0) {
      return NextResponse.json({
        success: true,
        videos: []
      });
    }

    // Fetch videos with streamId
    const videos = await prisma.video.findMany({
      where: {
        campaignId: { in: campaignIds },
        status: { not: 'archived' }
      },
      select: {
        id: true,
        title: true,
        filename: true,
        duration: true,
        status: true,
        thumbnailUrl: true,
        playbackUrl: true,
        streamId: true,  // ✅ Added streamId
        currentVersion: true,  // ✅ Added currentVersion
        createdAt: true,
        campaign: {
          select: {
            id: true,
            name: true
          }
        },
        // Get view count
        _count: {
          select: {
            views: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Format the response
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      filename: video.filename,
      duration: video.duration,
      status: video.status,
      thumbnailUrl: video.thumbnailUrl,
      playbackUrl: video.playbackUrl,
      streamId: video.streamId,  // ✅ Include streamId
      currentVersion: video.currentVersion,  // ✅ Include currentVersion
      views: video._count.views,
      comments: video._count.comments,
      createdAt: video.createdAt,
      campaign: video.campaign
    }));

    return NextResponse.json({
      success: true,
      videos: formattedVideos
    });

  } catch (error) {
    console.error('[VIDEOS API ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
