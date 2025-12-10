import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth';
import { generatePresignedUrl } from '@/app/lib/r2';

export async function POST(request) {
  try {
    // 1) Auth
    const companyId = await getCompanyFromToken(request);
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Late profile
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        lateId: true,
        id: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            'Late profile not found. Please connect your Late account first.',
        },
        { status: 404 },
      );
    }

    // 3) Parse body
    const body = await request.json();

    const {
      // NEW: support multiple videos
      videoIds, // array of ids
      videoId, // legacy single id (fallback)
      title,
      content,
      platforms,
      scheduledFor,
      publishNow = false,
      isDraft = false,
      timezone = 'UTC',
      tags = [],
      hashtags = [],
      mentions = [],
      thumbnail,
      tiktokSettings,
      platformSpecificSettings = {},
    } = body;

    // 4) Basic validation
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 },
      );
    }

    if (!content && !title) {
      return NextResponse.json(
        { error: 'Content or title is required' },
        { status: 400 },
      );
    }

    // 5) Collect all video ids (multi + single fallback)
    const allVideoIds = Array.isArray(videoIds) && videoIds.length > 0
      ? videoIds
      : videoId
      ? [videoId]
      : [];

    let mediaItems = [];
    let firstVideoData = null;

    if (allVideoIds.length > 0) {
      // Fetch videos belonging to this company
      const videos = await prisma.video.findMany({
        where: {
          id: { in: allVideoIds },
        },
        select: {
          id: true,
          r2Key: true,
          r2Bucket: true,
          thumbnailUrl: true,
          duration: true,
          resolution: true,
          codec: true,
          status: true,
          originalSize: true,
          title: true,
        },
      });

      if (!videos || videos.length === 0) {
        return NextResponse.json(
          { error: 'Videos not found or access denied' },
          { status: 404 },
        );
      }

      // Validate all videos are ready
      const notReady = videos.find((v) => v.status !== 'ready');
      if (notReady) {
        return NextResponse.json(
          {
            error:
              'One or more videos are not ready for posting. Please wait until processing completes.',
          },
          { status: 400 },
        );
      }

      firstVideoData = videos[0];

      // Generate mediaItems with presigned URLs
      for (const v of videos) {
        console.log('🔐 Generating secure presigned URL for video:', v.id);

        const videoUrl = await generatePresignedUrl(
          v.r2Key,
          v.r2Bucket,
          86400, // 24h
        );

        // Parse resolution
        let width;
        let height;
        if (v.resolution) {
          const match = v.resolution.match(/(\d+)x(\d+)/);
          if (match) {
            width = parseInt(match[1], 10);
            height = parseInt(match[2], 10);
          }
        }

        const mediaItem = {
          type: 'video',
          url: videoUrl,
          ...(v.duration && { duration: v.duration }),
          ...(width && { width }),
          ...(height && { height }),
          mimeType: 'video/mp4',
        };

        // // Optional thumbnail logic (use global thumbnail only for first video)
        // if (thumbnail && v.id === firstVideoData.id) {
        //   try {
        //     if (thumbnail.includes(v.r2Bucket)) {
        //       const thumbnailKey = thumbnail.split('/').pop();
        //       const signedThumbnail = await generatePresignedUrl(
        //         `thumbnails/${thumbnailKey}`,
        //         v.r2Bucket,
        //         86400,
        //       );
        //       mediaItem.thumbnail = { url: signedThumbnail };
        //     } else {
        //       mediaItem.thumbnail = { url: thumbnail };
        //     }
        //   } catch (err) {
        //     console.error('Failed to sign thumbnail URL:', err);
        //     mediaItem.thumbnail = { url: thumbnail };
        //   }
        // } else if (v.thumbnailUrl) {
        //   mediaItem.thumbnail = { url: v.thumbnailUrl };
        // }
        const thumbnailUrl = thumbnail ;
        if (thumbnailUrl) {
        if (thumbnailUrl.includes(videoData.r2Bucket)) {
            try {
            const thumbnailKey = thumbnailUrl.split('/').pop();
            const signedThumbnail = await generatePresignedUrl(
                `thumbnails/${thumbnailKey}`,
                videoData.r2Bucket,
                86400,
            );
            // ✅ Late expects a string here
            mediaItem.thumbnail = signedThumbnail;
            } catch (err) {
            console.error('Failed to sign thumbnail URL:', err);
            mediaItem.thumbnail = thumbnailUrl; // fallback string
            }
        } else {
            // ✅ plain URL string
            mediaItem.thumbnail = thumbnailUrl;
        }
        }


        mediaItems.push(mediaItem);
      }
    }

    // 6) Platform‑specific validation
    const platformTypes = platforms.map((p) =>
      String(p.platform || '').toLowerCase(),
    );

    // YouTube requires at least one video
    if (platformTypes.includes('youtube') && mediaItems.length === 0) {
      return NextResponse.json(
        { error: 'YouTube posts require a video' },
        { status: 400 },
      );
    }

    // Instagram + TikTok require media
    if (
      (platformTypes.includes('instagram') ||
        platformTypes.includes('tiktok')) &&
      mediaItems.length === 0
    ) {
      return NextResponse.json(
        { error: 'Instagram and TikTok posts require media' },
        { status: 400 },
      );
    }

    // TikTok requires settings
    if (platformTypes.includes('tiktok')) {
      if (!tiktokSettings) {
        return NextResponse.json(
          {
            error:
              'TikTok posts require tiktokSettings (privacy_level, allow_comment, etc.)',
          },
          { status: 400 },
        );
      }

      const requiredFields = ['privacy_level', 'allow_comment'];
      const missingFields = requiredFields.filter(
        (field) => !(field in tiktokSettings),
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error:
              'TikTok settings missing required fields: ' +
              missingFields.join(', '),
          },
          { status: 400 },
        );
      }
    }

    // 7) Normalize tags / hashtags / mentions
    const normTags = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

    const normHashtags = Array.isArray(hashtags)
      ? hashtags
      : String(hashtags)
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean);

    const normMentions = Array.isArray(mentions)
      ? mentions
      : String(mentions)
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);

    // 8) Build Late payload
    const latePlatforms = platforms.map((p) => {
      const base = {
        platform: p.platform,
        // FRONTEND sends { platform, profileId } for each platform
        accountId: "69394986f43160a0bc99ab7f", // Late expects accountId
      };

      if (p.platformSpecificData) {
        base.platformSpecificData = p.platformSpecificData;
      }

      // Optional: merge any global per‑platform settings
      if (
        platformSpecificSettings &&
        platformSpecificSettings[p.platform]
      ) {
        Object.assign(base, platformSpecificSettings[p.platform]);
      }

      return base;
    });

    const postData = {
      profileId: profile.lateId,
      ...(title && { title }),
      ...(content && { content }),
      ...(mediaItems.length > 0 && { mediaItems }),
      platforms: latePlatforms,
      ...(scheduledFor && {
        scheduledFor: new Date(scheduledFor).toISOString(),
      }),
      publishNow,
      isDraft,
      timezone,
      ...(normTags.length > 0 && { tags: normTags }),
      ...(normHashtags.length > 0 && { hashtags: normHashtags }),
      ...(normMentions.length > 0 && { mentions: normMentions }),
      crosspostingEnabled: true,
      ...(tiktokSettings && { tiktokSettings }),
      metadata: {
        createdVia: 'your-app',
        companyId: companyId,
        // For convenience, store first video id + title
        videoId: allVideoIds[0] || null,
        videoTitle: firstVideoData ? firstVideoData.title : null,
      },
    };

    console.log('📤 Sending post to Late API...');
    console.log('Platforms:', platformTypes.join(', '));
    console.log('Has media:', mediaItems.length > 0);
    console.log(
      'Schedule type:',
      isDraft ? 'Draft' : publishNow ? 'Immediate' : 'Scheduled',
    );

    console.log("Post Data is :", postData)

    // 9) Call Late API
    const lateResponse = await fetch('https://getlate.dev/api/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LATE_API_KEY}`,
      },
      body: JSON.stringify(postData),
    });

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json().catch(() => ({}));
      console.error('❌ Late API error:', {
        status: lateResponse.status,
        error: errorData,
      });

      throw new Error(
        errorData.message ||
          errorData.error ||
          `Late API error: ${lateResponse.status}`,
      );
    }

    const lateResult = await lateResponse.json();
    console.log(
      '✅ Post created successfully in Late:',lateResult,
    );

    // 10) Save in DB (best effort)
    let savedPost = null;
    try {
      savedPost = await prisma.socialPost.create({
        data: {
          latePostId: lateResult._id || lateResult.id,
          companyId: companyId,
          lateProfileId: profile.id,
          title: title || null,
          content: content || null,
          status: isDraft
            ? 'DRAFT'
            : publishNow
            ? 'PUBLISHING'
            : 'SCHEDULED',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          platforms: platformTypes,
          ...(allVideoIds[0] && { videoId: allVideoIds[0] }),
          metadata: lateResult,
        },
      });

      console.log('✅ Post saved to database:', savedPost.id);
    } catch (dbError) {
      console.error('⚠️ Failed to save post to database:', dbError);
      // Do not fail the request if DB save fails
    }

    // 11) Response
    return NextResponse.json(
      {
        success: true,
        post: lateResult,
        localPostId: savedPost ? savedPost.id : undefined,
        message: isDraft
          ? 'Draft saved successfully'
          : publishNow
          ? 'Post is being published to social media'
          : scheduledFor
          ? `Post scheduled for ${new Date(
              scheduledFor,
            ).toLocaleString()}`
          : 'Post created',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ Failed to create post:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create post',
        details:
          process.env.NODE_ENV === 'development'
            ? error.stack
            : undefined,
      },
      { status: 500 },
    );
  }
}

// Get post creation limits/info
export async function GET(request) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's connected platforms
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        lateId: true,
        socialAccounts: {
          select: {
            platform: true,
            username: true,
            profileId: true,
            isActive: true,
            accountId: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get recent posts count
    const recentPostsCount = await prisma.socialPost.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      success: true,
      connectedPlatforms: profile.socialAccounts.filter(acc => acc.isActive),
      recentPostsCount,
      limits: {
        maxVideoDuration: 3600, // 1 hour
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        supportedFormats: ['mp4', 'mov', 'avi'],
        presignedUrlExpiry: 86400 // 24 hours
      }
    });

  } catch (error) {
    console.error('Failed to get post info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post information' },
      { status: 500 }
    );
  }
}
