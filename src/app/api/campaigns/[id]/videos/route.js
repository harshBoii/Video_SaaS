// app/api/campaigns/[id]/videos/route.js
import { authenticateRequest } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/api-response';
import prisma from '@/app/lib/prisma';
import { canAccessCampaign } from '@/app/lib/auth';
export async function GET(request, { params }) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const { id } = params;

    // Verify user has access to this campaign
    const hasAccess = await canAccessCampaign(user.id, user.companyId, id);
    if (!hasAccess) {
      return ApiResponse.forbidden('You do not have access to this campaign');
    }

    const videos = await prisma.video.findMany({
      where: {
        campaignId: id,
        status: {
          in: ['ready', 'processing'] // Include processing videos too
        }
      },
      select: {
        id: true,
        title: true,
        filename: true,
        thumbnailUrl: true,
        duration: true,
        resolution: true,
        status: true,
        createdAt: true,
        streamId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ApiResponse.success(videos, `Found ${videos.length} videos`);
  } catch (error) {
    console.error('Fetch campaign videos error:', error);
    return ApiResponse.error('Failed to fetch videos', 500);
  }
}
