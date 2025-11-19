// app/api/stream/[streamId]/delete/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign, hasPermission } from "@/app/lib/auth";
import { streamIdParamSchema, formatZodError } from "@/app/lib/validation";

export async function DELETE(request, { params }) {
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

    const canDelete = 
      user.isAdmin ||
      hasPermission(user, "delete_stream_videos") ||
      (hasAccess && video.uploadedBy === user.id);

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have permission to delete this Stream video",
        },
        { status: 403 }
      );
    }

    // ✅ 5. DELETE FROM CLOUDFLARE STREAM
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error("[STREAM DELETE] Cloudflare API error:", errorData);

      // If video doesn't exist on Stream (404), continue with DB cleanup
      if (deleteResponse.status !== 404) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to delete from Cloudflare Stream",
            message: errorData.errors?.[0]?.message || "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // ✅ 6. UPDATE VIDEO RECORD (remove stream references)
    await prisma.video.update({
      where: { id: video.id },
      data: {
        streamId: null,
        playbackUrl: null,
        thumbnailUrl: null,
        status: "ready", // Back to R2-only status
      },
    });

    // ✅ 7. UPDATE STREAM QUEUE IF EXISTS
    const queueEntry = await prisma.streamQueue.findUnique({
      where: { videoId: video.id },
    });

    if (queueEntry) {
      await prisma.streamQueue.delete({
        where: { id: queueEntry.id },
      });
    }

    // ✅ 8. LOG DELETION
    console.log(
      `[STREAM DELETE] StreamId: ${streamId} | Video: ${video.id} | User: ${user.email}`
    );

    // ✅ 9. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: "Stream video deleted successfully",
      video: {
        id: video.id,
        title: video.title,
        streamId: streamId,
        status: "ready",
        note: "Video still available in R2 storage",
        r2Key: video.r2Key,
      },
      deletedFrom: {
        cloudflareStream: true,
        database: false, // Video record still exists
        r2Storage: false, // Original file still in R2
      },
    });
  } catch (error) {
    console.error("[STREAM DELETE ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete Stream video",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
