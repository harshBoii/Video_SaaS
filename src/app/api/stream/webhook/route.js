// app/api/stream/webhook/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { streamWebhookSchema, formatZodError } from "@/app/lib/validation";
import crypto from "crypto";

export async function POST(request) {
  try {
    // ✅ 1. VERIFY WEBHOOK SIGNATURE (Security)
    const signature = request.headers.get("webhook-signature");
    const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("[STREAM WEBHOOK] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }

      // Re-parse body after signature verification
      var parsedBody = JSON.parse(body);
    } else {
      // No signature verification (less secure, but works)
      parsedBody = await request.json();
    }

    // ✅ 2. VALIDATE WEBHOOK PAYLOAD
    const validation = streamWebhookSchema.safeParse(parsedBody);

    if (!validation.success) {
      console.error("[STREAM WEBHOOK] Invalid payload:", formatZodError(validation.error));
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook payload",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const webhookData = validation.data;
    const { uid: streamId, status, meta, playback, thumbnail, duration, input } = webhookData;

    console.log(`[STREAM WEBHOOK] Received: ${streamId} - Status: ${status.state}`);

    // ✅ 3. FIND VIDEO BY STREAM ID
    let video = await prisma.video.findUnique({
      where: { streamId },
    });

    // If not found, try to find by metadata videoId
    if (!video && meta?.videoId) {
      video = await prisma.video.findUnique({
        where: { id: meta.videoId },
      });
    }

    if (!video) {
      console.error(`[STREAM WEBHOOK] Video not found for streamId: ${streamId}`);
      // Return 200 to prevent webhook retries for unknown videos
      return NextResponse.json({
        success: true,
        message: "Video not found, ignoring webhook",
      });
    }

    // ✅ 4. HANDLE DIFFERENT STREAM STATES
    switch (status.state) {
      case "queued":
        await handleQueued(video, streamId, webhookData);
        break;

      case "inprogress":
        await handleInProgress(video, streamId, webhookData);
        break;

      case "ready":
        await handleReady(video, streamId, webhookData);
        break;

      case "error":
        await handleError(video, streamId, webhookData);
        break;

      default:
        console.log(`[STREAM WEBHOOK] Unknown state: ${status.state}`);
    }

    // ✅ 5. UPDATE STREAM QUEUE IF EXISTS
    const queueEntry = await prisma.streamQueue.findUnique({
      where: { videoId: video.id },
    });

    if (queueEntry && status.state === "ready") {
      await prisma.streamQueue.update({
        where: { id: queueEntry.id },
        data: {
          status: "COMPLETED",
          streamId,
          completedAt: new Date(),
        },
      });
    } else if (queueEntry && status.state === "error") {
      await prisma.streamQueue.update({
        where: { id: queueEntry.id },
        data: {
          status: "FAILED",
          lastError: status.errorReasonText || "Stream processing failed",
        },
      });
    }

    // ✅ 6. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      videoId: video.id,
      streamId,
      state: status.state,
    });
  } catch (error) {
    console.error("[STREAM WEBHOOK ERROR]", error);

    // Return 200 to prevent webhook retries for system errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal error processing webhook",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 200 } // Return 200 to prevent retries
    );
  }
}

// ✅ HANDLER: Queued state
async function handleQueued(video, streamId, webhookData) {
  console.log(`[STREAM WEBHOOK] Video ${video.id} queued in Stream`);

  await prisma.video.update({
    where: { id: video.id },
    data: {
      streamId,
      status: "processing",
    },
  });
}

// ✅ HANDLER: In progress state
async function handleInProgress(video, streamId, webhookData) {
  console.log(`[STREAM WEBHOOK] Video ${video.id} processing in Stream`);

  await prisma.video.update({
    where: { id: video.id },
    data: {
      streamId,
      status: "processing",
    },
  });
}

// ✅ HANDLER: Ready state
async function handleReady(video, streamId, webhookData) {
  console.log(`[STREAM WEBHOOK] Video ${video.id} ready in Stream`);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const playbackUrl = webhookData.playback?.hls || 
    `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
  
  const thumbnailUrl = webhookData.thumbnail || 
    `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg`;

  await prisma.video.update({
    where: { id: video.id },
    data: {
      streamId,
      playbackUrl,
      thumbnailUrl,
      duration: webhookData.duration ? Math.floor(webhookData.duration) : video.duration,
      resolution: webhookData.input?.width && webhookData.input?.height 
        ? `${webhookData.input.width}x${webhookData.input.height}`
        : video.resolution,
      status: "ready",
    },
  });

  console.log(`[STREAM WEBHOOK] Video ${video.id} updated with playback URLs`);
}

// ✅ HANDLER: Error state
async function handleError(video, streamId, webhookData) {
  const errorMessage = webhookData.status.errorReasonText || "Unknown Stream error";
  const errorCode = webhookData.status.errorReasonCode || "UNKNOWN";

  console.error(`[STREAM WEBHOOK] Video ${video.id} failed: ${errorMessage} (${errorCode})`);

  await prisma.video.update({
    where: { id: video.id },
    data: {
      streamId,
      status: "error",
      metadata: {
        ...(video.metadata || {}),
        streamError: {
          message: errorMessage,
          code: errorCode,
          timestamp: new Date().toISOString(),
        },
      },
    },
  });
}
