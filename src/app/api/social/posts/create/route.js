import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth';
import { generatePresignedUrl } from '@/app/lib/r2';

// Helper to convert BigInt to Number for JSON serialization
const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
};

export async function POST(request) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 [${requestId}] NEW POST CREATE REQUEST`);
  console.log('='.repeat(80));
  
  try {
    // ========================================================================
    // STEP 1: Authentication
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 1: Authentication`);
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      console.error(`❌ [${requestId}] Authentication failed - No company token`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`✅ [${requestId}] Authenticated - Company ID: ${companyId}`);

    // ========================================================================
    // STEP 2: Fetch Late Profile
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 2: Fetching Late Profile`);
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        lateId: true,
        id: true,
        name: true,
      },
    });

    if (!profile) {
      console.error(`❌ [${requestId}] Late profile not found for company: ${companyId}`);
      return NextResponse.json(
        {
          error: 'Late profile not found. Please connect your Late account first.',
        },
        { status: 404 }
      );
    }

    console.log(`✅ [${requestId}] Late Profile Found:`);
    console.log(`   - Profile ID: ${profile.lateId}`);
    console.log(`   - Profile Name: ${profile.name}`);

    // ========================================================================
    // STEP 3: Parse Request Body
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 3: Parsing Request Body`);
    const body = await request.json();
    
    console.log(`📦 [${requestId}] Raw Request Body:`, JSON.stringify(body, null, 2));

    const {
      videoIds = [],
      title,
      content,
      platforms = [],
      scheduledFor,
      publishNow = false,
      isDraft = false,
      timezone = 'UTC',
      tags = [],
      hashtags = [],
      mentions = [],
    } = body;

    console.log(`\n📊 [${requestId}] Parsed Request Data:`);
    console.log(`   - Video IDs: ${JSON.stringify(videoIds)}`);
    console.log(`   - Title: ${title || '(none)'}`);
    console.log(`   - Content Length: ${content?.length || 0} chars`);
    console.log(`   - Platforms: ${platforms.length}`);
    console.log(`   - Schedule Type: ${isDraft ? 'DRAFT' : publishNow ? 'IMMEDIATE' : 'SCHEDULED'}`);
    console.log(`   - Scheduled For: ${scheduledFor || 'N/A'}`);
    console.log(`   - Timezone: ${timezone}`);

    // ========================================================================
    // STEP 4: Validate Basic Requirements
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 4: Validating Requirements`);

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      console.error(`❌ [${requestId}] Validation failed - No platforms selected`);
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    if (!content && !title) {
      console.error(`❌ [${requestId}] Validation failed - No content or title`);
      return NextResponse.json(
        { error: 'Content or title is required' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Basic validation passed`);

    // ========================================================================
    // STEP 5: Fetch & Process Videos
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 5: Processing Videos`);
    
    let mediaItems = [];
    let firstVideoData = null;

    if (videoIds.length > 0) {
      console.log(`🎥 [${requestId}] Fetching ${videoIds.length} video(s)...`);
      
      const videos = await prisma.video.findMany({
        where: {
          id: { in: videoIds },
          campaign: {
            companyId: companyId,
          },
        },
        select: {
          id: true,
          title: true,
          r2Key: true,
          r2Bucket: true,
          thumbnailUrl: true,
          duration: true,
          resolution: true,
          codec: true,
          status: true,
          originalSize: true,
        },
      });

      console.log(`📊 [${requestId}] Videos found: ${videos.length}`);

      if (!videos || videos.length === 0) {
        console.error(`❌ [${requestId}] No videos found or access denied`);
        return NextResponse.json(
          { error: 'Videos not found or access denied' },
          { status: 404 }
        );
      }

      // Validate all videos are ready
      const notReady = videos.find((v) => v.status !== 'ready');
      if (notReady) {
        console.error(`❌ [${requestId}] Video not ready: ${notReady.id} (status: ${notReady.status})`);
        return NextResponse.json(
          {
            error: `Video "${notReady.title}" is not ready for posting. Status: ${notReady.status}`,
          },
          { status: 400 }
        );
      }

      firstVideoData = videos[0];
      console.log(`✅ [${requestId}] All videos are ready for posting`);

      // Generate presigned URLs and build mediaItems
      console.log(`\n🔐 [${requestId}] Generating presigned URLs...`);
      
      for (const video of videos) {
        console.log(`   - Processing video: ${video.id} (${video.title})`);
        
        const videoUrl = await generatePresignedUrl(
          video.r2Key,
          video.r2Bucket,
          86400
        );

        console.log(`     ✓ Video URL generated (expires in 24h)`);

        // Parse resolution
        let width, height;
        if (video.resolution) {
          const match = video.resolution.match(/(\d+)x(\d+)/);
          if (match) {
            width = parseInt(match[1], 10);
            height = parseInt(match[2], 10);
            console.log(`     ✓ Resolution: ${width}x${height}`);
          }
        }

        const mediaItem = {
          type: 'video',
          url: videoUrl,
          filename: video.title || 'video.mp4',
          ...(video.duration && { duration: video.duration }),
          ...(width && height && { width, height }),
          ...(video.originalSize && { size: Number(video.originalSize) }),
          mimeType: 'video/mp4',
        };

        // Handle thumbnail
        if (video.thumbnailUrl) {
          try {
            if (video.thumbnailUrl.includes(video.r2Bucket)) {
              const thumbnailKey = video.thumbnailUrl.split('/').pop();
              const signedThumbnail = await generatePresignedUrl(
                `thumbnails/${thumbnailKey}`,
                video.r2Bucket,
                86400
              );
              mediaItem.thumbnail = signedThumbnail;
              console.log(`     ✓ Thumbnail signed (R2-hosted)`);
            } else {
              mediaItem.thumbnail = video.thumbnailUrl;
              console.log(`     ✓ Thumbnail added (external URL)`);
            }
          } catch (err) {
            console.error(`     ⚠️ Failed to sign thumbnail:`, err.message);
            mediaItem.thumbnail = video.thumbnailUrl;
          }
        }

        mediaItems.push(mediaItem);
      }

      console.log(`✅ [${requestId}] Generated ${mediaItems.length} media item(s)`);
    } else {
      console.log(`ℹ️ [${requestId}] No videos provided - text-only post`);
    }

    // ========================================================================
    // STEP 6: Platform-Specific Validation (ENHANCED)
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 6: Platform-Specific Validation`);

    const platformTypes = platforms.map((p) => String(p.platform || '').toLowerCase());
    console.log(`📱 [${requestId}] Target Platforms:`, platformTypes);

    // YouTube requires video
    if (platformTypes.includes('youtube') && mediaItems.length === 0) {
      console.error(`❌ [${requestId}] YouTube requires video content`);
      return NextResponse.json(
        { error: 'YouTube posts require a video' },
        { status: 400 }
      );
    }

    // Instagram & TikTok require media
    const requiresMedia = ['instagram', 'tiktok'];
    const needsMedia = platformTypes.filter((p) => requiresMedia.includes(p));
    if (needsMedia.length > 0 && mediaItems.length === 0) {
      console.error(`❌ [${requestId}] ${needsMedia.join(', ')} require media`);
      return NextResponse.json(
        { error: `${needsMedia.join(' and ')} posts require media` },
        { status: 400 }
      );
    }

    // ✅ Instagram Story Duration Validation
    const instagramPlatform = platforms.find((p) => p.platform.toLowerCase() === 'instagram');
    if (instagramPlatform) {
      const instagramData = instagramPlatform.platformSpecificData;
      
      if (instagramData?.contentType === 'story' && mediaItems.length > 0) {
        const videoItem = mediaItems[0];
        const duration = videoItem.duration;
        
        console.log(`📱 [${requestId}] Instagram Story detected - validating...`);
        console.log(`   - Video duration: ${duration}s`);
        
        // Instagram Stories: 3-60 seconds
        if (duration < 3 || duration > 60) {
          console.error(`❌ [${requestId}] Instagram Story duration invalid: ${duration}s`);
          return NextResponse.json(
            {
              error: `Instagram Stories require videos between 3-60 seconds. Your video is ${duration} seconds.`,
              details: {
                platform: 'instagram',
                contentType: 'story',
                videoDuration: duration,
                requiredRange: '3-60 seconds',
                suggestion: duration > 60 
                  ? 'Please trim your video to under 60 seconds' 
                  : 'Video too short - must be at least 3 seconds',
              },
            },
            { status: 400 }
          );
        }
        
        // Check video dimensions
        if (videoItem.width && videoItem.height) {
          const aspectRatio = videoItem.width / videoItem.height;
          const isVertical = aspectRatio < 1;
          
          if (!isVertical) {
            console.warn(`⚠️ [${requestId}] Warning: Video is not vertical (${aspectRatio.toFixed(2)})`);
          } else {
            console.log(`   ✓ Video is vertical (${aspectRatio.toFixed(2)})`);
          }
        }
        
        // Check file size (max 100MB)
        if (videoItem.size) {
          const sizeInMB = videoItem.size / (1024 * 1024);
          console.log(`   - File size: ${sizeInMB.toFixed(2)}MB`);
          
          if (sizeInMB > 100) {
            console.error(`❌ [${requestId}] File too large: ${sizeInMB.toFixed(2)}MB`);
            return NextResponse.json(
              {
                error: `Instagram Stories require videos under 100MB. Your video is ${sizeInMB.toFixed(2)}MB.`,
              },
              { status: 400 }
            );
          }
        }
        
        console.log(`✅ [${requestId}] Instagram Story validation passed`);
      }
    }

    // Validate TikTok settings
    const tiktokPlatform = platforms.find((p) => p.platform.toLowerCase() === 'tiktok');
    if (tiktokPlatform) {
      const tiktokData = tiktokPlatform.platformSpecificData;
      
      if (!tiktokData || !tiktokData.privacy_level) {
        console.error(`❌ [${requestId}] TikTok missing required privacy_level`);
        return NextResponse.json(
          { error: 'TikTok requires privacy_level in platformSpecificData' },
          { status: 400 }
        );
      }
      
      console.log(`✓ [${requestId}] TikTok settings validated`);
    }

    console.log(`✅ [${requestId}] Platform validation passed`);

    // ========================================================================
    // STEP 7: Build Late API Payload
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 7: Building Late API Payload`);

    // Normalize arrays
    const normTags = Array.isArray(tags)
      ? tags
      : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean);

    const normHashtags = Array.isArray(hashtags)
      ? hashtags
      : String(hashtags || '').split(',').map((h) => h.trim()).filter(Boolean);

    const normMentions = Array.isArray(mentions)
      ? mentions
      : String(mentions || '').split(',').map((m) => m.trim()).filter(Boolean);

    console.log(`   - Tags: ${normTags.length > 0 ? normTags.join(', ') : '(none)'}`);
    console.log(`   - Hashtags: ${normHashtags.length > 0 ? normHashtags.join(', ') : '(none)'}`);
    console.log(`   - Mentions: ${normMentions.length > 0 ? normMentions.join(', ') : '(none)'}`);

    // Build platforms array for Late API
    const latePlatforms = platforms.map((p) => {
      console.log(`\n   🔧 Building platform config for: ${p.platform}`);
      console.log(`      - Account ID: ${p.accountId}`);
      console.log(`      - Custom Content: ${p.customContent ? 'Yes' : 'No'}`);
      console.log(`      - Custom Schedule: ${p.scheduledFor ? 'Yes' : 'No'}`);
      
      const platformPayload = {
        platform: p.platform,
        accountId: p.accountId,
      };

      // Add custom content if provided
      if (p.customContent) {
        platformPayload.customContent = p.customContent;
        console.log(`      ✓ Using custom content (${p.customContent.length} chars)`);
      }

      // Add per-platform scheduling override
      if (p.scheduledFor) {
        platformPayload.scheduledFor = new Date(p.scheduledFor).toISOString();
        console.log(`      ✓ Custom schedule: ${platformPayload.scheduledFor}`);
      }

      // Process platformSpecificData
      if (p.platformSpecificData && Object.keys(p.platformSpecificData).length > 0) {
        const platformData = { ...p.platformSpecificData };
        
        // Instagram Story Fix: Remove shareToFeed
        if (p.platform.toLowerCase() === 'instagram') {
          if (platformData.contentType === 'story') {
            console.log(`      ⚠️ Instagram Story - removing shareToFeed`);
            delete platformData.shareToFeed;
          }
        }

        console.log(`      ✓ Platform-specific data:`, JSON.stringify(platformData, null, 8));
        
        // Build threadItems structure
        if (mediaItems.length > 0) {
          platformPayload.platformSpecificData = {
            ...platformData,
            threadItems: [{
              content: p.customContent || content || '',
              mediaItems: mediaItems,
            }],
          };
        } else {
          platformPayload.platformSpecificData = platformData;
        }
      }

      return platformPayload;
    });

    // Build final Late API payload
    const latePayload = {
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
      metadata: {
        source: 'your-app-api',
        companyId: companyId,
        requestId: requestId,
        videoIds: videoIds,
        ...(firstVideoData && {
          primaryVideo: {
            id: firstVideoData.id,
            title: firstVideoData.title,
          },
        }),
      },
    };

    console.log(`\n📦 [${requestId}] Complete Late API Payload:`);
    console.log(JSON.stringify(serializeBigInt(latePayload), null, 2));

    // ========================================================================
    // STEP 8: Call Late API
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 8: Calling Late API`);
    console.log(`🌐 [${requestId}] Endpoint: https://getlate.dev/api/v1/posts`);
    console.log(`⏱️ [${requestId}] Sending request...`);

    const lateStartTime = Date.now();

    const lateResponse = await fetch('https://getlate.dev/api/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LATE_API_KEY}`,
      },
      body: JSON.stringify(serializeBigInt(latePayload)),
    });

    const lateResponseTime = Date.now() - lateStartTime;
    console.log(`⏱️ [${requestId}] Late API response time: ${lateResponseTime}ms`);

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json().catch(() => ({}));
      
      console.error(`\n❌ [${requestId}] Late API Error:`);
      console.error(`   - Status: ${lateResponse.status}`);
      console.error(`   - Error:`, JSON.stringify(errorData, null, 2));

      throw new Error(
        errorData.message ||
          errorData.error ||
          `Late API error: ${lateResponse.status}`
      );
    }

    const lateResult = await lateResponse.json();
    
    console.log(`\n✅ [${requestId}] Late API Success!`);
    console.log(`📊 [${requestId}] Late Response:`, JSON.stringify(lateResult, null, 2));

