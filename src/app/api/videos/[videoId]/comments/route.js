import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

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

    // ✅ Format comments to ensure versionNumber is included
    const formattedComments = comments.map(comment => ({
      ...comment,
      versionNumber: comment.versionNumber || null, // ✅ Explicitly include
      replies: comment.replies?.map(reply => ({
        ...reply,
        versionNumber: reply.versionNumber || null // ✅ Include in replies too
      })) || []
    }));

    return NextResponse.json({ 
      success: true, 
      comments: formattedComments 
    });
  } catch (error) {
    console.error('[FETCH COMMENTS ERROR]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch comments' 
    }, { status: 500 });
  }
}

// POST - Create comment
export async function POST(request, { params }) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { 
      content, 
      timestamp, 
      parentId, 
      priority, 
      isGuest, 
      guestName,
      versionNumber // ✅ Accept versionNumber from frontend
    } = body;

    // ✅ Debug log
    console.log('[CREATE COMMENT] Received data:', {
      videoId,
      versionNumber,
      content: content?.substring(0, 50),
      isGuest
    });

    let employeeId = null;
    let finalGuestName = null;

    // ✅ AUTHENTICATION LOGIC
    if (isGuest) {
      finalGuestName = guestName || "Guest User";
    } else {
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized' 
        }, { status: 401 });
      }
      try {
        const decoded = verify(token, process.env.JWT_SECRET);
        employeeId = decoded.id;
      } catch (err) {
        console.error('[AUTH ERROR]:', err);
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid token' 
        }, { status: 401 });
      }
    }

    // ✅ Validate content
    if (!content || !content.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Comment content is required' 
      }, { status: 400 });
    }

    // ✅ Create comment with versionNumber (REMOVED isGuest)
    const comment = await prisma.comment.create({
      data: {
        videoId,
        content: content.trim(),
        timestamp: typeof timestamp === 'number' ? timestamp : null,
        parentId: parentId || null,
        priority: priority || 'NONE',
        status: 'OPEN',
        versionNumber: versionNumber || null, // ✅ Save versionNumber
        employeeId: employeeId || null, // ✅ Either employeeId OR guestName
        guestName: finalGuestName || null, // ✅ Guest name if no employee
      },
      include: {
        employee: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true 
          },
        },
      },
    });

    // ✅ Debug log
    console.log('[CREATE COMMENT] Success:', {
      commentId: comment.id,
      versionNumber: comment.versionNumber,
      employeeId: comment.employeeId,
      guestName: comment.guestName
    });

    return NextResponse.json({ 
      success: true, 
      comment 
    });
  } catch (error) {
    console.error('[CREATE COMMENT ERROR]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to post comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
