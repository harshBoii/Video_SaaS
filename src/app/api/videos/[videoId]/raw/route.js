import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const downloadQuerySchema = z.object({
  expiresIn: z.coerce.number().int().min(60).max(604800).default(3600),
  responseContentType: z.string().optional(),
  responseContentDisposition: z.string().default('attachment'),
  filename: z.string().optional(),
  version: z.coerce.number().int().positive().optional(),
});

export async function GET(request, { params }) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Missing video ID" }, 
        { status: 400 }
      );
    }

    // Validate query parameters
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

    const { 
      expiresIn, 
      responseContentType, 
      responseContentDisposition, 
      filename,
      version 
    } = validation.data;

    // Fetch video with versions
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        filename: true,
        r2Key: true,
        originalSize: true,
        campaignId: true,
        currentVersion: true,
        versions: {
          select: {
            id: true,
            version: true,
            r2Key: true,
            fileSize: true,
            status: true,
            versionNote: true,
          },
          where: {
            status: 'ready',
          },
          orderBy: {
            version: 'desc',
          },
        },
        shareSettings: {
          select: {
            accessType: true,
            allowDownload: true,
          }
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: "Video not found" }, 
        { status: 404 }
      );
    }

    // Check download permissions
    const publicShare = video.shareSettings;
    const isPubliclyDownloadable = publicShare && 
      (publicShare.accessType === 'PUBLIC' || publicShare.accessType === 'PASSWORD') &&
      publicShare.allowDownload === true;

    if (!isPubliclyDownloadable) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized", 
          message: "This video is not available for download." 
        },
        { status: 403 }
      );
    }

    // Determine which version to download
    let downloadKey, downloadSize, downloadVersion, downloadNote;

    if (version) {
      // User requested specific version
      const requestedVersion = video.versions.find(v => v.version === version);
      
      if (!requestedVersion) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Version not found", 
            message: `Version ${version} does not exist or is not ready.` 
          },
          { status: 404 }
        );
      }

      downloadKey = requestedVersion.r2Key;
      downloadSize = requestedVersion.fileSize; // BigInt from DB
      downloadVersion = requestedVersion.version;
      downloadNote = requestedVersion.versionNote;
    } else {
      // Always download latest version
      if (video.versions.length > 0) {
        const latestVersion = video.versions[0]; // Already ordered DESC
        
        downloadKey = latestVersion.r2Key;
        downloadSize = latestVersion.fileSize; // BigInt from DB
        downloadVersion = latestVersion.version;
        downloadNote = latestVersion.versionNote;
      } else {
        // No versions exist, use original
        downloadKey = video.r2Key;
        downloadSize = video.originalSize; // BigInt from DB
        downloadVersion = 1;
        downloadNote = "Original upload";
      }
    }

    // Generate filename
    const finalFilename = filename || 
      (downloadVersion > 1 
        ? `${video.filename.replace(/\.[^/.]+$/, '')}_v${downloadVersion}.mp4` 
        : video.filename) || 
      `video-${video.id}.mp4`;
    
    const sanitizedFilename = finalFilename.replace(/["\\]/g, '');

    // Generate presigned URL
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: downloadKey,
      ResponseContentType: responseContentType || "video/mp4",
      ResponseContentDisposition: `${responseContentDisposition}; filename="${sanitizedFilename}"`,
    });

    const presignedUrl = await getSignedUrl(r2, getObjectCommand, {
      expiresIn,
    });

    console.log(`[DOWNLOAD] Video: ${video.id} | Version: ${downloadVersion} | File: ${finalFilename}`);

    // ✅ Convert BigInt to string for JSON serialization
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        size: downloadSize.toString(), // ✅ BigInt to string
        formattedSize: formatBytes(downloadSize), // ✅ Handles BigInt
        version: downloadVersion,
        versionNote: downloadNote,
        totalVersions: video.versions.length + 1,
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
      { 
        success: false, 
        error: "Server error", 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// ✅ Fixed formatBytes to handle BigInt properly
function formatBytes(bytes) {
  if (!bytes || bytes === 0 || bytes === 0n) return "0 B";
  
  // ✅ Convert BigInt to Number safely
  const value = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(value) / Math.log(k));
  
  return parseFloat((value / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
