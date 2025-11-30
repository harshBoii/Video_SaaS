import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { shareId } = await params;
    
    const share = await prisma.videoShare.findUnique({
      where: { id: shareId },
      include: {
        video: {
          select: { id: true, title: true, currentVersion: true }
        }
      }
    });

    if (!share) {
      return NextResponse.json({ success: false, error: 'Invalid share link' }, { status: 404 });
    }

    const versions = await prisma.videoVersion.findMany({
      where: { videoId: share.videoId },
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
          select: {
            firstName: true,
            lastName: true,
          }
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
      video: share.video
    });
  } catch (error) {
    console.error('[PUBLIC VERSIONS ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load versions' }, { status: 500 });
  }
}
