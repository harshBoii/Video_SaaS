// app/api/projects/[id]/versions/route.js
// OR
// app/api/campaigns/[id]/versions/route.js

//cacheable , invalidate on handle version upload

import prisma from "@/app/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

const campaignIdSchema = z.object({
  id: z.string().cuid("Invalid campaign/project ID format"),
});

const versionsQuerySchema = z.object({
  videoId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  includeArchived: z.coerce.boolean().default(false),
});

function formatZodError(error) {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

export async function GET(request, { params }) {
  try {
    const paramValidation = campaignIdSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid campaign/project ID",
          details: formatZodError(paramValidation.error),
        },
        { status: 400 }
      );
    }

    const { id: campaignId } = paramValidation.data;

    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const queryValidation = versionsQuerySchema.safeParse(queryObject);
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: formatZodError(queryValidation.error),
        },
        { status: 400 }
      );
    }

    const { videoId, page, limit, includeArchived } = queryValidation.data;

    // ✅ Verify campaign exists (using Campaign, not Project)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign/Project not found",
        },
        { status: 404 }
      );
    }

    // ✅ Build where clause using campaignId
    const where = {
      campaignId, 
    };

    if (videoId) {
      where.id = videoId;
    }

    if (!includeArchived) {
      where.status = {
        not: "archived",
      };
    }

    const skip = (page - 1) * limit;

    // ✅ Fetch videos with campaign relation
    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: "desc" },
          { title: "asc" },
        ],
        include: {
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
              versionNote: true,
              isActive: true,
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
          _count: {
            select: {
              versions: true,
            },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    const stats = {
      totalVideos: totalCount,
      totalVersions: videos.reduce((sum, v) => sum + v._count.versions, 0),
      statusBreakdown: videos.reduce((acc, video) => {
        acc[video.status] = (acc[video.status] || 0) + 1;
        return acc;
      }, {}),
    };

    const transformedVideos = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      status: video.status,
      currentVersion: video.currentVersion,
      totalVersions: video._count.versions,
      duration: video.duration,
      resolution: video.resolution,
      streamId: video.streamId,
      playbackUrl: video.playbackUrl,
      thumbnailUrl: video.thumbnailUrl,
      tags: video.tags,
      uploader: video.uploader,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      versions: video.versions.map((v) => ({
        id: v.id,
        version: v.version,
        fileSize: v.fileSize,
        fileSizeFormatted: formatBytes(v.fileSize),
        status: v.status,
        isActive: v.isActive,
        versionNote: v.versionNote,
        streamId: v.streamId,
        playbackUrl: v.playbackUrl,
        uploadedBy: v.uploader,
        createdAt: v.createdAt,
      })),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      campaign: { // <-- Changed from "project" to "campaign"
        id: campaign.id,
        name: campaign.name,
      },
      data: transformedVideos,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get campaign versions error:", error);

    if (error.code === "P2023") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign versions",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
