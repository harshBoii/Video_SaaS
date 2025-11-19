// app/api/stream/[streamId]/details/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { streamIdParamSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. VALIDATE STREAM ID
    const validation = streamIdParamSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid stream ID",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const { streamId } = validation.data;

    // ✅ 3. FIND VIDEO BY STREAM ID
    const video = await prisma.video.findUnique({
      where: { streamId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
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
      },
    });

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
          message: "No video found with this stream ID",
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

    // ✅ 5. FETCH STREAM METADATA FROM CLOUDFLARE
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    const streamResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!streamResponse.ok) {
      console.error("[STREAM DETAILS] Cloudflare API error:", await streamResponse.text());
      
      // Return video info even if Stream API fails
      return NextResponse.json({
        success: true,
        video: {
          id: video.id,
          title: video.title,
          streamId: video.streamId,
          playbackUrl: video.playbackUrl,
          thumbnailUrl: video.thumbnailUrl,
          status: video.status,
          campaign: video.campaign,
        },
        stream: null,
        warning: "Could not fetch live Stream metadata",
      });
    }

    const streamData = await streamResponse.json();

    // ✅ 6. RETURN COMBINED DATA
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        status: video.status,
        duration: video.duration,
        resolution: video.resolution,
        originalSize: video.originalSize,
        originalSizeFormatted: formatBytes(video.originalSize),
        streamId: video.streamId,
        playbackUrl: video.playbackUrl,
        thumbnailUrl: video.thumbnailUrl,
        campaign: video.campaign,
        uploader: video.uploader,
        createdAt: video.createdAt,
      },
      stream: streamData.result ? {
        uid: streamData.result.uid,
        status: streamData.result.status,
        duration: streamData.result.duration,
        size: streamData.result.size,
        preview: streamData.result.preview,
        thumbnail: streamData.result.thumbnail,
        playback: streamData.result.playback,
        input: streamData.result.input,
        created: streamData.result.created,
        modified: streamData.result.modified,
        readyToStream: streamData.result.readyToStream,
        meta: streamData.result.meta,
      } : null,
    });
  } catch (error) {
    console.error("[STREAM DETAILS ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get stream details",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
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
