// app/api/videos/[id]/upload-version-lambda/route.js
import { NextResponse } from "next/server";
import { z } from "zod";
import { r2 } from "@/app/lib/r2";
import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand,
  CompleteMultipartUploadCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "@/app/lib/prisma";
import { sanitizeMetadata } from "@/app/lib/validation";

const uploadVersionSchema = z.object({
  versionNote: z.string().min(1, "Version note is required"),
  fileSize: z.number().positive("File size must be positive"),
  editMetadata: z.object({
    crop: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    resize: z.tuple([z.number(), z.number()]).optional(),
    trim: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
});

export async function POST(request, { params }) {
  try {
    const { id: videoId } = params;
    const body = await request.json();

    console.log('[LAMBDA VERSION UPLOAD] Video:', videoId);

    // ✅ Validate request
    const validation = uploadVersionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { versionNote, fileSize, editMetadata } = validation.data;

    // ✅ Get original video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { campaign: true }
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // ✅ Calculate next version
    const currentVersion = video.currentVersion || 0;
    const newVersion = currentVersion + 1;

    // ✅ Generate R2 key
    const timestamp = Date.now();
    const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${video.campaignId}/${timestamp}-${sanitizedTitle}_v${newVersion}.mp4`;

    // ✅ Calculate multipart upload parts (same as your upload/start)
    const partSize = 10 * 1024 * 1024; // 10MB per part
    const totalParts = Math.ceil(fileSize / partSize);

    console.log(`[LAMBDA VERSION] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[LAMBDA VERSION] Parts: ${totalParts}`);

    // ✅ Create multipart upload in R2
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: 'video/mp4',
      Metadata: {
        originalVideoId: videoId,
        version: newVersion.toString(),
        versionNote: sanitizeMetadata(versionNote),
        processedBy: 'lambda',
        ...(editMetadata && { editMetadata: JSON.stringify(editMetadata) }),
      },
    });

    const multipartUpload = await r2.send(createCommand);
    const uploadId = multipartUpload.UploadId;

    if (!uploadId) {
      throw new Error("Failed to initialize multipart upload in R2");
    }

    console.log(`[LAMBDA VERSION] R2 Upload ID: ${uploadId}`);

    // ✅ Generate presigned URLs for each part
    const urls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const signedUrl = await getSignedUrl(r2, uploadPartCommand, {
        expiresIn: 3600, // 1 hour
      });

      urls.push({
        partNumber,
        url: signedUrl,
      });
    }

    console.log(`[LAMBDA VERSION] Generated ${urls.length} presigned URLs`);

    // ✅ Create VideoVersion record in DB
    const version = await prisma.videoVersion.create({
      data: {
        videoId,
        version: newVersion,
        key,
        size: BigInt(fileSize),
        versionNote,
        editMetadata: editMetadata || null,
        status: 'UPLOADING',
        // Don't set createdBy since this is from Lambda
      },
    });

    console.log(`✅ [LAMBDA VERSION] Version ${newVersion} created: ${version.id}`);

    // ✅ Return upload info (Lambda will upload parts and call complete)
    return NextResponse.json({
      success: true,
      upload: {
        uploadId,
        key,
        partSize,
        totalParts,
      },
      urls,
      version: {
        id: version.id,
        version: newVersion,
      },
      message: "Version upload initialized successfully",
    });

  } catch (error) {
    console.error("❌ [LAMBDA VERSION ERROR]", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Version upload initialization failed",
        message: process.env.NODE_ENV === "development" ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
