import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/app/lib/r2";

// GET - Get single document with full details
export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
        uploader: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
        },
        },
        shareSettings: true,
        versions: {
          orderBy: { version: "desc" },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
            replies: {
              include: {
                employee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true,
                  },
                },
              },
            },
            resolver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Format response
    const formattedDocument = {
      id: document.id,
      title: document.title,
      filename: document.filename,
      fileSize: Number(document.fileSize),
      fileSizeFormatted: formatBytes(document.fileSize),
      documentType: document.documentType,
      mimeType: document.mimeType,
      status: document.status,
      r2Key: document.r2Key,
      r2Bucket: document.r2Bucket,
      thumbnailUrl: document.thumbnailUrl,
      pageCount: document.pageCount,
      tags: document.tags,
      metadata: document.metadata,
      currentVersion: document.currentVersion,
      campaign: document.campaign,
      uploader: document.uploader,
      shareSettings: document.shareSettings ? {
        id: document.shareSettings.id,
        accessType: document.shareSettings.accessType,
        allowComments: document.shareSettings.allowComments,
        allowDownload: document.shareSettings.allowDownload,
        hasPassword: !!document.shareSettings.passwordHash,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/document/${document.shareSettings.id}`,
      } : null,
      versions: document.versions.map(v => ({
        id: v.id,
        version: v.version,
        fileSize: Number(v.fileSize),
        fileSizeFormatted: formatBytes(v.fileSize),
        status: v.status,
        isActive: v.isActive,
        versionNote: v.versionNote,
        uploader: v.uploader,
        createdAt: v.createdAt,
      })),
      comments: document.comments.map(c => ({
        id: c.id,
        content: c.content,
        status: c.status,
        priority: c.priority,
        versionNumber: c.versionNumber,
        guestName: c.guestName,
        employee: c.employee,
        resolver: c.resolver,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        replies: c.replies.map(r => ({
          id: r.id,
          content: r.content,
          employee: r.employee,
          guestName: r.guestName,
          createdAt: r.createdAt,
        })),
      })),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedDocument,
    });

  } catch (error) {
    console.error("❌ [DOCUMENT GET ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch document",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH - Update document
export async function PATCH(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate document exists and user has permission
    const existingDoc = await prisma.document.findUnique({
      where: { id },
      select: { id: true, uploadedBy: true, campaignId: true },
    });

    if (!existingDoc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Only allow updating specific fields
    const allowedUpdates = {
      ...(body.title && { title: body.title }),
      ...(body.tags && { tags: body.tags }),
      ...(body.status && { status: body.status }),
      ...(body.metadata && { metadata: body.metadata }),
    };

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: allowedUpdates,
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully",
      data: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        tags: updatedDocument.tags,
        status: updatedDocument.status,
        updatedAt: updatedDocument.updatedAt,
      },
    });

  } catch (error) {
    console.error("❌ [DOCUMENT UPDATE ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;

    // Get document with all versions
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        versions: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete all files from R2
    const deletePromises = [];
    
    // Delete main document file
    deletePromises.push(
      r2.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: document.r2Key,
      }))
    );

    // Delete all version files
    for (const version of document.versions) {
      if (version.r2Key !== document.r2Key) {
        deletePromises.push(
          r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: version.r2Key,
          }))
        );
      }
    }

    // Execute all R2 deletions
    await Promise.allSettled(deletePromises);

    // Delete from database (cascade will handle related records)
    await prisma.document.delete({
      where: { id },
    });

    console.log(`✅ [DOCUMENT DELETED] ID: ${id} | User: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    console.error("❌ [DOCUMENT DELETE ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete document",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
