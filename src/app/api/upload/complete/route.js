import { r2 } from "@/app/lib/r2";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { verifyJWT,detectAssetTypeFromKey } from "@/app/lib/auth";
import { completeUploadSchema, formatZodError, COMPRESSION_THRESHOLD } from "@/app/lib/validation";

export async function POST(request) {
  let uploadSession = null;
  
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

    const { uploadId, key, parts, duration, versionId } = body;

    // ✅ 3. VERIFY UPLOAD SESSION EXISTS
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
    var companyId = uploadSession.campaign.campaignId
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
          videoId: uploadSession.videoId,
          documentId: uploadSession.documentId
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
          message: "Upload key does not match session",
        },
        { status: 400 }
      );
    }

    // ✅ 7. COMPREHENSIVE PARTS VALIDATION
    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parts array",
          message: "Parts must be a non-empty array",
        },
        { status: 400 }
      );
    }

    if (parts.length !== uploadSession.totalParts) {
      return NextResponse.json(
        {
          success: false,
          error: "Incomplete upload",
          message: `Expected ${uploadSession.totalParts} parts, received ${parts.length}`,
        },
        { status: 400 }
      );
    }

    // ✅ 7.1 VALIDATE EACH PART HAS REQUIRED FIELDS
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part.ETag || typeof part.ETag !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid part data",
            message: `Part at index ${i} is missing valid ETag`,
          },
          { status: 400 }
        );
      }
      if (!part.PartNumber || typeof part.PartNumber !== 'number') {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid part data",
            message: `Part at index ${i} is missing valid PartNumber`,
          },
          { status: 400 }
        );
      }
    }

    // ✅ 7.2 SORT AND VALIDATE PARTS ARE SEQUENTIAL
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
    const partNumbers = new Set(sortedParts.map(p => p.PartNumber));

    // Check for duplicates
    if (partNumbers.size !== parts.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate part numbers detected",
          message: "Each part number must be unique",
        },
        { status: 400 }
      );
    }

    // Check all part numbers from 1 to totalParts exist
    for (let i = 1; i <= uploadSession.totalParts; i++) {
      if (!partNumbers.has(i)) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing part numbers",
            message: `Part ${i} is missing from upload`,
          },
          { status: 400 }
        );
      }
    }

    console.log(`[UPLOAD VALIDATE] ✅ All ${parts.length} parts validated | Upload: ${uploadId}`);

    // ✅ 8. COMPLETE MULTIPART UPLOAD ON R2
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    let r2Response;
    try {
      r2Response = await r2.send(command);
      
      // ✅ 8.1 VALIDATE R2 COMPLETION RESPONSE
      if (!r2Response.ETag) {
        throw new Error("R2 did not return ETag - upload may have failed");
      }
      
      if (!r2Response.Key || r2Response.Key !== key) {
        throw new Error("R2 returned mismatched key");
      }

      console.log(`[R2 COMPLETE] ✅ ${key} | ETag: ${r2Response.ETag}`);
      
    } catch (r2Error) {
      console.error("❌ [R2 COMPLETION FAILED]", r2Error);
      
      // Mark upload session as failed
      await prisma.uploadSession.update({
        where: { id: uploadSession.id },
        data: { 
          status: "FAILED",
          metadata: JSON.stringify({ 
            error: r2Error.message,
            failedAt: new Date().toISOString(),
            uploadId: uploadId,
          })
        },
      });
      
      return NextResponse.json(
        {
          success: false,
          error: "Failed to complete R2 upload",
          message: process.env.NODE_ENV === "development" 
            ? r2Error.message 
            : "Upload completion failed on storage service",
        },
        { status: 500 }
      );
    }

    const assetType = detectAssetTypeFromKey(key, uploadSession.fileName);
    console.log(`[ASSET TYPE] ${assetType}`);

    // ✅ 9. PROCESS UPLOAD BASED ON TYPE (VERSION vs NEW VIDEO)
    const fileSize = uploadSession.fileSize;
    const needsCompression = Number(fileSize) > COMPRESSION_THRESHOLD;
    let responseData = {};

    if (versionId) {
      // ==========================================
      // ✅ VERSION UPLOAD PATH
      // ==========================================
      console.log(`[VERSION UPLOAD] Processing: ${versionId}`);

      const result = await processVersionUpload({
        versionId,
        uploadSession,
        key,
        fileSize,
        needsCompression,
        user,
        r2Response,
        assetType
      });

      responseData = result;

    } else {
      // ==========================================
      // FRESH UPLOAD PATH
      // ==========================================

      if (assetType === 'video'){      
      console.log(`[NEW VIDEO UPLOAD] Processing`);
      const result = await processNewVideoUpload({
        uploadSession,
        key,
        fileSize,
        needsCompression,
        duration,
        user,
        r2Response,
      });
      responseData = result;
        }
      else if (assetType === 'image' || assetType === 'document') {
        console.log(`[NEW ${assetType.toUpperCase()} UPLOAD] Processing`);
        const result = await processNewDocumentUpload({
          uploadSession,
          key,
          fileSize,
          user,
          r2Response,
          assetType,
        });

        responseData = result;
        
      } 
      else {
        throw new Error(`Unsupported asset type: ${assetType}`);
      }
    }
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ [UPLOAD COMPLETE ERROR]", error);

    // Try to mark upload as failed if we have the session
    if (uploadSession) {
      try {
        await prisma.uploadSession.update({
          where: { id: uploadSession.id },
          data: { 
            status: "FAILED",
            metadata: JSON.stringify({
              error: error.message,
              stack: error.stack,
              failedAt: new Date().toISOString(),
            })
          },
        });
      } catch (dbError) {
        console.error("Failed to update upload session status:", dbError);
      }
    }

    // Handle specific errors
    if (error.name === "NoSuchUpload") {
      return NextResponse.json(
        { success: false, error: "Upload not found on storage" },
        { status: 404 }
      );
    }

    if (error.name === "InvalidPart") {
      return NextResponse.json(
        { success: false, error: "One or more parts are invalid" },
        { status: 400 }
      );
    }

    if (error.code === "P2002") {
      const target = error.meta?.target?.[0] || "unknown field";
      return NextResponse.json(
        { 
          success: false, 
          error: "Duplicate entry",
          message: `A record with this ${target} already exists`
        },
        { status: 409 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete upload",
        message: process.env.NODE_ENV === "development" 
          ? error.message 
          : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// HELPER: PROCESS VERSION UPLOAD
// ==========================================
async function processVersionUpload({
  versionId,
  uploadSession,
  key,
  fileSize,
  needsCompression,
  user,
  r2Response,
  assetType
}) {
  return await prisma.$transaction(async (tx) => {
    let version, isVideo = false;

    version = await tx.videoVersion.findUnique({
      where: { id: versionId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            campaignId: true,
            currentVersion: true,
          }
        }
      }
    });
    if (version) {
      isVideo = true;
    }
    else {
      version = await tx.documentVersion.findUnique({
        where: { id: versionId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              campaignId: true,
              currentVersion: true,
            }
          }
        }
      });
    }
    
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // 2. Update version status
    if (isVideo) {
      await tx.videoVersion.update({
      where: { id: versionId },
      data: {
        status: needsCompression ? 'processing' : 'ready',
        r2Key: key, // Ensure R2 key is saved
      }
    });
    }
    else {
      await tx.documentVersion.update({
        where: { id: versionId },
        data: {
          status: 'ready', 
          r2Key: key,
        }
      });
    }

    let processingInfo = {};
    const parentId = isVideo ? version.videoId : version.documentId;
    const parentTitle = isVideo ? version.video.title : version.document.title;

    if (needsCompression) {
      // 3a. Queue for compression
      const compressionJob = await tx.compressionJob.create({
        data: {
          videoId: version.videoId,
          quality: "high",
          codec: "h264",
          targetBitrate: 8000,
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
            versionId: versionId,
            isVersion: true,
            r2ETag: r2Response.ETag,
          },
        },
      });

      processingInfo = {
        requiresCompression: true,
        compressionJobId: compressionJob.id,
        reason: "File size exceeds threshold",
        estimatedTime: estimateCompressionTime(fileSize),
      };

      console.log(`[COMPRESSION QUEUED] Version: ${versionId} | Job: ${compressionJob.id}`);
    } else if (isVideo) {
      // 3b. Queue for Cloudflare Stream
      await tx.streamQueue.upsert({
        where: { videoId: version.videoId },
        update: {
          r2Key: key,
          status: 'PENDING',
          priority: 'NORMAL',
          attempts: 0,
          lastError: null,
        },
        create: {
          videoId: version.videoId,
          r2Key: key,
          status: 'PENDING',
          priority: 'NORMAL',
        }
      });

      processingInfo = {
        requiresCompression: false,
        queuedForStream: true,
      };

      console.log(`[STREAM QUEUED] Version: ${versionId} | Video: ${version.videoId}`);
    }
    else {
      // Documents are ready immediately
      processingInfo = {
        requiresCompression: false,
        ready: true,
      };
    }

    // 4. Update upload session (Do not give videoId or documentId for versions)
    await tx.uploadSession.update({
      where: { id: uploadSession.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        ...(isVideo && { videoId: null }),
        ...(! isVideo && { documentId: null }),

        metadata: JSON.stringify({
          versionId: versionId,
          r2ETag: r2Response.ETag,
          completedAt: new Date().toISOString(),
          assetType: isVideo ? 'video' : 'document'
        })
      },
    });

    console.log(`✅ [VERSION COMPLETE] Version: ${versionId} | ${isVideo ? 'Video' : 'Document'}: ${parentId}`);

    return {
      success: true,
      message: "Version upload completed successfully",
      version: {
        id: versionId,

        ...(isVideo ? {
          videoId: version.videoId,
          videoTitle: version.video.title,
        } : {
          documentId: version.documentId,
          documentTitle: version.document.title,
        }),
        versionNumber: version.version,
        size: Number(fileSize),
        sizeFormatted: formatBytes(fileSize),
        status: (isVideo && needsCompression) ? "processing" : "ready",
        r2Key: key,
        r2ETag: r2Response.ETag,
        assetType: isVideo ? 'video' : 'document',
      },
      processing: processingInfo,
    };
  }, {
    maxWait: 5000, // 5 seconds
    timeout: 15000, // 15 seconds
  });
}

