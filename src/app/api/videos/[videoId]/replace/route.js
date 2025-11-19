// app/api/videos/[videoId]/replace/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { videoIdParamSchema, replaceVideoSchema, formatZodError } from "@/app/lib/validation";

export async function POST(request, { params }) {
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

    // ✅ 3. PARSE REQUEST BODY
    const body = await request.json();
    const validation = replaceVideoSchema.safeParse(body);

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

    const { versionNote, autoPromote } = validation.data;

    // Note: This endpoint prepares for a new version upload
    // The actual file upload happens via /api/upload/start with videoId parameter

    // ✅ 4. FETCH EXISTING VIDEO
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        currentVersion: true,
        campaignId: true,
        campaign: {
          select: {
            companyId: true,
            name: true,
          },
        },
        versions: {
          select: {
            version: true,
          },
          orderBy: {
            version: "desc",
          },
          take: 1,
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
          message: "You don't have access to replace this video",
        },
        { status: 403 }
      );
    }

    // ✅ 6. CALCULATE NEXT VERSION NUMBER
    const nextVersion = (video.versions[0]?.version || 0) + 1;

    // ✅ 7. RETURN UPLOAD INSTRUCTIONS
    return NextResponse.json({
      success: true,
      message: "Ready to upload new version",
      video: {
        id: video.id,
        title: video.title,
        currentVersion: video.currentVersion,
        nextVersion,
      },
      instructions: {
        step1: "Upload the new file via POST /api/upload/start",
        step2: "Include videoId in the request body",
        step3: "The new version will be created automatically",
        example: {
          url: "/api/upload/start",
          method: "POST",
          body: {
            fileName: "video-v2.mp4",
            fileType: "video/mp4",
            fileSize: 500000000,
            campaignId: video.campaignId,
            videoId: video.id, // <-- Important: existing video ID
            versionNote: versionNote || `Version ${nextVersion}`,
            autoPromote: autoPromote,
          },
        },
      },
      settings: {
        versionNote: versionNote || `Version ${nextVersion}`,
        autoPromote,
        willBecomeActive: autoPromote,
      },
    });
  } catch (error) {
    console.error("[VIDEO REPLACE ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to prepare version replacement",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
