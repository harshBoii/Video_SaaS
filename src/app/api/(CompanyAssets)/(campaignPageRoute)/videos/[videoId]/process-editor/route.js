import { NextResponse } from "next/server";
import { verifyJWT } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from 'stream';

export const maxDuration = 300; // 5 minutes max

export async function POST(request, { params }) {
  let uploadSession = null;
  let tempVersionId = null;

  try {
    // ✅ 1. AUTHENTICATE
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { videoId: id } = await params;
    const body = await request.json();
    const {
      versionNote,
      originalVideoId,
      editMode,
      crop,
      resize,
      trim,
      sourceR2Key,
      sourceR2Bucket,
      originalDuration,
    } = body;

    console.log('[EDITOR PROCESS] Starting:', { videoId: id, editMode, versionNote });

    // ✅ 2. VALIDATE VIDEO ACCESS
    const video = await prisma.video.findFirst({
      where: {
        id,
        campaign: { companyId: user.companyId },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    const nextVersion = (video.versions[0]?.version || 0) + 1;

    // ✅ 3. CREATE VERSION RECORD (processing status)
    const newVersion = await prisma.videoVersion.create({
      data: {
        videoId: video.id,
        version: nextVersion,
        status: 'processing',
        isActive: false,
        versionNote: versionNote.trim(),
        uploadedBy: user.id,
        fileSize: video.originalSize, // Will update after processing
        r2Key: `temp-${Date.now()}`, // Temporary
      },
    });

    tempVersionId = newVersion.id;

    console.log(`[EDITOR PROCESS] Created v${nextVersion}:`, newVersion.id);

    // ✅ 4. GET PRESIGNED URL FOR SOURCE VIDEO
    const getCommand = new GetObjectCommand({
      Bucket: sourceR2Bucket,
      Key: sourceR2Key,
    });

    const sourceUrl = await getSignedUrl(r2, getCommand, { expiresIn: 3600 });

    // ✅ 5. PROCESS VIDEO WITH FFMPEG (Worker API call)
    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/process-video-worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl,
        editMode,
        crop,
        resize,
        trim,
        versionId: newVersion.id,
        userId: user.id,
      }),
    });

    const processResult = await processResponse.json();

    if (!processResponse.ok) {
      throw new Error(processResult.error || 'FFmpeg processing failed');
    }

    const { processedVideoBlob } = processResult;

    console.log('[EDITOR PROCESS] FFmpeg completed');

    // ✅ 6. UPLOAD PROCESSED VIDEO TO R2
    const newR2Key = `videos/${video.campaign.companyId}/${video.id}/v${nextVersion}_${Date.now()}.mp4`;

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(processedVideoBlob, 'base64');
    const fileSize = videoBuffer.length;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: newR2Key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
      Metadata: {
        videoId: video.id,
        versionId: newVersion.id,
        editMode,
        uploadedBy: user.id,
      },
    });

    await r2.send(putCommand);

    console.log('[EDITOR PROCESS] Uploaded to R2:', newR2Key);

    // ✅ 7. UPDATE VERSION WITH R2 KEY
    await prisma.videoVersion.update({
      where: { id: newVersion.id },
      data: {
        status: 'ready',
        r2Key: newR2Key,
        fileSize: BigInt(fileSize),
      },
    });

    // ✅ 8. QUEUE FOR CLOUDFLARE STREAM
    await prisma.streamQueue.upsert({
      where: { videoId: video.id },
      update: {
        r2Key: newR2Key,
        status: 'PENDING',
        priority: 'NORMAL',
        attempts: 0,
        lastError: null,
      },
      create: {
        videoId: video.id,
        r2Key: newR2Key,
        status: 'PENDING',
        priority: 'NORMAL',
      },
    });

    // ✅ 9. UPDATE VIDEO CURRENT VERSION
    await prisma.video.update({
      where: { id: video.id },
      data: {
        currentVersion: nextVersion,
        updatedAt: new Date(),
      },
    });

    console.log('[EDITOR PROCESS] ✅ Complete:', newVersion.id);

    return NextResponse.json({
      success: true,
      message: 'Video processed successfully',
      version: {
        id: newVersion.id,
        videoId: video.id,
        version: nextVersion,
        status: 'ready',
        versionNote,
        r2Key: newR2Key,
        fileSize,
      },
      video: {
        id: video.id,
        title: video.title,
        currentVersion: nextVersion,
      },
    });

  } catch (error) {
    console.error('[EDITOR PROCESS ERROR]', error);

    // Mark version as failed
    if (tempVersionId) {
      try {
        await prisma.videoVersion.update({
          where: { id: tempVersionId },
          data: {
            status: 'error',
          },
        });
      } catch (dbError) {
        console.error('Failed to update version status:', dbError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Video processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
