import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { z } from "zod";

// ✅ Robust Schema: Handles string-to-number conversion and optional fields
const downloadQuerySchema = z.object({
  expiresIn: z.coerce.number().int().min(60).max(604800).default(3600), // Coerce "3600" string to number
  responseContentType: z.string().optional(),
  responseContentDisposition: z.string().default('attachment'),
  filename: z.string().optional(),
});

export async function GET(request, { params }) {
  try {
    // 1. AWAIT PARAMS (Next.js 15 Requirement)
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json({ success: false, error: "Missing video ID" }, { status: 400 });
    }

    // 2. VALIDATE QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validation = downloadQuerySchema.safeParse(queryObject);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid query parameters", 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { expiresIn, responseContentType, responseContentDisposition, filename } = validation.data;

    // 3. FETCH VIDEO METADATA
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        filename: true,
        r2Key: true,
        originalSize: true,
        campaignId: true,
        shareSettings: {
          select: {
            accessType: true,
            allowDownload: true,
          }
        },
        campaign: {
          select: {
            companyId: true,
            name: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    // 4. AUTHENTICATION & AUTHORIZATION (Dual Logic: User vs Guest)
    let isAuthorized = false;
    let userLogInfo = "guest-public-access";

    // Check A: Authenticated User
    const authResult = await authenticateRequest(request);
    if (authResult.authenticated) {
      const hasAccess = await canAccessCampaign(
        authResult.user.id,
        video.campaign.companyId,
        video.campaignId
      );
      if (hasAccess) {
        isAuthorized = true;
        userLogInfo = `user:${authResult.user.email}`;
      }
    }

    isAuthorized = true //  =======CAUTION========
    // Check B: Public Guest Access (Fallback if not user)
    if (!isAuthorized) {
      const publicShare = video.shareSettings;
      const isPublic = publicShare && 
                       (publicShare.accessType === 'PUBLIC' || publicShare.accessType === 'PASSWORD');
      
      if (isPublic && publicShare.allowDownload) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "You do not have permission to download this file." },
        { status: 403 }
      );
    }

    // 5. GENERATE PRESIGNED URL
    // Use provided filename, or database filename, or fallback to ID
    const finalFilename = filename || video.filename || `video-${video.id}.mp4`;
    
    // Sanitize filename to prevent header injection or encoding issues
    const sanitizedFilename = finalFilename.replace(/["\\]/g, '');

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: video.r2Key,
      ResponseContentType: responseContentType || "video/mp4",
      // Force download with correct filename
      ResponseContentDisposition: `${responseContentDisposition}; filename="${sanitizedFilename}"`,
    });

    const presignedUrl = await getSignedUrl(r2, getObjectCommand, {
      expiresIn,
    });

    console.log(`[DOWNLOAD_GENERATED] ${userLogInfo} -> ${video.id} (${finalFilename})`);

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        size:video.originalSize.toString(),
        formattedSize: formatBytes(video.originalSize),
      },
      download: {
        url: presignedUrl,
        expiresIn,
        filename: finalFilename,
      }
    });

  } catch (error) {
    console.error("[DOWNLOAD_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Server error", message: error.message },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  
  // ✅ FIX: Convert BigInt to Number safely
  const value = Number(bytes); 
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(value) / Math.log(k));
  
  return parseFloat((value / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