// ==========================================
// HELPERS
// ==========================================
async function processNewVideoUpload({
  uploadSession,
  key,
  fileSize,
  needsCompression,
  duration,
  user,
  r2Response,
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create video record
    const video = await tx.video.create({
      data: {
        title: uploadSession.fileName.replace(/\.[^/.]+$/, ""),
        filename: uploadSession.fileName,
        originalSize: fileSize,
        status: needsCompression ? "processing" : "ready",
        r2Key: key,
        duration: duration ? Math.round(duration) : null,
        r2Bucket: process.env.R2_BUCKET_NAME,
        campaignId: uploadSession.campaignId,
        uploadedBy: user.id,
        currentVersion: 1,
        metadata: {
          r2ETag: r2Response.ETag,
          uploadedAt: new Date().toISOString(),
        },
        tags: [],
        companyId:uploadSession.campaign.companyId
      },
    });

    console.log(`[VIDEO CREATED] ID: ${video.id} | Title: ${video.title}`);

    // 2. Create initial version
    await tx.videoVersion.create({
      data: {
        videoId: video.id,
        version: 1,
        r2Key: key,
        fileSize: fileSize,
        status: needsCompression ? "processing" : "ready",
        isActive: true,
        versionNote: "Initial upload",
        uploadedBy: user.id,
      },
    });

    let processingInfo = {};

    if (needsCompression) {
      // 3a. Queue for compression
      const compressionJob = await tx.compressionJob.create({
        data: {
          videoId: video.id,
          quality: "high",
          codec: "h264",
          targetBitrate: 8000,
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
            r2ETag: r2Response.ETag,
          },
        },
      });

      processingInfo = {
        requiresCompression: true,
        compressionJobId: compressionJob.id,
        estimatedTime: estimateCompressionTime(fileSize),
      };

      console.log(`[COMPRESSION QUEUED] Video: ${video.id} | Job: ${compressionJob.id}`);
    } else {
      // 3b. Queue for Stream
      await tx.streamQueue.create({
        data: {
          videoId: video.id,
          r2Key: key,
          status: 'PENDING',
          priority: 'NORMAL',
        }
      });

      processingInfo = {
        requiresCompression: false,
        queuedForStream: true,
      };

      console.log(`[STREAM QUEUED] Video: ${video.id}`);
    }

    // 4. Update upload session with videoId
    await tx.uploadSession.update({
      where: { id: uploadSession.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        videoId: video.id,
        metadata: JSON.stringify({
          r2ETag: r2Response.ETag,
          completedAt: new Date().toISOString(),
        })
      },
    });

    console.log(`✅ [UPLOAD COMPLETE] Video: ${video.id} | User: ${user.email}`);

    return {
      success: true,
      message: "Upload completed successfully",
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        size: Number(video.originalSize),
        sizeFormatted: formatBytes(video.originalSize),
        status: video.status,
        r2Key: video.r2Key,
        r2ETag: r2Response.ETag,
        campaign: {
          id: uploadSession.campaign.id,
          name: uploadSession.campaign.name,
        },
      },
      processing: processingInfo,
    };
  }, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  });
}
async function processNewDocumentUpload({
  uploadSession,
  key,
  fileSize,
  user,
  r2Response,
  assetType,
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create document record
      const getDocumentType = (assetType, fileName) => {
        // Get file extension
      const ext = uploadSession.fileName.split('.').pop()?.toLowerCase();
        
        // Images
        if (assetType === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
          return 'IMAGE';
        }
        
        // PDF
        if (ext === 'pdf') {
          return 'PDF';
        }
        
        // Documents (Word docs)
        if (['doc', 'docx', 'odt'].includes(ext)) {
          return 'DOCUMENT';
        }
        
        // Spreadsheets
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
          return 'SPREADSHEET';
        }
        
        // Text files
        if (['txt', 'md'].includes(ext)) {
          return 'TEXT';
        }
        
        // Presentations
        if (['ppt', 'pptx'].includes(ext)) {
          return 'PRESENTATION';
        }
        
        // Everything else
        return 'OTHER';
      };

    const document = await tx.document.create({
      data: {
        title: uploadSession.fileName.replace(/\.[^/.]+$/, ""),
        filename: uploadSession.fileName,
        fileSize: fileSize,
        mimeType: uploadSession.fileType,
        status: "ready", // Documents are ready immediately
        r2Key: key,
        r2Bucket: process.env.R2_BUCKET_NAME,
        campaignId: uploadSession.campaignId,
        documentType: getDocumentType(assetType),
        uploadedBy: user.id,
        currentVersion: 1,
        metadata: {
          r2ETag: r2Response.ETag,
          uploadedAt: new Date().toISOString(),
          assetType: assetType,
        },
        tags: [],
        companyId:uploadSession.campaign.companyId
      },
    });

    console.log(`[DOCUMENT CREATED] ID: ${document.id} | Title: ${document.title} | Type: ${assetType}`);

    // 2. Create initial version
    await tx.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        r2Key: key,
        fileSize: fileSize,
        status: "ready",
        isActive: true,
        versionNote: "Initial upload",
        uploadedBy: user.id,
      },
    });

    // 3. Update upload session with documentId
    await tx.uploadSession.update({
      where: { id: uploadSession.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        documentId: document.id,
        metadata: JSON.stringify({
          r2ETag: r2Response.ETag,
          completedAt: new Date().toISOString(),
          assetType: assetType,
        })
      },
    });

    console.log(`✅ [UPLOAD COMPLETE] Document: ${document.id} | Type: ${assetType} | User: ${user.email}`);

    return {
      success: true,
      message: `${assetType === 'image' ? 'Image' : 'Document'} upload completed successfully`,
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        size: Number(document.fileSize),
        sizeFormatted: formatBytes(document.fileSize),
        status: document.status,
        r2Key: document.r2Key,
        r2ETag: r2Response.ETag,
        documentType: getDocumentType(assetType),
        assetType: assetType,
        campaign: {
          id: uploadSession.campaign.id,
          name: uploadSession.campaign.name,
        },
      },
      processing: {
        requiresCompression: false,
        ready: true,
      },
    };
  }, {
    maxWait: 5000,
    timeout: 10000,
  });
}


// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function estimateCompressionTime(fileSize) {
  const numSize = typeof fileSize === 'bigint' ? Number(fileSize) : fileSize;
  const sizeInGB = numSize / (1024 * 1024 * 1024);
  const minutes = Math.ceil(sizeInGB * 4);
  
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
