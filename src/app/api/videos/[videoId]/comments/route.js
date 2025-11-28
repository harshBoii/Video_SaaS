// app/api/videos/[videoId]/comments/route.js
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// GET - Fetch all comments for a video
export async function GET(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await params;

    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        resolver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;
    
    // FIX: Destructure priority from the request body here
    const { content, timestamp, parentId, priority } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        videoId,
        employeeId: decoded.id,
        content,
        timestamp: timestamp || null,
        parentId: parentId || null,
        priority: priority || 'NONE' // Use the variable now that it is defined, defaulting to 'NONE'
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
