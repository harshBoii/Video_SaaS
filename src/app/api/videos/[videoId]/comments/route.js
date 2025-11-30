import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// GET - Fetch comments
// GET endpoint - make sure it returns versionNumber
export async function GET(request, { params }) {
  try {
    const { videoId } = await params;
    const { employee, error } = await verifyJWT(request);
    
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      where: { 
        videoId,
        parentId: null // Only root comments, replies are nested
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        replies: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ✅ Format to include versionNumber
    const formattedComments = comments.map(comment => ({
      ...comment,
      versionNumber: comment.versionNumber, // ✅ Ensure this is included
      replies: comment.replies?.map(reply => ({
        ...reply,
        versionNumber: reply.versionNumber // ✅ Include in nested replies too
      }))
    }));

    return NextResponse.json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('[GET COMMENTS ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST endpoint - ensure versionNumber is saved
export async function POST(request, { params }) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { 
      content, 
      timestamp, 
      priority = 'NONE', 
      isGuest = false, 
      guestName,
      parentId,
      versionNumber // ✅ Accept versionNumber from frontend
    } = body;

    let employeeId = null;
    
    if (!isGuest) {
      const { employee, error } = await verifyJWT(request);
      if (error) {
        return NextResponse.json({ success: false, error }, { status: 401 });
      }
      employeeId = employee.id;
    }

    // Validate
    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (isGuest && !guestName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Guest name is required' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        videoId,
        employeeId,
        content: content.trim(),
        timestamp: timestamp || null,
        priority,
        status: 'OPEN',
        isGuest,
        guestName: isGuest ? guestName.trim() : null,
        parentId: parentId || null,
        versionNumber: versionNumber || null, // ✅ Save versionNumber
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('[CREATE COMMENT ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
