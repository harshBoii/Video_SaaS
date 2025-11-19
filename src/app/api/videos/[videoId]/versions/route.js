// app/api/videos/[videoId]/versions/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { videoIdParamSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. VALIDATE VIDEO ID
    const validation = videoIdParamSchema.safeParse(params);
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

    // ✅ 3. FETCH VIDEO WITH VERSIONS
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        filename: true,
        currentVersion: true,
        campaignId: true,
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            r2Key: true,
            fileSize: true,
            status: true,
            versionNote: true,
            isActive: true,
            streamId: true,
            playbackUrl: true,
            createdAt: true,
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            version: "desc",
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

    // ✅ 5. FORMAT VERSION HISTORY
    const formattedVersions = video.versions.map((v) => ({
      id: v.id,
      version: v.version,
      fileSize: v.fileSize,
      fileSizeFormatted: formatBytes(v.fileSize),
      status: v.status,
      isActive: v.isActive,
      versionNote: v.versionNote,
      hasStream: !!v.streamId,
      streamId: v.streamId,
      playbackUrl: v.playbackUrl,
      uploadedBy: v.uploader,
      createdAt: v.createdAt,
    }));

    // ✅ 6. CALCULATE VERSION STATISTICS
    const stats = {
      totalVersions: video.versions.length,
      currentVersion: video.currentVersion,
      totalSize: video.versions.reduce((sum, v) => sum + Number(v.fileSize), 0),
      activeVersion: video.versions.find((v) => v.isActive),
      versionsByStatus: video.versions.reduce((acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        currentVersion: video.currentVersion,
        campaign: video.campaign,
      },
      versions: formattedVersions,
      stats: {
        ...stats,
        totalSizeFormatted: formatBytes(stats.totalSize),
      },
    });
  } catch (error) {
    console.error("[VIDEO VERSIONS ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get version history",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
