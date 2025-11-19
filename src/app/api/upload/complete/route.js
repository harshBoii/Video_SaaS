// app/api/upload/complete/route.js
import { r2 } from "@/app/lib/r2";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { verifyJWT } from "@/app/lib/auth";
import { completeUploadSchema, formatZodError, COMPRESSION_THRESHOLD } from "@/app/lib/validation";
import { queueStreamUpload } from "@/app/lib/streamQueue";

export async function POST(request) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    // ✅ 2. PARSE AND VALIDATE INPUT
    const body = await request.json();
    const validation = completeUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const { uploadId, key, parts } = validation.data;

    // ✅ 3. VERIFY UPLOAD SESSION EXISTS AND BELONGS TO USER
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { uploadId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    });

    if (!uploadSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload session not found",
          message: "Invalid uploadId or session expired",
        },
        { status: 404 }
      );
    }

    // ✅ 4. VERIFY USER OWNS THIS UPLOAD SESSION
    if (uploadSession.uploadedBy !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "This upload session belongs to another user",
        },
        { status: 403 }
      );
    }

    // ✅ 5. CHECK SESSION STATUS
    if (uploadSession.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Upload already completed",
          message: "This upload has already been completed",
          videoId: uploadSession.videoId,
        },
        { status: 400 }
      );
    }

    if (uploadSession.status === "ABORTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Upload was aborted",
          message: "This upload session was cancelled",
        },
        { status: 400 }
      );
    }

    // ✅ 6. VERIFY KEY MATCHES
    if (uploadSession.key !== key) {
      return NextResponse.json(
        {
          success: false,
          error: "Key mismatch",
          message: "Provided key does not match upload session",
        },
        { status: 400 }
      );
    }

    // ✅ 7. VERIFY ALL PARTS ARE UPLOADED
    if (parts.length !== uploadSession.totalParts) {
      return NextResponse.json(
        {
          success: false,
          error: "Incomplete upload",
          message: `Expected ${uploadSession.totalParts} parts, but received ${parts.length} parts`,
          expectedParts: uploadSession.totalParts,
          receivedParts: parts.length,
        },
        { status: 400 }
      );
    }

    // ✅ 8. SORT PARTS BY PART NUMBER (required by S3/R2)
    const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

    // ✅ 9. COMPLETE MULTIPART UPLOAD ON R2
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    const r2Response = await r2.send(command);

    console.log(`[UPLOAD COMPLETE] R2 upload completed: ${key}`);

    // ✅ 10. CREATE VIDEO RECORD IN DATABASE
    const video = await prisma.video.create({
      data: {
        title: uploadSession.fileName.replace(/\.[^/.]+$/, ""), // Remove extension
        filename: uploadSession.fileName,
        originalSize: uploadSession.fileSize,
        status: "ready",
        r2Key: key,
        r2Bucket: process.env.R2_BUCKET_NAME,
        campaignId: uploadSession.campaignId,
        uploadedBy: user.id,
        currentVersion: 1,
        metadata: {},
        tags: [],
      },
    });

    console.log(`[UPLOAD COMPLETE] Video record created: ${video.id}`);

    // ✅ 11. CREATE INITIAL VIDEO VERSION
    await prisma.videoVersion.create({
      data: {
        videoId: video.id,
        version: 1,
        r2Key: key,
        fileSize: uploadSession.fileSize,
        status: "ready",
        isActive: true,
        versionNote: "Initial upload",
        uploadedBy: user.id,
      },
    });

    // ✅ 12. UPDATE UPLOAD SESSION TO COMPLETED
    await prisma.uploadSession.update({
      where: { id: uploadSession.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        videoId: video.id,
      },
    });

    // ✅ 13. SMART COMPRESSION & STREAM QUEUE LOGIC 🎯
    const fileSize = uploadSession.fileSize;
    const needsCompression = Number(fileSize) > COMPRESSION_THRESHOLD;

    let processingInfo = {};

    if (needsCompression) {
      // ✅ FILE > 25GB: Queue for compression FIRST, then Stream
      console.log(
        `[UPLOAD COMPLETE] Video ${video.id} is ${formatBytes(fileSize)} (> 25GB). Queuing for compression before Stream upload.`
      );

      try {
        // Create compression job with HIGH priority
        const compressionJob = await prisma.compressionJob.create({
          data: {
            videoId: video.id,
            quality: "high",
            codec: "h264",
            targetBitrate: 8000, // 8 Mbps
            priority: "HIGH",
            status: "PENDING",
            requestedBy: user.id,
            attempts: 0,
            maxAttempts: 3,
            metadata: {
              reason: "auto_compression_threshold",
              originalSize: Number(fileSize),
              threshold: COMPRESSION_THRESHOLD,
              autoQueued: true,
            },
          },
        });

        // Update video status to processing
        await prisma.video.update({
          where: { id: video.id },
          data: {
            status: "processing",
            metadata: {
              compressionRequired: true,
              compressionJobId: compressionJob.id,
              compressionReason: "File size exceeds 25GB threshold",
            },
          },
        });

        processingInfo = {
          requiresCompression: true,
          compressionJobId: compressionJob.id,
          reason: "File size exceeds 25GB threshold",
          threshold: formatBytes(COMPRESSION_THRESHOLD),
          estimatedCompressionTime: estimateCompressionTime(fileSize),
          workflow: [
            "1. Video compressed to reduce size",
            "2. Compressed video uploaded to Cloudflare Stream",
            "3. Original video kept in R2 storage",
            "4. You'll be notified when ready for playback",
          ],
        };

        console.log(`[UPLOAD COMPLETE] Compression job ${compressionJob.id} created for video ${video.id}`);
      } catch (compressionError) {
        console.error(`[UPLOAD COMPLETE] Failed to create compression job:`, compressionError);
        
        // Fallback: queue for Stream anyway (will fail if too large)
        processingInfo = {
          requiresCompression: true,
          compressionError: "Failed to queue compression",
          fallback: "Attempting direct Stream upload",
        };
      }
    } else {
      // ✅ FILE ≤ 25GB: Queue directly for Stream (no compression)
      console.log(
        `[UPLOAD COMPLETE] Video ${video.id} is ${formatBytes(fileSize)} (≤ 25GB). Queuing directly for Stream upload.`
      );

      try {
        await queueStreamUpload(video.id, key, "NORMAL");
        
        processingInfo = {
          requiresCompression: false,
          reason: "File size within 25GB threshold",
          threshold: formatBytes(COMPRESSION_THRESHOLD),
          workflow: [
            "1. Video queued for Cloudflare Stream upload",
            "2. Stream will process and optimize video",
            "3. You'll be notified when ready for playback",
          ],
        };

        console.log(`[UPLOAD COMPLETE] Video ${video.id} queued for Cloudflare Stream`);
      } catch (streamError) {
        console.error(`[UPLOAD COMPLETE] Failed to queue for Stream:`, streamError);
        
        processingInfo = {
          requiresCompression: false,
          streamError: "Failed to queue for Stream",
          note: "Video saved in R2, manual Stream upload may be required",
        };
      }
    }

    // ✅ 14. LOG COMPLETION
    console.log(
      `✅ [UPLOAD COMPLETE] Video: ${video.id} | User: ${user.email} | Campaign: ${uploadSession.campaign.name} | File: ${uploadSession.fileName} (${formatBytes(fileSize)}) | NeedsCompression: ${needsCompression}`
    );

    // ✅ 15. RETURN SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: "Upload completed successfully",
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        size: Number(video.originalSize),
        sizeFormatted: formatBytes(video.originalSize),
        status: needsCompression ? "processing" : "ready",
        r2Key: video.r2Key,
        campaign: {
          id: uploadSession.campaign.id,
          name: uploadSession.campaign.name,
        },
        uploadedAt: video.createdAt,
      },
      processing: processingInfo,
      r2: {
        location: r2Response.Location,
        etag: r2Response.ETag,
        bucket: r2Response.Bucket,
        key: r2Response.Key,
      },
      next: {
        checkStatus: `/api/videos/${video.id}/details`,
        downloadRaw: `/api/videos/${video.id}/raw`,
      },
    });
  } catch (error) {
    console.error("❌ [UPLOAD COMPLETE ERROR]", error);

    // ✅ HANDLE R2/AWS SPECIFIC ERRORS
    if (error.name === "NoSuchUpload") {
      return NextResponse.json(
        {
          success: false,
          error: "Upload not found",
          message: "The multipart upload does not exist or has expired",
        },
        { status: 404 }
      );
    }

    if (error.name === "InvalidPart") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid part",
          message: "One or more parts are invalid. Please re-upload the failed parts.",
        },
        { status: 400 }
      );
    }

    if (error.name === "EntityTooSmall") {
      return NextResponse.json(
        {
          success: false,
          error: "Parts too small",
          message: "One or more parts (except the last part) are smaller than 5MB",
        },
        { status: 400 }
      );
    }

    // ✅ HANDLE DATABASE ERRORS
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate upload",
          message: "This upload has already been completed",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reference",
          message: "Campaign or user not found",
        },
        { status: 400 }
      );
    }

    // ✅ GENERIC ERROR HANDLER
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete upload",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format bytes to human-readable string
 * ✅ Handles both Number and BigInt
 */
function formatBytes(bytes) {
  // Handle zero
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  
  // ✅ Convert BigInt to Number for Math operations
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Estimate compression time based on file size
 * Rough estimate: 1GB = 4 minutes
 * ✅ Handles BigInt
 */
function estimateCompressionTime(fileSize) {
  // ✅ Convert BigInt to Number for calculation
  const numSize = typeof fileSize === 'bigint' ? Number(fileSize) : fileSize;
  const sizeInGB = numSize / (1024 * 1024 * 1024);
  const minutes = Math.ceil(sizeInGB * 4);
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 1) {
    return mins > 0 ? `1 hour ${mins} minutes` : "1 hour";
  }
  
  return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
}