// ========================================================================
// STEP 9: Save to Database - ONE SocialPost PER PLATFORM
// ========================================================================
    console.log(`\n📋 [${requestId}] STEP 9: Saving to Database (per-platform)`);

    // Will hold all created local posts (one per platform)
    let savedPosts= [];
    let baseStatus;

    try {
      // Extract Late Post ID once
      const latePostId =
        lateResult.post?._id || lateResult._id || lateResult.id || null;

      const hasErrors =
        lateResult.error ||
        lateResult.platformResults?.some((p) => p.status === 'failed');
      const allFailed =
        lateResult.platformResults &&
        lateResult.platformResults.every((p) => p.status === 'failed');

      // Decide base status once

      if (allFailed) baseStatus = 'FAILED';
      else if (isDraft) baseStatus = 'DRAFT';
      else if (publishNow) baseStatus = hasErrors ? 'FAILED' : 'PUBLISHING';
      else baseStatus = 'SCHEDULED';

      console.log(`   - Late Post ID: ${latePostId}`);
      console.log(`   - Base Status: ${baseStatus}`);

      // Loop over each selected platform from the frontend
      for (const p of platforms) {
        console.log(`\n   💾 Creating SocialPost for platform: ${p.platform}`);
        console.log(`      - Late accountId: ${p.accountId}`);

        if (!p.accountId) {
          console.warn(`      ⚠️ Skipping: no accountId provided for this platform`);
          continue;
        }

        // 1) Map Late accountId → local SocialAccount.id
        const localAccount = await prisma.socialAccount.findFirst({
          where: {
            accountId: p.accountId, // Late's accountId stored in your table
            companyId,
          },
          select: {
            id: true,
            platform: true,
            username: true,
          },
        });

        if (!localAccount) {
          console.warn(
            `      ❌ No local SocialAccount found for Late accountId=${p.accountId} (platform=${p.platform})`
          );
          continue;
        }

        console.log(`      ✅ Found local SocialAccount:`);
        console.log(`         - Local ID: ${localAccount.id}`);
        console.log(`         - Platform: ${localAccount.platform}`);
        console.log(`         - Username: ${localAccount.username}`);

        // 2) Determine per‑platform status from Late response (if available)
        let perPlatformStatus = baseStatus;
        const platformResult = lateResult.platformResults?.find(
          (r) =>
            r.platform?.toLowerCase() === String(p.platform).toLowerCase()
        );

        if (platformResult) {
          if (platformResult.status === 'failed') {
            perPlatformStatus = 'FAILED';
          }
        }

        // 3) Create one SocialPost row for this platform
        const created = await prisma.socialPost.create({
          data: {
            companyId,
            socialAccountId: localAccount.id,
            content: content || title || '',      // required field
            caption: title || null,               // optional “title” stored as caption
            videoId: videoIds[0] || null,
            scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
            timezone,
            status: perPlatformStatus,
            latePostId,                           // same Late post id for all

            mediaUrls: mediaItems.map((m) => m.url),

            platformConfig: serializeBigInt({
              request: latePayload,
              thisPlatform: p,                   // only this platform’s config
              allPlatforms: platforms,           // optional: store all too
              tags: normTags,
              hashtags: normHashtags,
              mentions: normMentions,
            }),

            error:
              platformResult?.error ||
              (typeof lateResult.error === 'string'
                ? lateResult.error
                : lateResult.error
                ? JSON.stringify(lateResult.error)
                : null),
          },
        });

        console.log(
          `      ✅ SocialPost created: ${created.id} (status=${created.status})`
        );
        savedPosts.push(created);
      }

      if (savedPosts.length === 0) {
        console.warn(
          `⚠️ [${requestId}] No SocialPost rows were created (no matching local accounts or all skipped)`
        );
      } else {
        console.log(
          `✅ [${requestId}] Created ${savedPosts.length} SocialPost row(s) (one per platform)`
        );
      }
    } catch (dbError) {
      console.error(
        `⚠️ [${requestId}] Database save failed (per-platform loop):`,
        dbError.message
      );
      if (dbError.code === 'P2003') {
        console.error(
          `   💡 Foreign key constraint failed. Likely socialAccountId didn't match any SocialAccount.id`
        );
      }
      console.error(`   Full error:`, dbError);
    }

    // ========================================================================
    // STEP 10: Success Response (ENHANCED)
    // ========================================================================
    const hasErrors = lateResult.error || lateResult.platformResults?.some(p => p.status === 'failed');
    const allFailed = lateResult.platformResults?.every(p => p.status === 'failed');

    let responseMessage;
    let responseStatus = 201;

    if (allFailed) {
      responseMessage = 'Post created but publishing failed for all platforms';
      responseStatus = 207;
    } else if (hasErrors) {
      responseMessage = 'Post created but some platforms failed';
      responseStatus = 207;
    } else if (isDraft) {
      responseMessage = 'Draft saved successfully';
    } else if (publishNow) {
      responseMessage = `Post published to ${platformTypes.length} platform(s)`;
    } else {
      responseMessage = `Post scheduled for ${new Date(scheduledFor).toLocaleString()}`;
    }

    console.log(`\n${hasErrors ? '⚠️' : '✅'} [${requestId}] REQUEST COMPLETED`);
    console.log(`📊 [${requestId}] Summary:`);
    console.log(`   - Platforms: ${platformTypes.join(', ')}`);
    console.log(`   - Videos: ${videoIds.length}`);
    console.log(`   - Status: ${hasErrors ? 'PARTIAL/FAILED' : savedPosts?.status || 'N/A'}`);
    console.log(`   - Late Post ID: ${lateResult.post?._id || lateResult._id || 'N/A'}`);
    console.log(`   - Local Post ID: ${savedPosts?.id || 'N/A'}`);
    console.log(`   - Total Time: ${Date.now() - parseInt(requestId.split('-')[1])}ms`);

    if (lateResult.platformResults) {
      console.log(`\n   📱 Platform Results:`);
      lateResult.platformResults.forEach((result) => {
        const icon = result.status === 'failed' ? '❌' : '✅';
        console.log(`      ${icon} ${result.platform}: ${result.status}`);
        if (result.error) {
          console.log(`         Error: ${result.error.substring(0, 100)}...`);
        }
      });
    }

    console.log('='.repeat(80) + '\n');

    return NextResponse.json(
      {
        success: !allFailed,
        post: lateResult.post || lateResult,
        localPosts: savedPosts.map((p) => ({ id: p.id, status: p.status })),
        message: responseMessage,
        
        platformResults: lateResult.platformResults || [],
        
        ...(hasErrors && {
          warnings: lateResult.platformResults
            ?.filter(p => p.status === 'failed')
            .map(p => ({
              platform: p.platform,
              error: p.error,
            })),
        }),
        
        debug: process.env.NODE_ENV === 'development' ? {
          requestId,
          responseTime: `${Date.now() - parseInt(requestId.split('-')[1])}ms`,
          lateResponseTime: `${lateResponseTime}ms`,
          dbSaved: !!savedPosts,
        } : undefined,
      },
      { status: responseStatus }
    );

  } catch (error) {
    console.error(`\n❌ [${requestId}] FATAL ERROR:`);
    console.error(`   - Message: ${error.message}`);
    console.error(`   - Stack:`, error.stack);
    console.log('='.repeat(80) + '\n');

    return NextResponse.json(
      {
        error: error.message || 'Failed to create post',
        requestId,
        details:
          process.env.NODE_ENV === 'development'
            ? {
                stack: error.stack,
                cause: error.cause,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Fetch Connected Platforms & Limits
// ============================================================================
export async function GET(request) {
  const requestId = `GET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`\n🔍 [${requestId}] GET /api/social/posts/create`);
  
  try {
    const companyId = await getCompanyFromToken(request);

    if (!companyId) {
      console.error(`❌ [${requestId}] Unauthorized`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`✅ [${requestId}] Authenticated - Company: ${companyId}`);

    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        lateId: true,
        name: true,
        socialAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            accountId: true,
            platform: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    });

    if (!profile) {
      console.error(`❌ [${requestId}] Profile not found`);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log(`✅ [${requestId}] Profile found: ${profile.name}`);
    console.log(`   - Connected accounts: ${profile.socialAccounts.length}`);

    const recentPostsCount = await prisma.socialPost.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(`   - Posts in last 24h: ${recentPostsCount}`);

    const response = {
      success: true,
      profileId: profile.lateId,
      profileName: profile.name,
      connectedPlatforms: profile.socialAccounts.map((acc) => ({
        id: acc.id,
        accountId: acc.accountId,
        platform: acc.platform,
        username: acc.username,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        isActive: acc.isActive,
      })),
      recentPostsCount,
      limits: {
        maxVideoDuration: 3600,
        maxFileSize: 4 * 1024 * 1024 * 1024,
        supportedFormats: ['mp4', 'mov', 'avi', 'webm'],
        presignedUrlExpiry: 86400,
        maxVideosPerPost: 10,
        platformLimits: {
          instagram: {
            story: { minDuration: 3, maxDuration: 60, maxSize: 100 * 1024 * 1024 },
            reel: { minDuration: 3, maxDuration: 90, maxSize: 100 * 1024 * 1024 },
          },
          tiktok: { minDuration: 3, maxDuration: 600, maxSize: 4 * 1024 * 1024 * 1024 },
          youtube: { minDuration: 1, maxDuration: 43200, maxSize: 256 * 1024 * 1024 * 1024 },
        },
      },
    };

    console.log(`✅ [${requestId}] Response sent\n`);

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ [${requestId}] Error:`, error.message);
    return NextResponse.json(
      { error: 'Failed to fetch post information' },
      { status: 500 }
    );
  }
}
