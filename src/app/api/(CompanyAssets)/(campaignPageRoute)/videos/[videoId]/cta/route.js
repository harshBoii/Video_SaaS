// app/api/videos/[videoId]/cta/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch CTAs for player
export async function GET(request, { params }) {
  try {
    const { videoId } = await params;
    const ctas = await prisma.videoCTA.findMany({
      where: { videoId },
      orderBy: { time: 'asc' } // Sort by appearance time
    });
    return NextResponse.json({ success: true, ctas });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch CTAs' }, { status: 500 });
  }
}

// POST - Create new CTA
export async function POST(request, { params }) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { type, text, url, time, color, position } = body;

    const cta = await prisma.videoCTA.create({
      data: {
        videoId,
        type: type || 'BUTTON',
        text,
        url,
        time: time || -1, // Default to post-roll if null
        color,
        position
      }
    });

    return NextResponse.json({ success: true, cta });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create CTA' }, { status: 500 });
  }
}
