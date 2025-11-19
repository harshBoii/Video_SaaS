// app/api/videos/[videoId]/raw/route.js
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { videoIdParamSchema, rawDownloadSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. VALIDATE VIDEO ID
    const paramValidation = videoIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid video ID",
          details: formatZodError(paramValidation.error),
        },
        { status: 400 }
      );
    }

    const { videoId } = paramValidation.data;

    // ✅ 3. PARSE DOWNLOAD OPTIONS
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    const optionsValidation = rawDownloadSchema.safeParse(queryObject);

    if (!optionsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid download options",
          details: formatZodError(optionsValidation.error),
        },
        { status: 400 }
      );
    }

    const {
      expiresIn,
      responseContentType,
      responseContentDisposition,
      filename,
    } = optionsValidation.data;

    // ✅ 4. FETCH VIDEO
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        filename: true,
        r2Key: true,
        r2Bucket: true,
        originalSize: true,
        status: true,
        campaignId: true,
        campaign: {
          select: {
            companyId: true,
            name: true,
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

    // ✅ 5. AUTHORIZATION
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
          message: "You don't have access to download this video",
        },
        { status: 403 }
      );
    }

    // ✅ 6. GENERATE PRESIGNED DOWNLOAD URL
    const downloadFilename = filename || video.filename;
    
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: video.r2Key,
      ResponseContentType: responseContentType,
      ResponseContentDisposition: `${responseContentDisposition}; filename="${downloadFilename}"`,
    });

    const presignedUrl = await getSignedUrl(r2, getObjectCommand, {
      expiresIn, // seconds
    });

    // ✅ 7. LOG DOWNLOAD REQUEST
    console.log(
      `[VIDEO DOWNLOAD] Video: ${video.id} | User: ${user.email} | Filename: ${downloadFilename}`
    );

    // ✅ 8. RETURN PRESIGNED URL
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        filename: video.filename,
        size: video.originalSize,
        sizeFormatted: formatBytes(video.originalSize),
        campaign: {
          id: video.campaignId,
          name: video.campaign.name,
        },
      },
      download: {
        url: presignedUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        filename: downloadFilename,
        contentDisposition: responseContentDisposition,
      },
      instructions: {
        method: "GET",
        note: "Use this URL to download the raw video file",
        expiryWarning: `URL expires in ${formatDuration(expiresIn)}`,
      },
    });
  } catch (error) {
    console.error("[VIDEO RAW DOWNLOAD ERROR]", error);

    // ✅ HANDLE R2 ERRORS
    if (error.name === "NoSuchKey") {
      return NextResponse.json(
        {
          success: false,
          error: "Video file not found in storage",
          message: "The video file may have been deleted or moved",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate download URL",
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

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hours`;
}
