import { NextResponse } from "next/server";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  console.log('[FFMPEG] Loaded successfully');
  return ffmpegInstance;
}

export async function POST(request) {
  try {
    const { sourceUrl, editMode, crop, resize, trim } = await request.json();

    console.log('[FFMPEG WORKER] Processing:', { editMode, crop, resize, trim });

    // ✅ 1. DOWNLOAD SOURCE VIDEO
    const response = await fetch(sourceUrl);
    const videoData = await response.arrayBuffer();

    console.log('[FFMPEG WORKER] Downloaded:', videoData.byteLength, 'bytes');

    // ✅ 2. LOAD FFMPEG
    const ffmpeg = await getFFmpeg();

    // ✅ 3. WRITE INPUT FILE
    await ffmpeg.writeFile('input.mp4', new Uint8Array(videoData));

    // ✅ 4. BUILD FFMPEG COMMAND
    const ffmpegArgs = ['-i', 'input.mp4'];

    // Video filters
    const filters = [];

    // Trim (must be applied first)
    if (editMode === 'trim' && trim) {
      ffmpegArgs.push('-ss', trim.start.toString());
      ffmpegArgs.push('-to', trim.end.toString());
    }

    // Crop
    if (editMode === 'crop' && crop) {
      filters.push(`crop=${Math.round(crop.width)}:${Math.round(crop.height)}:${Math.round(crop.x)}:${Math.round(crop.y)}`);
    }

    // Resize
    if (editMode === 'resize' && resize) {
      filters.push(`scale=${Math.round(resize.width)}:${Math.round(resize.height)}`);
    }

    // Apply filters
    if (filters.length > 0) {
      ffmpegArgs.push('-vf', filters.join(','));
    }

    // Output settings
    ffmpegArgs.push(
      '-c:v', 'libx264',      // H.264 codec
      '-preset', 'fast',       // Encoding speed
      '-crf', '23',            // Quality (18-28, lower = better)
      '-c:a', 'aac',           // Audio codec
      '-b:a', '128k',          // Audio bitrate
      '-movflags', '+faststart', // Web optimization
      'output.mp4'
    );

    console.log('[FFMPEG WORKER] Command:', ffmpegArgs.join(' '));

    // ✅ 5. EXECUTE FFMPEG
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFMPEG LOG]', message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      console.log('[FFMPEG PROGRESS]', Math.round(progress * 100) + '%', time);
    });

    await ffmpeg.exec(ffmpegArgs);

    // ✅ 6. READ OUTPUT FILE
    const outputData = await ffmpeg.readFile('output.mp4');

    console.log('[FFMPEG WORKER] Output size:', outputData.byteLength, 'bytes');

    // ✅ 7. CLEANUP
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    // ✅ 8. RETURN BASE64 VIDEO
    const base64Video = Buffer.from(outputData).toString('base64');

    return NextResponse.json({
      success: true,
      processedVideoBlob: base64Video,
      outputSize: outputData.byteLength,
    });

  } catch (error) {
    console.error('[FFMPEG WORKER ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'FFmpeg processing failed',
      },
      { status: 500 }
    );
  }
}
