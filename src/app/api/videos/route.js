import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query params
    const campaignId = searchParams.get('campaignId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'ready';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status,
      campaign: {
        companyId: user.companyId,
        status: 'active' // Only active campaigns
      }
    };

    // Filter by campaign
    if (campaignId) {
      where.campaignId = campaignId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Build orderBy
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Fetch videos with pagination
    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              admin: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              comments: true,
              views: true
            }
          }
        }
      }),
      prisma.video.count({ where })
    ]);

    const serializedVideos = videos.map(video => ({
      ...video,
      originalSize: video.originalSize.toString(), // BigInt → String
      uploaderName: `${video.uploader.firstName} ${video.uploader.lastName}`,
      commentCount: video._count.comments,
      viewCount: video._count.views,
      _count: undefined
    }));


    return NextResponse.json({
      success: true,
      data: {
        videos: serializedVideos,
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
    console.error('[VIDEOS LIST ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
