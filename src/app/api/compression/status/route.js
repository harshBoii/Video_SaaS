// app/api/compression/status/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { compressionStatusSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. PARSE AND VALIDATE QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    const validation = compressionStatusSchema.safeParse(queryObject);

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

    const { jobId } = validation.data;

    // ✅ 3. FETCH COMPRESSION JOB
    const job = await prisma.compressionJob.findUnique({
      where: { id: jobId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            filename: true,
            originalSize: true,
            campaignId: true,
            campaign: {
              select: {
                id: true,
                name: true,
                companyId: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Compression job not found",
        },
        { status: 404 }
      );
    }

    // ✅ 4. AUTHORIZATION - Check if user has access
    const hasAccess = await canAccessCampaign(
      user.id,
      job.video.campaign.companyId,
      job.video.campaignId
    );

    if (!hasAccess && job.requestedBy !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have access to this compression job",
        },
        { status: 403 }
      );
    }

    // ✅ 5. CALCULATE PROGRESS AND TIME
    const progress = calculateProgress(job);
    const elapsedTime = job.startedAt 
      ? Math.floor((new Date() - new Date(job.startedAt)) / 1000)
      : 0;

    const estimatedTotal = job.estimatedDuration || 300; // Default 5 minutes
    const remainingTime = Math.max(0, estimatedTotal - elapsedTime);

    // ✅ 6. BUILD RESPONSE
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: progress,
        video: {
          id: job.video.id,
          title: job.video.title,
          filename: job.video.filename,
          originalSize: job.video.originalSize,
          originalSizeFormatted: formatBytes(job.video.originalSize),
          campaign: {
            id: job.video.campaign.id,
            name: job.video.campaign.name,
          },
        },
        settings: {
          quality: job.quality,
          codec: job.codec,
          targetBitrate: job.targetBitrate,
          targetResolution: job.targetResolution,
          priority: job.priority,
        },
        output: job.status === "COMPLETED" ? {
          r2Key: job.outputR2Key,
          fileSize: job.outputSize,
          fileSizeFormatted: formatBytes(job.outputSize),
          savings: job.video.originalSize - job.outputSize,
          savingsFormatted: formatBytes(job.video.originalSize - job.outputSize),
          savingsPercent: Math.round(((job.video.originalSize - job.outputSize) / job.video.originalSize) * 100),
        } : null,
        timing: {
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          elapsedSeconds: elapsedTime,
          elapsedFormatted: formatDuration(elapsedTime),
          estimatedRemainingSeconds: remainingTime,
          estimatedRemainingFormatted: formatDuration(remainingTime),
        },
        attempts: {
          current: job.attempts,
          max: job.maxAttempts,
        },
        error: job.status === "FAILED" ? {
          message: job.errorMessage,
          lastError: job.lastError,
        } : null,
        requestedBy: job.requester,
      },
    });
  } catch (error) {
    console.error("[COMPRESSION STATUS ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get compression status",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// ✅ HELPER: Calculate progress based on status
function calculateProgress(job) {
  if (job.status === "COMPLETED") return 100;
  if (job.status === "FAILED" || job.status === "ABORTED") return 0;
  if (job.status === "PENDING") return 0;
  
  // If processing, estimate based on elapsed time
  if (job.status === "PROCESSING" && job.startedAt) {
    const elapsed = Math.floor((new Date() - new Date(job.startedAt)) / 1000);
    const estimated = job.estimatedDuration || 300;
    return Math.min(95, Math.floor((elapsed / estimated) * 100)); // Cap at 95% until complete
  }
  
  return 0;
}

// ✅ HELPER: Format duration
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// ✅ HELPER: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
