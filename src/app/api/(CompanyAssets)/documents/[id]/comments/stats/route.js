import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

// GET - Get comment statistics
export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    const { id: documentId } = await params;

    // Get all comments for stats
    const comments = await prisma.documentComment.findMany({
      where: { documentId, parentId: null },
      select: {
        priority: true,
        status: true,
        versionNumber: true,
      },
    });

    // Calculate stats
    const stats = {
      total: comments.length,
      byPriority: {
        LOW: comments.filter(c => c.priority === 'LOW').length,
        MEDIUM: comments.filter(c => c.priority === 'MEDIUM').length,
        HIGH: comments.filter(c => c.priority === 'HIGH').length,
        NONE: comments.filter(c => c.priority === 'NONE').length,
      },
      byStatus: {
        OPEN: comments.filter(c => c.status === 'OPEN').length,
        RESOLVED: comments.filter(c => c.status === 'RESOLVED').length,
      },
      byVersion: comments.reduce((acc, comment) => {
        const version = comment.versionNumber || 'current';
        acc[version] = (acc[version] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('[COMMENT STATS ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
