import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request, { params }) {
  const { shareId } = await params;

  try {
    const share = await prisma.videoShare.findUnique({
      where: { id: shareId },
      include: { video: true }
    });

    if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (share.accessType === 'PASSWORD') {
      // Don't send video details yet
      return NextResponse.json({ reason: 'PASSWORD_REQUIRED' }, { status: 403 });
    }

    // Return public video data
    return NextResponse.json({
      title: share.video.title,
      url: share.video.playbackUrl,
      id:share.video.id,
      streamId:share.video.streamId,
      allowComments: share.allowComments,
      allowDownload: share.allowDownload
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
