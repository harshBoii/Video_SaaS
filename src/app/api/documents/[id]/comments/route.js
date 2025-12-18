import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

// GET - List all comments
// ✅ FIXED VERSION
export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");
    

    const sort = searchParams.get('sort') || 'desc';
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const version = searchParams.get('version');
    
    let user = null;
    if (!shareId) {
      const { employee, error: authError } = await verifyJWT(request);
      if (authError) {
        return NextResponse.json({ success: false, error: authError }, { status: 401 });
      }
      user = employee;
    }

    const { id } = await params;


    const where = {
      documentId: id,
      parentId: null,
    };

    if (priority && priority !== 'ALL') where.priority = priority;
    if (status && status !== 'ALL') where.status = status;
    if (version && version !== 'ALL') where.versionNumber = parseInt(version, 10);

    const comments = await prisma.documentComment.findMany({
      where,
      orderBy: { createdAt: sort }, 
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
      author: comment.employee ? { 
        id: comment.employee.id,
        name: `${comment.employee.firstName} ${comment.employee.lastName}`,
        email: comment.employee.email,
        avatarUrl: comment.employee.avatarUrl,
      } : null,
      resolvedBy: comment.resolver ? {
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
        author: reply.employee ? { 
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
      comments: formattedComments,
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

    const { id } = await params;
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
        content: body.content.trim(), 
        employeeId: user?.id || null, 
        guestName: isGuest ? body.guestName : null,
        versionNumber: body.versionNumber || null, 
        priority: body.priority || "NONE",
        status: "OPEN", 
        parentId: body.parentId || null, 
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
      comment: { 
        id: comment.id,
        content: comment.content,
        status: comment.status,
        priority: comment.priority,
        versionNumber: comment.versionNumber,
        guestName: comment.guestName,
        author: comment.employee ? { 
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
