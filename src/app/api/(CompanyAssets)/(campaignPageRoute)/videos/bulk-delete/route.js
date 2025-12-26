import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const { videoIds } = await request.json();

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video IDs required' },
        { status: 400 }
      );
    }

    // Verify user has permission to delete these videos
    const videos = await prisma.video.findMany({
      where: {
        id: { in: videoIds },
        campaign: {
          companyId: user.companyId,
          OR: [
            { adminId: user.id }, // Campaign admin
            { assignments: { some: { employeeId: user.id } } } // Assigned member
          ]
        }
      },
      select: { id: true }
    });

    if (videos.length !== videoIds.length) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or videos not found' },
        { status: 403 }
      );
    }

    // Soft delete (update status)
    await prisma.video.updateMany({
      where: { id: { in: videoIds } },
      data: { status: 'archived' }
    });

    return NextResponse.json({
      success: true,
      message: `${videoIds.length} videos deleted successfully`
    });

  } catch (error) {
    console.error('[BULK DELETE ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete videos' },
      { status: 500 }
    );
  }
}
