// app/api/upload/abort/route.js
import { NextResponse } from "next/server";
import { z } from "zod";
import { r2 } from "@/app/lib/r2";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

const abortUploadSchema = z.object({
  uploadId: z.string().min(1, "Upload ID is required"),
  key: z.string().min(1, "Key is required"),
});

export async function POST(request) {
  try {
    const { employee: currentUser, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const body = await request.json();
    const validation = abortUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }

    const { uploadId, key } = validation.data;

    // ✅ Find upload session (SYNCED)
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { uploadId },
    });

    if (!uploadSession) {
      return NextResponse.json(
        { success: false, error: "Upload session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (uploadSession.uploadedBy !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ✅ Abort multipart upload in R2
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    });

    await r2.send(abortCommand);
    console.log(`[UPLOAD ABORT] R2 multipart aborted: ${uploadId}`);

    // ✅ Update session status (SYNCED)
    await prisma.uploadSession.update({
      where: { uploadId },
      data: {
        status: "ABORTED",
      },
    });

    console.log(`✅ [UPLOAD ABORT] Session aborted: ${uploadId}`);

    return NextResponse.json({
      success: true,
      message: "Upload aborted successfully",
    });

  } catch (error) {
    console.error("❌ [UPLOAD ABORT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload abort failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
