import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { shareId } = await params;
    const { versionIds } = await request.json();

    const share = await prisma.videoShare.findUnique({
      where: { id: shareId },
      include: { video: { select: { id: true, title: true } } }
    });

    if (!share) {
      return NextResponse.json({ success: false, error: 'Invalid share link' }, { status: 404 });
    }

    const versions = await prisma.videoVersion.findMany({
      where: {
        id: { in: versionIds },
        videoId: share.videoId
      },
      include: {
        uploader: { select: { firstName: true, lastName: true } }
      }
    });

    const formattedVersions = versions.map(v => ({
      ...v,
      uploaderName: v.uploader ? `${v.uploader.firstName} ${v.uploader.lastName}` : 'Unknown',
      fileSize: Number(v.fileSize)
    }));

    return NextResponse.json({
      success: true,
      comparison: {
        videoTitle: share.video.title,
        versions: formattedVersions,
        comments: []
      }
    });
  } catch (error) {
    console.error('[PUBLIC COMPARE ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load comparison' }, { status: 500 });
  }
}
