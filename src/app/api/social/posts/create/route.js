import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth';
import { generatePresignedUrl } from '@/app/lib/r2';

// ============================================================================
// POST - Create Social Media Post via Late API
// ============================================================================
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
      platforms = [], // Array of { platform, accountId, customContent?, scheduledFor?, platformSpecificData }
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
            companyId: companyId, // Security: Ensure videos belong to this company
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
          86400 // 24 hours
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
          ...(video.originalSize && { size: video.originalSize }),
          mimeType: 'video/mp4',
        };

        // Handle thumbnail
        if (video.thumbnailUrl) {
          try {
            if (video.thumbnailUrl.includes(video.r2Bucket)) {
              // R2-hosted thumbnail - generate presigned URL
              const thumbnailKey = video.thumbnailUrl.split('/').pop();
              const signedThumbnail = await generatePresignedUrl(
                `thumbnails/${thumbnailKey}`,
                video.r2Bucket,
                86400
              );
              mediaItem.thumbnail = signedThumbnail;
              console.log(`     ✓ Thumbnail signed (R2-hosted)`);
            } else {
              // External URL
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
    // STEP 6: Platform-Specific Validation
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

      // Add platformSpecificData with threadItems structure
      if (p.platformSpecificData && Object.keys(p.platformSpecificData).length > 0) {
        console.log(`      ✓ Platform-specific data:`, JSON.stringify(p.platformSpecificData, null, 8));
        
        // Build threadItems for video posts
        if (mediaItems.length > 0) {
          const threadItems = mediaItems.map((media) => ({
            content: p.customContent || content || '',
            mediaItems: [media],
          }));

          platformPayload.platformSpecificData = {
            threadItems,
            ...p.platformSpecificData, // Merge other platform-specific settings
          };
        } else {
          platformPayload.platformSpecificData = p.platformSpecificData;
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
    console.log(JSON.stringify(latePayload, null, 2));

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
      body: JSON.stringify(latePayload),
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
    // STEP 9: Save to Database
    // ========================================================================
    console.log(`\n📋 [${requestId}] STEP 9: Saving to Database`);

    let savedPost = null;
    try {
      savedPost = await prisma.socialPost.create({
        data: {
          latePostId: lateResult._id || lateResult.id,
          companyId: companyId,
          socialAccountId: platforms[0]?.accountId, // First platform's accountId
          ...(videoIds[0] && { videoId: videoIds[0] }),
          title: title || null,
          content: content || null,
          status: isDraft ? 'DRAFT' : publishNow ? 'PUBLISHING' : 'SCHEDULED',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          timezone: timezone,
          tags: normTags,
          hashtags: normHashtags,
          mentions: normMentions,
          platformConfig: latePayload, // Store entire config for reference
          metadata: {
            ...lateResult,
            requestId,
            platforms: platformTypes,
          },
        },
      });

      console.log(`✅ [${requestId}] Post saved to database - ID: ${savedPost.id}`);
    } catch (dbError) {
      console.error(`⚠️ [${requestId}] Database save failed (non-fatal):`, dbError.message);
      // Don't fail the request if DB save fails
    }

    // ========================================================================
    // STEP 10: Success Response
    // ========================================================================
    const responseMessage = isDraft
      ? 'Draft saved successfully'
      : publishNow
      ? `Post is being published to ${platformTypes.length} platform(s)`
      : `Post scheduled for ${new Date(scheduledFor).toLocaleString()}`;

    console.log(`\n✅ [${requestId}] REQUEST COMPLETED SUCCESSFULLY`);
    console.log(`📊 [${requestId}] Summary:`);
    console.log(`   - Platforms: ${platformTypes.join(', ')}`);
    console.log(`   - Videos: ${videoIds.length}`);
    console.log(`   - Status: ${isDraft ? 'DRAFT' : publishNow ? 'PUBLISHING' : 'SCHEDULED'}`);
    console.log(`   - Late Post ID: ${lateResult._id || lateResult.id}`);
    console.log(`   - Local Post ID: ${savedPost?.id || 'N/A'}`);
    console.log(`   - Total Time: ${Date.now() - parseInt(requestId.split('-')[1])}ms`);
    console.log('='.repeat(80) + '\n');

    return NextResponse.json(
      {
        success: true,
        post: lateResult,
        localPostId: savedPost ? savedPost.id : undefined,
        message: responseMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          requestId,
          responseTime: `${Date.now() - parseInt(requestId.split('-')[1])}ms`,
          lateResponseTime: `${lateResponseTime}ms`,
        } : undefined,
      },
      { status: 201 }
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

    // Fetch profile with connected accounts
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

    // Get recent posts count
    const recentPostsCount = await prisma.socialPost.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
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
        maxVideoDuration: 3600, // 1 hour (in seconds)
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        supportedFormats: ['mp4', 'mov', 'avi', 'webm'],
        presignedUrlExpiry: 86400, // 24 hours
        maxVideosPerPost: 10,
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
