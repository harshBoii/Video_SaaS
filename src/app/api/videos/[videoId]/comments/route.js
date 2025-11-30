import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// GET - Fetch comments
export async function GET(request, { params }) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'desc';

    const comments = await prisma.comment.findMany({
      where: { videoId, parentId: null },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { timestamp: 'asc' },
        { createdAt: sort === 'desc' ? 'desc' : 'asc' }
      ],
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST - Create comment
export async function POST(request, { params }) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { content, timestamp, parentId, priority, isGuest, guestName } = body;

    let employeeId = null;
    let finalGuestName = null;

    // ✅ AUTHENTICATION LOGIC (Restored)
    if (isGuest) {
      finalGuestName = guestName || "Guest User";
    } else {
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        const decoded = verify(token, process.env.JWT_SECRET);
        employeeId = decoded.id;
      } catch (err) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        videoId,
        content,
        timestamp: typeof timestamp === 'number' ? timestamp : null,
        parentId: parentId || null,
        priority: priority || 'NONE',
        status: 'OPEN',
        ...(employeeId ? { employeeId } : {}),
        ...(finalGuestName ? { guestName: finalGuestName } : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Create Error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
