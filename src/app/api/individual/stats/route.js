// Cacheable , invalidate On Video Upload and Project Creation
// app/api/individual/stats/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('[STATS] JWT verify error:', err.message);
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

    // campaigns where this user is assigned
    const assignments = await prisma.campaignAssignment.findMany({
      where: { employeeId },
      select: { campaignId: true }
    });

    const campaignIds = assignments.map(a => a.campaignId);
    if (campaignIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalVideos: 0,
          totalProjects: 0,
          totalShares: 0,
          pendingReviews: 0,
          resolvedReviews: 0,
        }
      });
    }

    // total projects = distinct campaigns
    const totalProjects = await prisma.campaign.count({
      where: { id: { in: campaignIds } }
    });

    // videos in these campaigns
    const videos = await prisma.video.findMany({
      where: {
        campaignId: { in: campaignIds },
        status: { not: 'archived' }
      },
      select: {
        id: true,
        // shareCount: true
      }
    });

    const totalVideos = videos.length;


    const totalShares = 0

    // comments in these campaigns
    const pendingReviews = await prisma.comment.count({
      where: {
        status: 'OPEN',
        video: {
          campaignId: { in: campaignIds }
        }
      }
    });

    const resolvedReviews = await prisma.comment.count({
      where: {
        status: 'RESOLVED',
        video: {
          campaignId: { in: campaignIds }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalVideos,
        totalProjects,
        totalShares,
        pendingReviews,
        resolvedReviews,
      }
    });
  } catch (error) {
    console.error('[INDIVIDUAL STATS ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}

