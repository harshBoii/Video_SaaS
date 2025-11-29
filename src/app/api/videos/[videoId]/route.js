import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    const serializedVideo = {
      ...video,
      originalSize: video.originalSize ? video.originalSize.toString() : null,
    };

    return NextResponse.json({ success: true, video: serializedVideo });
  } catch (error) {
    console.error('Video Fetch Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video',
      details: error.message 
    }, { status: 500 });
  }
}
