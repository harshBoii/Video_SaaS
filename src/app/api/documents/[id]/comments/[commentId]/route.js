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

    const { commentId } = params;
    const body = await request.json();

    // Get existing comment
    const existingComment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { employeeId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    // Allow update for comment owner or for resolving
    const updateData = {};

    if (body.content && existingComment.employeeId === user.id) {
      updateData.content = body.content;
    }

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "RESOLVED") {
        updateData.resolvedBy = user.id;
        updateData.resolvedAt = new Date();
      }
    }

    if (body.priority) {
      updateData.priority = body.priority;
    }

    const updatedComment = await prisma.documentComment.update({
      where: { id: commentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
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

    const { commentId } = params;

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
