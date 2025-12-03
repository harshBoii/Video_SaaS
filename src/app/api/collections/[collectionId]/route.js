import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { shareId } = params;
    
    console.log('🔍 Fetching versions for shareId:', shareId);

    let videoId = null;

    // 1. Try as VideoShare ID (uuid format)
    const videoShare = await prisma.videoShare.findUnique({
      where: { id: shareId },
      select: { videoId: true }
    });

    if (videoShare) {
      videoId = videoShare.videoId;
      console.log('✅ Found via VideoShare:', videoId);
    } else {
      // 2. Fallback: Try as direct Video ID (cuid format)
      const video = await prisma.video.findUnique({
        where: { id: shareId },
        select: { id: true }
      });

      if (video) {
        videoId = video.id;
        console.log('✅ Found via Video ID:', videoId);
      }
    }

    if (!videoId) {
      console.log('❌ No video found for shareId:', shareId);
      return NextResponse.json(
        { success: false, error: 'Invalid share link or video not found' },
        { status: 404 }
      );
    }

    // Fetch versions
    const versions = await prisma.videoVersion.findMany({
      where: { videoId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        status: true,
        streamId: true,
        playbackUrl: true,
        thumbnailUrl: true,
        fileSize: true,
        versionNote: true,
        isActive: true,
        createdAt: true,
        uploader: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const formattedVersions = versions.map(v => ({
      ...v,
      uploaderName: v.uploader ? `${v.uploader.firstName} ${v.uploader.lastName}` : 'Unknown',
      fileSize: Number(v.fileSize)
    }));

    return NextResponse.json({
      success: true,
      versions: formattedVersions,
      videoId
    });

  } catch (error) {
    console.error('[PUBLIC VERSIONS ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load versions' },
      { status: 500 }
    );
  }
}
