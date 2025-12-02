import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

export async function GET(request) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const { employee, error } = await verifyJWT(request);
    
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    // ✅ 2. GET QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type') || 'all'; // 'videos', 'projects', or 'all'
    const limit = parseInt(searchParams.get('limit')) || 20;

    // ✅ 3. VALIDATE QUERY
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters'
      }, { status: 400 });
    }

    // ✅ 4. GET USER'S CAMPAIGNS (for permission filtering)
    const userCampaigns = await prisma.campaignAssignment.findMany({
      where: { employeeId: employee.id },
      select: { campaignId: true }
    });

    const campaignIds = userCampaigns.map(c => c.campaignId);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: {
          videos: [],
          projects: [],
          total: 0
        }
      });
    }

    // ✅ 5. SEARCH LOGIC
    const results = {
      videos: [],
      projects: [],
      total: 0
    };

    // Search case-insensitive pattern
    const searchPattern = `%${query}%`;

    // 🎥 SEARCH VIDEOS (if type is 'videos' or 'all')
    if (type === 'videos' || type === 'all') {
      results.videos = await prisma.video.findMany({
        where: {
          campaignId: { in: campaignIds },
          status: { not: 'deleted' },
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              filename: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              views: true,
              comments: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: type === 'videos' ? limit : Math.floor(limit / 2)
      });

      results.videos = results.videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        createdAt: video.createdAt,
        projectId: video.campaign.id,
        projectName: video.campaign.name,
        views: video._count.views,
        comments: video._count.comments,
        type: 'video'
      }));
    }

    // 📁 SEARCH PROJECTS/CAMPAIGNS (if type is 'projects' or 'all')
    if (type === 'projects' || type === 'all') {
      results.projects = await prisma.campaign.findMany({
        where: {
          id: { in: campaignIds },
          status: { not: 'deleted' },
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              videos: true,
              assignments: true
            }
          },
          assignments: {
            where: {
              employeeId: employee.id
            },
            select: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' }
        ],
        take: type === 'projects' ? limit : Math.floor(limit / 2)
      });

      results.projects = results.projects.map(project => ({
        id: project.id,
        name: project.name,
        videoCount: project._count.videos,
        memberCount: project._count.assignments,
        role: project.assignments[0]?.role.name || 'Member',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        type: 'project'
      }));
    }

    // ✅ 6. CALCULATE TOTAL
    results.total = results.videos.length + results.projects.length;

    // ✅ 7. RETURN RESULTS
    return NextResponse.json({
      success: true,
      query,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SEARCH ERROR]', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform search',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// ❌ Only GET allowed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
