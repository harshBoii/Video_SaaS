// app/api/videos/[videoId]/delete/route.js
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authenticateRequest, canAccessCampaign, hasPermission } from "@/app/lib/auth";
import { videoIdParamSchema, formatZodError } from "@/app/lib/validation";

export async function DELETE(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. VALIDATE VIDEO ID
    const awaitedParams = await(params)

    const validation = videoIdParamSchema.safeParse(awaitedParams);
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

    // ✅ 3. PARSE DELETE OPTIONS
    const { searchParams } = new URL(request.url);
    const deleteFromR2 = searchParams.get("deleteFromR2") !== "false"; // Default true
    const deleteFromStream = searchParams.get("deleteFromStream") !== "false"; // Default true

    // ✅ 4. FETCH VIDEO WITH ALL DATA
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
        versions: {
          select: {
            id: true,
            r2Key: true,
            streamId: true,
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

    const canDelete =
      user.isAdmin ||
      hasPermission(user, "delete_videos") ||
      (hasAccess && video.uploadedBy === user.id);

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have permission to delete this video",
        },
        { status: 403 }
      );
    }

    const deletedResources = {
      video: videoId,
      r2Files: 0,
      streamVideos: 0,
      versions: video.versions.length,
    };

    // ✅ 6. DELETE FROM R2
    if (deleteFromR2) {
      // Delete main video
      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: video.r2Key,
          })
        );
        deletedResources.r2Files++;
        console.log(`[VIDEO DELETE] Deleted from R2: ${video.r2Key}`);
      } catch (r2Error) {
        console.error(`[VIDEO DELETE] R2 error for ${video.r2Key}:`, r2Error);
      }

      // Delete all version files from R2
      for (const version of video.versions) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: version.r2Key,
            })
          );
          deletedResources.r2Files++;
        } catch (r2Error) {
          console.error(`[VIDEO DELETE] R2 error for version ${version.r2Key}:`, r2Error);
        }
      }
    }

    // ✅ 7. DELETE FROM CLOUDFLARE STREAM
    if (deleteFromStream) {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      // Delete main stream
      if (video.streamId) {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${apiToken}` },
            }
          );

          if (response.ok) {
            deletedResources.streamVideos++;
            console.log(`[VIDEO DELETE] Deleted from Stream: ${video.streamId}`);
          }
        } catch (streamError) {
          console.error(`[VIDEO DELETE] Stream error for ${video.streamId}:`, streamError);
        }
      }

      // Delete version streams
      for (const version of video.versions) {
        if (version.streamId) {
          try {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${version.streamId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${apiToken}` },
              }
            );

            if (response.ok) {
              deletedResources.streamVideos++;
            }
          } catch (streamError) {
            console.error(`[VIDEO DELETE] Stream error for version:`, streamError);
          }
        }
      }
    }

    // ✅ 8. DELETE FROM DATABASE (CASCADE WILL HANDLE VERSIONS)
    await prisma.video.delete({
      where: { id: videoId },
    });

    // ✅ 9. LOG DELETION
    console.log(
      `[VIDEO DELETE] Video: ${videoId} | User: ${user.email} | R2: ${deletedResources.r2Files} files | Stream: ${deletedResources.streamVideos} videos`
    );

    // ✅ 10. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
      video: {
        id: videoId,
        title: video.title,
        campaign: video.campaign.name,
      },
      deletedResources,
      deletedBy: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[VIDEO DELETE ERROR]", error);

    // ✅ HANDLE DATABASE ERRORS
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
          message: "Video may have already been deleted",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete video",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
