import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/app/lib/r2";

export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get("versionId");

    // Get document
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        r2Key: true,
        r2Bucket: true,
        mimeType: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    let r2Key = document.r2Key;
    let filename = document.filename;

    // If specific version requested
    if (versionId) {
      const version = await prisma.documentVersion.findUnique({
        where: { id: versionId },
        select: { r2Key: true },
      });

      if (!version) {
        return NextResponse.json(
          { success: false, error: "Version not found" },
          { status: 404 }
        );
      }

      r2Key = version.r2Key;
    }

    // Generate signed URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: document.r2Bucket,
      Key: r2Key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
      ResponseContentType: document.mimeType,
    });

    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    console.log(`✅ [DOCUMENT DOWNLOAD] ID: ${id} | User: ${user.email}`);

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrl,
        filename: filename,
        expiresIn: 3600,
      },
    });

  } catch (error) {
    console.error("❌ [DOCUMENT DOWNLOAD ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate download link",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
