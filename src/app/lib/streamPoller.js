// lib/streamPoller.js
import prisma from "./prisma";

export async function pollStreamStatus() {
  try {
    // Get all videos waiting for Stream processing
    const processingVideos = await prisma.video.findMany({
      where: {
        streamId: { not: null },
        status: { in: ["processing", "ready"] },
        playbackUrl: null, // Not yet processed by Stream
      },
      take: 20, // Process 20 at a time
    });

    if (processingVideos.length === 0) {
      console.log("[STREAM POLL] No videos to check");
      return { checked: 0, updated: 0 };
    }

    console.log(`[STREAM POLL] Checking ${processingVideos.length} videos`);

    let updatedCount = 0;

    for (const video of processingVideos) {
      try {
        // Check status in Cloudflare Stream
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${video.streamId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          console.error(`[STREAM POLL] API error for ${video.id}:`, response.status);
          continue;
        }

        const data = await response.json();
        const streamVideo = data.result;

        console.log(`[STREAM POLL] Video ${video.id}: readyToStream=${streamVideo.readyToStream}`);

        // Update if ready
        if (streamVideo.readyToStream) {
          await prisma.video.update({
            where: { id: video.id },
            data: {
              status: "ready",
              playbackUrl: streamVideo.playback?.hls || streamVideo.playback?.dash,
              thumbnailUrl: streamVideo.thumbnail,
              duration: streamVideo.duration || null,
            },
          });

          // Update StreamQueue
          await prisma.streamQueue.updateMany({
            where: { videoId: video.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });

          updatedCount++;
          console.log(`✅ Video ${video.id} (${video.title}) is ready for playback`);
        }
      } catch (error) {
        console.error(`❌ Failed to check video ${video.id}:`, error.message);
      }
    }

    return { checked: processingVideos.length, updated: updatedCount };
  } catch (error) {
    console.error("[STREAM POLL] Error:", error);
    throw error;
  }
}
