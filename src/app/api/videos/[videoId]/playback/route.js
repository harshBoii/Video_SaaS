// app/api/videos/[videoId]/playback/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateRequest, canAccessCampaign } from "@/app/lib/auth";
import { videoIdParamSchema, playbackOptionsSchema, formatZodError } from "@/app/lib/validation";

export async function GET(request, { params }) {
  try {
    // ✅ 1. AUTHENTICATE USER
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;

    // ✅ 2. VALIDATE VIDEO ID
    const paramValidation = videoIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid video ID",
          details: formatZodError(paramValidation.error),
        },
        { status: 400 }
      );
    }

    const { videoId } = paramValidation.data;

    // ✅ 3. PARSE PLAYBACK OPTIONS
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    const optionsValidation = playbackOptionsSchema.safeParse(queryObject);

    if (!optionsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid playback options",
          details: formatZodError(optionsValidation.error),
        },
        { status: 400 }
      );
    }

    const { format, autoplay, muted, controls, preload } = optionsValidation.data;

    // ✅ 4. FETCH VIDEO
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        streamId: true,
        playbackUrl: true,
        thumbnailUrl: true,
        status: true,
        campaignId: true,
        campaign: {
          select: {
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
        },
        { status: 404 }
      );
    }

    // ✅ 5. AUTHORIZATION
    const hasAccess = await canAccessCampaign(
      user.id,
      video.campaign.companyId,
      video.campaignId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You don't have access to this video",
        },
        { status: 403 }
      );
    }

    // ✅ 6. CHECK IF VIDEO IS READY FOR PLAYBACK
    if (!video.streamId || !video.playbackUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not ready for streaming",
          message: "This video hasn't been uploaded to Cloudflare Stream yet",
          currentStatus: video.status,
        },
        { status: 400 }
      );
    }

    // ✅ 7. BUILD PLAYBACK RESPONSE BASED ON FORMAT
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const streamId = video.streamId;

    let playbackResponse = {
      success: true,
      video: {
        id: video.id,
        title: video.title,
        streamId: video.streamId,
        thumbnailUrl: video.thumbnailUrl,
      },
    };

    if (format === "iframe") {
      // ✅ IFRAME EMBED
      const iframeParams = new URLSearchParams({
        autoplay: autoplay ? "true" : "false",
        muted: muted ? "true" : "false",
        controls: controls ? "true" : "false",
        preload: preload,
      });

      const iframeUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/iframe?${iframeParams}`;

      playbackResponse.playback = {
        type: "iframe",
        url: iframeUrl,
        embedCode: `<iframe src="${iframeUrl}" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`,
        width: "100%",
        height: "100%",
      };
    } else if (format === "hls") {
      // ✅ HLS MANIFEST (for Video.js, Plyr, etc.)
      const hlsUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;

      playbackResponse.playback = {
        type: "hls",
        url: hlsUrl,
        mimeType: "application/x-mpegURL",
        example: {
          library: "Video.js or Plyr",
          code: `<video id="video" controls ${autoplay ? "autoplay" : ""} ${muted ? "muted" : ""} ${preload ? `preload="${preload}"` : ""}></video>
<script>
  const player = videojs('video');
  player.src({
    src: '${hlsUrl}',
    type: 'application/x-mpegURL'
  });
</script>`,
        },
      };
    } else if (format === "dash") {
      // ✅ DASH MANIFEST
      const dashUrl = `https://customer-${accountId.substring(0, 8)}.cloudflarestream.com/${streamId}/manifest/video.mpd`;

      playbackResponse.playback = {
        type: "dash",
        url: dashUrl,
        mimeType: "application/dash+xml",
        example: {
          library: "dash.js",
          code: `<video id="video" controls ${autoplay ? "autoplay" : ""} ${muted ? "muted" : ""}></video>
<script>
  const player = dashjs.MediaPlayer().create();
  player.initialize(document.querySelector('#video'), '${dashUrl}', ${autoplay});
</script>`,
        },
      };
    }

    return NextResponse.json(playbackResponse);
  } catch (error) {
    console.error("[VIDEO PLAYBACK ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get playback URL",
        message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
