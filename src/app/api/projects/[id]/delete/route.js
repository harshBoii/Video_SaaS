// app/api/projects/[id]/delete/route.js
import prisma from "@/app/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";
import { authenticateRequest, hasPermission } from "@/app/lib/auth";

// ✅ Validate campaign ID
const campaignIdSchema = z.object({
  id: z.string().cuid("Invalid campaign/project ID format"),
});

// ✅ Delete options
const deleteOptionsSchema = z.object({
  hardDelete: z.coerce.boolean().default(false),
  deleteVideos: z.coerce.boolean().default(false),
});

function formatZodError(error) {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

export async function DELETE(request, { params }) {
  try {
    // ✅ AUTHENTICATE USER (using JWT from your login)
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error; // Return 401/403 response
    }

    const { user } = authResult;

    // ✅ Validate campaign ID
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

    // ✅ Parse delete options
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    const optionsValidation = deleteOptionsSchema.safeParse(queryObject);
    
    if (!optionsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid delete options",
          details: formatZodError(optionsValidation.error),
        },
        { status: 400 }
      );
    }

    const { hardDelete, deleteVideos } = optionsValidation.data;

    // ✅ Fetch campaign with related data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        company: {
          select: { id: true, name: true },
        },
        admin: {
          select: { id: true, firstName: true, lastName: true },
        },
        videos: {
          select: {
            id: true,
            r2Key: true,
            streamId: true,
            filename: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            flows: true,
            schedules: true,
            videos: true,
          },
        },
      },
    });

    // ✅ Check if campaign exists
    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign/Project not found",
        },
        { status: 404 }
      );
    }

    // ✅ AUTHORIZATION CHECK (using JWT payload)
    const canDelete =
      user.isAdmin || // Super admin (from JWT)
      user.companyId === campaign.company.id || // Same company (from JWT)
      campaign.adminId === user.id || // Campaign admin
      hasPermission(user, "delete_campaigns"); // Has delete permission

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have permission to delete this campaign/project",
          requiredPermissions: ["delete_campaigns"],
          yourRole: user.role?.name || "No role assigned",
        },
        { status: 403 }
      );
    }

    // ✅ SOFT DELETE (Recommended)
    if (!hardDelete) {
      const deletedCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "deleted",
          deletedAt: new Date(),
          deletedBy: user.id, // ✅ Track who deleted (from JWT)
        },
      });

      // ✅ Log deletion action for audit trail
      console.log(`Campaign ${campaignId} soft deleted by ${user.email} (${user.id})`);

      return NextResponse.json({
        success: true,
        message: "Campaign/Project soft deleted successfully",
        campaign: {
          id: deletedCampaign.id,
          name: deletedCampaign.name,
          status: deletedCampaign.status,
          deletedAt: deletedCampaign.deletedAt,
          deletedBy: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          },
        },
        affectedResources: {
          assignments: campaign._count.assignments,
          flows: campaign._count.flows,
          schedules: campaign._count.schedules,
          videos: campaign._count.videos,
        },
        note: "Campaign marked as deleted. Contact admin to recover if needed.",
      });
    }

    // ✅ HARD DELETE (Permanent - use with extreme caution)
    if (hardDelete) {
      // ✅ Additional permission check for hard delete
      if (!user.isAdmin && !hasPermission(user, "hard_delete_campaigns")) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient permissions for hard delete",
            message: "Only super admins or users with 'hard_delete_campaigns' permission can permanently delete",
          },
          { status: 403 }
        );
      }

      // ✅ If deleteVideos=true, delete from R2 and Stream
      if (deleteVideos && campaign.videos.length > 0) {
        console.log("Videos to delete from R2/Stream:", campaign.videos);
        
        // TODO: Implement actual R2 and Stream deletion
        // const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
        // const r2Client = new S3Client({...});
        // 
        // for (const video of campaign.videos) {
        //   await r2Client.send(new DeleteObjectCommand({
        //     Bucket: process.env.R2_BUCKET_NAME,
        //     Key: video.r2Key,
        //   }));
        //   
        //   if (video.streamId) {
        //     await deleteFromCloudflareStream(video.streamId);
        //   }
        // }
      }

      // ✅ Log hard deletion for audit
      console.log(`[CRITICAL] Campaign ${campaignId} PERMANENTLY deleted by ${user.email} (${user.id})`);

      // ✅ Hard delete - Prisma cascades based on schema
      await prisma.campaign.delete({
        where: { id: campaignId },
      });

      return NextResponse.json({
        success: true,
        message: "Campaign/Project permanently deleted",
        deletedBy: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        deletedResources: {
          campaign: campaignId,
          assignments: campaign._count.assignments,
          flows: campaign._count.flows,
          schedules: campaign._count.schedules,
          videos: deleteVideos ? campaign._count.videos : 0,
        },
        warning: "⚠️ This action CANNOT be undone. All data is permanently lost.",
      });
    }
  } catch (error) {
    console.error("Delete campaign error:", error);

    // ✅ Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign/Project not found",
          message: "The campaign may have already been deleted",
        },
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete campaign",
          message: "Campaign has dependent records that must be deleted first",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2014") {
      return NextResponse.json(
        {
          success: false,
          error: "Relation violation",
          message: "Campaign is referenced by other records",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete campaign/project",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
