// lib/compressionWorker.js
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { queueStreamAfterCompression } from "@/app/lib/streamQueue";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

/**
 * Process next pending compression job
 */
export async function processCompressionQueue() {
  try {
    // Get next pending job
    const job = await prisma.compressionJob.findFirst({
      where: {
        status: "PENDING",
        attempts: {
          lt: prisma.compressionJob.fields.maxAttempts,
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      include: {
        video: {
          select: {
            id: true,
            title: true,
            r2Key: true,
            originalSize: true,
          },
        },
      },
    });

    if (!job) {
      console.log("[COMPRESSION] No pending jobs");
      return null;
    }

    console.log(`[COMPRESSION] Processing job ${job.id} for video ${job.video.title}`);

    // Mark as processing
    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    // Compress the video
    const result = await compressVideo(job);

    // Mark as completed
    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        outputR2Key: result.compressedKey,
        outputSize: result.compressedSize,
      },
    });

    // Update video with compressed version
    await prisma.video.update({
      where: { id: job.videoId },
      data: {
        compressedSize: result.compressedSize,
        status: "ready",
      },
    });

    // ✅ NOW queue for Stream with compressed file
    await queueStreamAfterCompression(job.videoId, result.compressedKey, "HIGH");

    console.log(
      `[COMPRESSION] Job ${job.id} completed. Original: ${formatBytes(job.video.originalSize)}, Compressed: ${formatBytes(result.compressedSize)} (${result.savingsPercent}% savings)`
    );

    return result;
  } catch (error) {
    console.error("[COMPRESSION ERROR]", error);

    if (job) {
      await prisma.compressionJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= job.maxAttempts ? "FAILED" : "PENDING",
          lastError: error.message,
        },
      });
    }

    throw error;
  }
}

/**
 * Compress a video using FFmpeg
 */
async function compressVideo(job) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `input-${job.id}.mp4`);
  const outputPath = path.join(tmpDir, `output-${job.id}.mp4`);

  try {
    // 1. Download from R2
    console.log(`[COMPRESSION] Downloading from R2: ${job.video.r2Key}`);
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: job.video.r2Key,
    });

    const { Body } = await r2.send(getCommand);
    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    await fs.writeFile(inputPath, Buffer.concat(chunks));

    // 2. Compress with FFmpeg
    console.log(`[COMPRESSION] Compressing video with FFmpeg...`);
    
    const ffmpegCommand = `ffmpeg -i "${inputPath}" \
      -c:v libx264 \
      -preset medium \
      -crf 23 \
      -b:v ${job.targetBitrate}k \
      -maxrate ${job.targetBitrate * 1.5}k \
      -bufsize ${job.targetBitrate * 2}k \
      -c:a aac \
      -b:a 128k \
      -movflags +faststart \
      -y "${outputPath}"`;

    await execAsync(ffmpegCommand);

    // 3. Get compressed file size
    const stats = await fs.stat(outputPath);
    const compressedSize = stats.size;

    // 4. Upload compressed file to R2
    const compressedKey = job.video.r2Key.replace(/(\.[^.]+)$/, '-compressed$1');
    console.log(`[COMPRESSION] Uploading compressed file to R2: ${compressedKey}`);

    const compressedBuffer = await fs.readFile(outputPath);
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: compressedKey,
      Body: compressedBuffer,
      ContentType: "video/mp4",
      Metadata: {
        originalSize: job.video.originalSize.toString(),
        compressedSize: compressedSize.toString(),
        compressionJobId: job.id,
      },
    });

    await r2.send(putCommand);

    // 5. Cleanup temp files
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});

    const savingsPercent = Math.round(
      ((job.video.originalSize - compressedSize) / job.video.originalSize) * 100
    );

    return {
      compressedKey,
      compressedSize,
      originalSize: job.video.originalSize,
      savingsPercent,
    };
  } catch (error) {
    // Cleanup on error
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
