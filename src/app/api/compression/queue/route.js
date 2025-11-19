// app/api/compression/queue/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { queueCompressionSchema, formatZodError } from "@/app/lib/validation";

export async function POST(request) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. PARSE AND VALIDATE INPUT
    const body = await request.json();
    const validation = queueCompressionSchema.safeParse(body);

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

    const { videoId, quality, targetBitrate, targetResolution, codec, priority } = validation.data;

    // ✅ 3. VERIFY VIDEO EXISTS
    const video = await prisma.video.findUnique({
      where: { id: videoId },
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

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        },
        { status: 404 }
      );
    }

    // ✅ 4. AUTHORIZATION - Check if user has access to this video
    const hasAccess = await canAccessCampaign(
      user.id,
      video.campaign.companyId,
      video.campaignId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have access to this video's campaign",
        },
        { status: 403 }
      );
    }

    // ✅ 5. CHECK VIDEO STATUS
    if (video.status !== "ready") {
      return NextResponse.json(
        {
          success: false,
          error: "Video not ready",
          message: `Video status is "${video.status}". Only videos with status "ready" can be compressed.`,
          currentStatus: video.status,
        },
        { status: 400 }
      );
    }

    // ✅ 6. CHECK IF ALREADY QUEUED OR PROCESSING
    const existingJob = await prisma.compressionJob.findFirst({
      where: {
        videoId,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
    });

    if (existingJob) {
      return NextResponse.json(
        {
          success: false,
          error: "Compression already queued",
          message: "This video already has a compression job in progress",
          existingJob: {
            id: existingJob.id,
            status: existingJob.status,
            quality: existingJob.quality,
            createdAt: existingJob.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // ✅ 7. CALCULATE ESTIMATED OUTPUT SIZE
    const bitrateMap = {
      low: 1000,      // 1 Mbps
      medium: 3000,   // 3 Mbps
      high: 6000,     // 6 Mbps
      source: null,   // Keep original
    };

    const estimatedBitrate = targetBitrate || bitrateMap[quality];
    const estimatedSize = estimatedBitrate 
      ? Math.floor((video.duration || 0) * estimatedBitrate * 1000 / 8) // bytes
      : video.originalSize;

    // ✅ 8. CREATE COMPRESSION JOB
    const compressionJob = await prisma.compressionJob.create({
      data: {
        videoId,
        quality,
        targetBitrate: estimatedBitrate,
        targetResolution,
        codec,
        priority,
        status: "PENDING",
        requestedBy: user.id,
        estimatedOutputSize: estimatedSize,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    // ✅ 9. UPDATE VIDEO STATUS
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "processing",
      },
    });

    // ✅ 10. LOG JOB CREATION
    console.log(
      `[COMPRESSION QUEUE] Job: ${compressionJob.id} | Video: ${video.title} | Quality: ${quality} | User: ${user.email}`
    );

    // ✅ 11. RETURN SUCCESS RESPONSE
    return NextResponse.json(
      {
        success: true,
        message: "Compression job queued successfully",
        job: {
          id: compressionJob.id,
          videoId: video.id,
          videoTitle: video.title,
          quality,
          codec,
          priority,
          status: "PENDING",
          estimatedOutputSize: estimatedSize,
          estimatedOutputSizeFormatted: formatBytes(estimatedSize),
          originalSize: video.originalSize,
          originalSizeFormatted: formatBytes(video.originalSize),
          estimatedSavings: video.originalSize - estimatedSize,
          estimatedSavingsFormatted: formatBytes(video.originalSize - estimatedSize),
          estimatedSavingsPercent: Math.round(((video.originalSize - estimatedSize) / video.originalSize) * 100),
          createdAt: compressionJob.createdAt,
        },
        info: {
          message: "Your video will be processed soon",
          estimatedTime: getEstimatedTime(video.originalSize, quality),
          note: "You'll be notified when compression is complete",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[COMPRESSION QUEUE ERROR]", error);

    // ✅ HANDLE DATABASE ERRORS
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate job",
          message: "A compression job for this video already exists",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reference",
          message: "Video or user not found",
        },
        { status: 400 }
      );
    }

    // ✅ GENERIC ERROR HANDLER
    return NextResponse.json(
      {
        success: false,
        error: "Failed to queue compression",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// ✅ HELPER: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ✅ HELPER: Estimate processing time
function getEstimatedTime(fileSize, quality) {
  // Rough estimates: 1GB = 5-15 minutes depending on quality
  const sizeInGB = fileSize / (1024 * 1024 * 1024);
  
  const timeMultiplier = {
    low: 3,      // 3 min per GB
    medium: 5,   // 5 min per GB
    high: 10,    // 10 min per GB
    source: 2,   // 2 min per GB (just re-encoding)
  };

  const minutes = Math.ceil(sizeInGB * timeMultiplier[quality]);
  
  if (minutes < 1) return "Less than 1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
