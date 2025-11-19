// lib/streamQueue.js
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Queue a video for Cloudflare Stream upload (uncompressed files ≤ 25GB)
 */
export async function queueStreamUpload(videoId, r2Key, priority = "NORMAL") {
  try {
    // Check if already queued
    const existing = await prisma.streamQueue.findUnique({
      where: { videoId },
    });

    if (existing) {
      console.log(`[STREAM QUEUE] Video ${videoId} already queued`);
      return existing;
    }

    // Create queue entry
    const queueEntry = await prisma.streamQueue.create({
      data: {
        videoId,
        r2Key,
        status: "PENDING",
        priority,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    console.log(`[STREAM QUEUE] Video ${videoId} queued successfully with priority ${priority}`);

    // Trigger immediate processing for HIGH priority
    if (priority === "HIGH") {
      setImmediate(() => processNextQueueItem());
    }

    return queueEntry;
  } catch (error) {
    console.error(`[STREAM QUEUE ERROR] Failed to queue video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Queue a COMPRESSED video for Cloudflare Stream upload (files > 25GB after compression)
 * This is called AFTER compression is complete
 */
export async function queueStreamAfterCompression(videoId, compressedR2Key, priority = "HIGH") {
  try {
    console.log(`[STREAM QUEUE] Queueing compressed video ${videoId} for Stream upload`);

    // Check if already queued
    const existing = await prisma.streamQueue.findUnique({
      where: { videoId },
    });

    if (existing) {
      console.log(`[STREAM QUEUE] Video ${videoId} already queued, updating with compressed key`);
      
      // Update with compressed file key
      const updated = await prisma.streamQueue.update({
        where: { videoId },
        data: {
          r2Key: compressedR2Key, // ✅ Use compressed file instead
          status: "PENDING",
          priority,
          attempts: 0, // Reset attempts
          lastError: null, // Clear previous errors
        },
      });

      // Trigger immediate processing
      setImmediate(() => processNextQueueItem());

      return updated;
    }

    // Create new queue entry with compressed file
    const queueEntry = await prisma.streamQueue.create({
      data: {
        videoId,
        r2Key: compressedR2Key, // ✅ Use compressed file
        status: "PENDING",
        priority,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    console.log(`[STREAM QUEUE] Compressed video ${videoId} queued successfully with priority ${priority}`);

    // Trigger immediate processing for HIGH priority
    setImmediate(() => processNextQueueItem());

    return queueEntry;
  } catch (error) {
    console.error(`[STREAM QUEUE ERROR] Failed to queue compressed video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Process next pending item in the queue
 */
export async function processNextQueueItem() {
  let queueItem = null;

  try {
    // Get next pending item (prioritize HIGH, then NORMAL, then LOW)
    queueItem = await prisma.streamQueue.findFirst({
      where: {
        status: "PENDING",
        attempts: {
          lt: prisma.streamQueue.fields.maxAttempts,
        },
      },
      orderBy: [
        {
          priority: "desc", // HIGH > NORMAL > LOW
        },
        {
          createdAt: "asc", // Oldest first
        },
      ],
      include: {
        video: {
          select: {
            id: true,
            title: true,
            filename: true,
            campaignId: true,
          },
        },
      },
    });

    if (!queueItem) {
      console.log("[STREAM QUEUE] No pending items");
      return null;
    }

    console.log(`[STREAM QUEUE] Processing video ${queueItem.videoId} (Priority: ${queueItem.priority})`);

    // Mark as processing
    await prisma.streamQueue.update({
      where: { id: queueItem.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    // Upload to Cloudflare Stream
    const result = await uploadToCloudflareStream(queueItem);

    // Update queue status on success
    await prisma.streamQueue.update({
      where: { id: queueItem.id },
      data: {
        status: "COMPLETED",
        streamId: result.streamId,
        completedAt: new Date(),
      },
    });

    // Update video record with stream info
    await prisma.video.update({
      where: { id: queueItem.videoId },
      data: {
        streamId: result.streamId,
        playbackUrl: result.playbackUrl,
        thumbnailUrl: result.thumbnailUrl,
        status: "ready",
      },
    });

    console.log(`[STREAM QUEUE] Video ${queueItem.videoId} uploaded successfully. StreamID: ${result.streamId}`);

    return result;
  } catch (error) {
    console.error("[STREAM QUEUE ERROR]", error);

    // Update queue item with error
    if (queueItem) {
      const maxAttempts = queueItem.maxAttempts || 3;
      const currentAttempts = queueItem.attempts + 1;
      const isFinalAttempt = currentAttempts >= maxAttempts;

      await prisma.streamQueue.update({
        where: { id: queueItem.id },
        data: {
          status: isFinalAttempt ? "FAILED" : "PENDING",
          lastError: error.message,
        },
      });

      // Update video status if all retries exhausted
      if (isFinalAttempt) {
        await prisma.video.update({
          where: { id: queueItem.videoId },
          data: {
            status: "error",
            metadata: {
              streamUploadError: error.message,
              failedAt: new Date().toISOString(),
              attempts: currentAttempts,
            },
          },
        });

        console.error(
          `[STREAM QUEUE] Video ${queueItem.videoId} failed after ${currentAttempts} attempts`
        );
      } else {
        console.log(
          `[STREAM QUEUE] Video ${queueItem.videoId} will retry (Attempt ${currentAttempts}/${maxAttempts})`
        );
      }
    }

    throw error;
  }
}

/**
 * Upload video to Cloudflare Stream
 */
async function uploadToCloudflareStream(queueItem) {
  // 1. Generate presigned download URL from R2 (valid for 1 hour)
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: queueItem.r2Key,
  });

  const downloadUrl = await getSignedUrl(r2, getObjectCommand, {
    expiresIn: 3600, // 1 hour
  });

  // 2. Upload to Cloudflare Stream via URL
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const streamResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: downloadUrl,
        meta: {
          videoId: queueItem.videoId,
          name: queueItem.video.title || queueItem.video.filename,
          campaignId: queueItem.video.campaignId,
        },
        requireSignedURLs: false, // Set to true if you want signed URLs for playback
        allowedOrigins: [],
        thumbnailTimestampPct: 0.1, // Generate thumbnail at 10% of video
      }),
    }
  );

  if (!streamResponse.ok) {
    const errorData = await streamResponse.json();
    throw new Error(`Cloudflare Stream upload failed: ${JSON.stringify(errorData)}`);
  }

  const streamData = await streamResponse.json();

  if (!streamData.success) {
    throw new Error(`Cloudflare Stream API error: ${JSON.stringify(streamData.errors)}`);
  }

  const streamId = streamData.result.uid;
  // const playbackUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
  // const thumbnailUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg`;
  const detailsResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
    { headers: { "Authorization": `Bearer ${apiToken}` } }
  );

  const detailsData = await detailsResponse.json();

return {
  streamId,
  playbackUrl: detailsData.result.playback.hls, // ✅ Correct subdomain
  thumbnailUrl: detailsData.result.thumbnail,    // ✅ Correct subdomain
  duration: detailsData.result.duration,
  resolution: `${detailsData.result.input.width}x${detailsData.result.input.height}`,
};
}

/**
 * Process all pending queue items (for cron job)
 */
export async function processQueue(batchSize = 5) {
  console.log(`[STREAM QUEUE] Processing batch of ${batchSize} items`);

  const results = [];
  for (let i = 0; i < batchSize; i++) {
    try {
      const result = await processNextQueueItem();
      if (!result) break; // No more items
      results.push(result);
    } catch (error) {
      console.error(`[STREAM QUEUE] Error processing item ${i + 1}:`, error);
      // Continue with next item
    }
  }

  console.log(`[STREAM QUEUE] Processed ${results.length} items`);
  return results;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const stats = await prisma.streamQueue.groupBy({
    by: ["status"],
    _count: true,
  });

  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count;
    return acc;
  }, {});

  return {
    pending: statsMap.PENDING || 0,
    processing: statsMap.PROCESSING || 0,
    completed: statsMap.COMPLETED || 0,
    failed: statsMap.FAILED || 0,
    total: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
  };
}

/**
 * Retry failed queue items
 */
export async function retryFailedItems() {
  const failedItems = await prisma.streamQueue.findMany({
    where: {
      status: "FAILED",
      attempts: {
        lt: prisma.streamQueue.fields.maxAttempts,
      },
    },
  });

  console.log(`[STREAM QUEUE] Retrying ${failedItems.length} failed items`);

  for (const item of failedItems) {
    await prisma.streamQueue.update({
      where: { id: item.id },
      data: {
        status: "PENDING",
        lastError: null,
      },
    });
  }

  return failedItems.length;
}
