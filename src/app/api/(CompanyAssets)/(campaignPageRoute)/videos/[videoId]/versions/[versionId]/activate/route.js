import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    const { videoId, versionId } = await params;

    // Get version number
    const version = await prisma.videoVersion.findUnique({
      where: { id: versionId },
      select: { version: true, streamId: true, playbackUrl: true }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Transaction to update
    await prisma.$transaction([
      // Deactivate all versions
      prisma.videoVersion.updateMany({
        where: { videoId },
        data: { isActive: false }
      }),
      // Activate selected version
      prisma.videoVersion.update({
        where: { id: versionId },
        data: { isActive: true }
      }),
      // Update video's current version and playback URLs
      prisma.video.update({
        where: { id: videoId },
        data: {
          currentVersion: version.version,
          streamId: version.streamId,
          playbackUrl: version.playbackUrl,
          status: version.streamId ? 'ready' : 'processing', // ✅ ADD CHECK

        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Version activation error:', error);
    return NextResponse.json({ error: 'Failed to activate version' }, { status: 500 });
  }
}
