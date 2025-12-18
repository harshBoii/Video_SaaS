import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

// PATCH - Update comment

export async function PATCH(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { commentId } = await params;
    const body = await request.json();

    // Get existing comment
    const existingComment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { 
        employeeId: true,
        documentId: true, 
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    
    const updateData = {};

    
    if (body.content && existingComment.employeeId === user.id) {
      updateData.content = body.content.trim();
    }

   
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "RESOLVED") {
        updateData.resolvedBy = user.id;
        updateData.resolvedAt = new Date();
        
        if (body.resolution) {
          updateData.resolution = body.resolution.trim();
        }
      } else if (body.status === "OPEN") {
        
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
        updateData.resolution = null;
      }
    }

    if (body.priority) {
      updateData.priority = body.priority;
    }

    const updatedComment = await prisma.documentComment.update({
      where: { id: commentId },
      data: updateData,
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully",
      comment: { 
        id: updatedComment.id,
        content: updatedComment.content,
        status: updatedComment.status,
        priority: updatedComment.priority,
        resolution: updatedComment.resolution, 
        resolvedAt: updatedComment.resolvedAt,
        resolvedBy: updatedComment.resolver ? {
          id: updatedComment.resolver.id,
          name: `${updatedComment.resolver.firstName} ${updatedComment.resolver.lastName}`,
        } : null,
      },
    });

  } catch (error) {
    console.error("❌ [COMMENT UPDATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment
export async function DELETE(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { commentId } = await params;

    // Verify ownership
    const comment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { employeeId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.employeeId !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    await prisma.documentComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (error) {
    console.error("❌ [COMMENT DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
