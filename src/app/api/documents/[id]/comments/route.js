import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

// GET - List all comments
export async function GET(request, { params }) {
  try {
    // Allow both authenticated and guest access for shared documents
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");
    
    let user = null;
    if (!shareId) {
      const { employee, error: authError } = await verifyJWT(request);
      if (authError) {
        return NextResponse.json({ success: false, error: authError }, { status: 401 });
      }
      user = employee;
    }

    const { id } = params;

    const comments = await prisma.documentComment.findMany({
      where: {
        documentId: id,
        parentId: null, // Top-level comments only
      },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        resolver: {
          select: {
            id: true,
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
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Format response
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      status: comment.status,
      priority: comment.priority,
      versionNumber: comment.versionNumber,
      guestName: comment.guestName,
      employee: comment.employee ? {
        id: comment.employee.id,
        name: `${comment.employee.firstName} ${comment.employee.lastName}`,
        email: comment.employee.email,
        avatarUrl: comment.employee.avatarUrl,
      } : null,
      resolver: comment.resolver ? {
        id: comment.resolver.id,
        name: `${comment.resolver.firstName} ${comment.resolver.lastName}`,
      } : null,
      resolvedAt: comment.resolvedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        guestName: reply.guestName,
        employee: reply.employee ? {
          id: reply.employee.id,
          name: `${reply.employee.firstName} ${reply.employee.lastName}`,
          email: reply.employee.email,
          avatarUrl: reply.employee.avatarUrl,
        } : null,
        createdAt: reply.createdAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formattedComments,
    });

  } catch (error) {
    console.error("❌ [COMMENTS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Add new comment
export async function POST(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");
    
    let user = null;
    let isGuest = false;

    if (!shareId) {
      const { employee, error: authError } = await verifyJWT(request);
      if (authError) {
        return NextResponse.json({ success: false, error: authError }, { status: 401 });
      }
      user = employee;
    } else {
      isGuest = true;
    }

    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: "Comment content is required" },
        { status: 400 }
      );
    }

    // If guest, require guestName
    if (isGuest && !body.guestName) {
      return NextResponse.json(
        { success: false, error: "Guest name is required" },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.documentComment.create({
      data: {
        documentId: id,
        content: body.content,
        employeeId: user?.id,
        guestName: isGuest ? body.guestName : null,
        versionNumber: body.versionNumber,
        priority: body.priority || "NONE",
        parentId: body.parentId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      data: {
        id: comment.id,
        content: comment.content,
        status: comment.status,
        priority: comment.priority,
        versionNumber: comment.versionNumber,
        guestName: comment.guestName,
        employee: comment.employee ? {
          id: comment.employee.id,
          name: `${comment.employee.firstName} ${comment.employee.lastName}`,
          email: comment.employee.email,
          avatarUrl: comment.employee.avatarUrl,
        } : null,
        createdAt: comment.createdAt,
      },
    });

  } catch (error) {
    console.error("❌ [COMMENT CREATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
