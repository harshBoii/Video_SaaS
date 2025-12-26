import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;
    
    // ✅ Get version from query parameter
    const { searchParams } = new URL(request.url);
    const versionNumber = searchParams.get('version');

    // Fetch base video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        filename: true,
        currentVersion: true,
        campaignId: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    let streamId, playbackUrl, status, versionData;

    if (versionNumber) {
      // ✅ Fetch specific version
      const version = await prisma.videoVersion.findUnique({
        where: {
          videoId_version: {
            videoId: videoId,
            version: parseInt(versionNumber),
          },
        },
      });

      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      streamId = version.streamId;
      playbackUrl = version.playbackUrl;
      status = version.status;
      versionData = {
        id: version.id,
        version: version.version,
        isActive: version.isActive,
        versionNote: version.versionNote,
      };
    } else {
      // ✅ Fetch active/current version
      const activeVersion = await prisma.videoVersion.findFirst({
        where: {
          videoId: videoId,
          isActive: true,
        },
      });

      if (!activeVersion) {
        return NextResponse.json({ error: 'No active version found' }, { status: 404 });
      }

      streamId = activeVersion.streamId;
      playbackUrl = activeVersion.playbackUrl;
      status = activeVersion.status;
      versionData = {
        id: activeVersion.id,
        version: activeVersion.version,
        isActive: true,
        versionNote: activeVersion.versionNote,
      };
    }

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        streamId,
        playbackUrl,
        status,
        currentVersion: video.currentVersion,
        version: versionData,
      },
    });
  } catch (error) {
    console.error('[VIDEO GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
