import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request, { params }) {
  const { shareId } = params;
  const { password } = await request.json();

  try {
    const share = await prisma.videoShare.findUnique({
      where: { id: shareId },
      include: { video: true }
    });

    if (!share || !share.passwordHash) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, share.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Success: Return video details
    return NextResponse.json({
      title: share.video.title,
      url: share.video.playbackUrl,
      allowComments: share.allowComments,
      allowDownload: share.allowDownload
    });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
