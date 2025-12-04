//cacheable invalidate on post call

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query params
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      companyId: user.companyId,
      status,
      OR: [
        { adminId: user.id },
        { assignments: { some: { employeeId: user.id } } }
      ]
    };

    // Search filter
    if (search) {
      where.AND = {
        name: { contains: search, mode: 'insensitive' }
      };
    }

    // Build orderBy
    let orderBy = {};
    if (sortBy === 'videoCount') {
      orderBy = { videos: { _count: sortOrder } };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch campaigns with pagination
    const [campaigns, totalCount] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              videos: true,
              assignments: true
            }
          },
          videos: {
            where: { status: 'ready' },
            take: 4,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.campaign.count({ where })
    ]);

    // Get stats
    const stats = await prisma.campaign.aggregate({
      where: { companyId: user.companyId, status: 'active' },
      _count: true
    });

    const videoStats = await prisma.video.aggregate({
      where: { 
        campaign: { companyId: user.companyId, status: 'active' },
        status: 'ready'
      },
      _count: true
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          admin: {
            id: campaign.admin.id,
            name: `${campaign.admin.firstName} ${campaign.admin.lastName}`,
            avatarUrl: campaign.admin.avatarUrl
          },
          team: campaign.team,
          videoCount: campaign._count.videos,
          memberCount: campaign._count.assignments,
          recentVideos: campaign.videos
        })),
        stats: {
          totalCampaigns: stats._count,
          totalVideos: videoStats._count
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('[CAMPAIGNS LIST ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
