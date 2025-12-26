// app/api/videos/[videoId]/details/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { verifyJWT, canAccessCampaign } from "@/app/lib/auth"; // ✅ Use consistent auth
import { videoIdParamSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    // ✅ 2. AWAIT PARAMS (Next.js 15)
    const resolvedParams = await params;
    const validation = videoIdParamSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid video ID",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const { videoId } = validation.data;

    // ✅ 3. FETCH VIDEO WITH FULL DETAILS
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            fileSize: true,
            status: true,
            isActive: true,
            versionNote: true,
            r2Key: true,
            streamId: true,
            playbackUrl: true,
            createdAt: true,
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            version: "desc",
          },
        },
        compressionJobs: {
          select: {
            id: true,
            status: true,
            quality: true,
            codec: true,
            progress: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        streamQueue: {
          select: {
            id: true,
            status: true,
            attempts: true,
            lastError: true,
            createdAt: true,
            completedAt: true,
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

    // ✅ 4. AUTHORIZATION
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
          message: "You don't have access to this video",
        },
        { status: 403 }
      );
    }

    // ✅ 5. FORMAT VERSION HISTORY - CONVERT BIGINT
    const formattedVersions = video.versions.map((v) => ({
      id: v.id,
      version: v.version,
      fileSize: Number(v.fileSize), // ✅ Convert BigInt
      fileSizeFormatted: formatBytes(v.fileSize),
      status: v.status,
      isActive: v.isActive,
      versionNote: v.versionNote,
      streamId: v.streamId,
      playbackUrl: v.playbackUrl,
      uploadedBy: v.uploader,
      createdAt: v.createdAt,
    }));

    // ✅ 6. RETURN COMPREHENSIVE DETAILS - CONVERT BIGINT
    return NextResponse.json({
      success: true,
      video: {
        // Basic info
        id: video.id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        status: video.status,
        
        // Technical details
        duration: video.duration,
        durationFormatted: formatDuration(video.duration),
        resolution: video.resolution,
        fps: video.fps,
        codec: video.codec,
        
        // File info
        originalSize: Number(video.originalSize), // ✅ Convert BigInt
        originalSizeFormatted: formatBytes(video.originalSize),
        r2Key: video.r2Key,
        r2Bucket: video.r2Bucket,
        
        // Stream info
        streamId: video.streamId,
        playbackUrl: video.playbackUrl,
        thumbnailUrl: video.thumbnailUrl,
        
        // Metadata
        tags: video.tags,
        metadata: video.metadata,
        
        // Version info
        currentVersion: video.currentVersion,
        totalVersions: video.versions.length,
        
        // Relations
        campaign: video.campaign,
        uploader: video.uploader,
        
        // Timestamps
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
      versions: formattedVersions,
      compressionJobs: video.compressionJobs,
      streamQueue: video.streamQueue,
      stats: {
        totalVersions: video.versions.length,
        totalVersionSize: video.versions.reduce((sum, v) => sum + Number(v.fileSize), 0),
        totalVersionSizeFormatted: formatBytes(
          video.versions.reduce((sum, v) => sum + Number(v.fileSize), 0)
        ),
        activeCompressionJobs: video.compressionJobs.filter(
          (j) => j.status === "PENDING" || j.status === "PROCESSING"
        ).length,
        isStreamReady: video.streamQueue?.status === "COMPLETED" && video.streamId !== null,
      },
    });
  } catch (error) {
    console.error("[VIDEO DETAILS ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get video details",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "0:00";
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
