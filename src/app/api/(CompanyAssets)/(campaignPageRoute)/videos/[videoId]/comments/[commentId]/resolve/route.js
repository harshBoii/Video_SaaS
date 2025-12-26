// app/api/videos/[videoId]/comments/[commentId]/resolve/route.js
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';



export async function PATCH(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { commentId } = await params;

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: decoded.id,
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error resolving comment:', error);
    return NextResponse.json(
      { error: 'Failed to resolve comment' },
      { status: 500 }
    );
  }
}
