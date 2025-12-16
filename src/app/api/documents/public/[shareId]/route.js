import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/app/lib/r2";

export async function POST(request, { params }) {
  try {
    const { shareId } = params;
    const body = await request.json();
    const { password } = body;

    // Get share settings with document
    const shareSettings = await prisma.documentShare.findUnique({
      where: { id: shareId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            filename: true,
            fileSize: true,
            documentType: true,
            mimeType: true,
            r2Key: true,
            r2Bucket: true,
            thumbnailUrl: true,
            pageCount: true,
            status: true,
            createdAt: true,
            uploader: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!shareSettings) {
      return NextResponse.json(
        { success: false, error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    // Check if password is required
    if (shareSettings.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, shareSettings.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Generate signed URL for viewing (valid for 4 hours)
    const command = new GetObjectCommand({
      Bucket: shareSettings.document.r2Bucket,
      Key: shareSettings.document.r2Key,
      ResponseContentType: shareSettings.document.mimeType,
    });

    const viewUrl = await getSignedUrl(r2, command, { expiresIn: 14400 });

    // Generate download URL if allowed
    let downloadUrl = null;
    if (shareSettings.allowDownload) {
      const downloadCommand = new GetObjectCommand({
        Bucket: shareSettings.document.r2Bucket,
        Key: shareSettings.document.r2Key,
        ResponseContentDisposition: `attachment; filename="${shareSettings.document.filename}"`,
        ResponseContentType: shareSettings.document.mimeType,
      });

      downloadUrl = await getSignedUrl(r2, downloadCommand, { expiresIn: 3600 });
    }

    return NextResponse.json({
      success: true,
      data: {
        document: {
          id: shareSettings.document.id,
          title: shareSettings.document.title,
          filename: shareSettings.document.filename,
          fileSize: Number(shareSettings.document.fileSize),
          fileSizeFormatted: formatBytes(shareSettings.document.fileSize),
          documentType: shareSettings.document.documentType,
          mimeType: shareSettings.document.mimeType,
          thumbnailUrl: shareSettings.document.thumbnailUrl,
          pageCount: shareSettings.document.pageCount,
          uploaderName: shareSettings.document.uploader.name,
          createdAt: shareSettings.document.createdAt,
        },
        access: {
          viewUrl,
          downloadUrl,
          allowComments: shareSettings.allowComments,
          allowDownload: shareSettings.allowDownload,
        },
      },
    });

  } catch (error) {
    console.error("❌ [PUBLIC ACCESS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to access document" },
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
