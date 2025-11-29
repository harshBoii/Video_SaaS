import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;
    const { commentId } = await params;
    const { resolution } = await request.json();

    if (!resolution || resolution.trim() === '') {
      return NextResponse.json({ error: 'Resolution text is required' }, { status: 400 });
    }

    // Update comment status
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: employeeId
      },
      include: {
        video: {
          select: {
            title: true
          }
        }
      }
    });

    // Create a reply with the resolution
    await prisma.comment.create({
      data: {
        videoId: comment.videoId,
        employeeId: employeeId,
        content: `✅ Resolution: ${resolution}`,
        parentId: commentId,
        status: 'RESOLVED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment resolved successfully',
      comment
    });

  } catch (error) {
    console.error('Resolve Error:', error);
    return NextResponse.json({ 
      error: 'Failed to resolve comment',
      details: error.message 
    }, { status: 500 });
  }
}
