import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const {
      name,
      description,
      accessType,
      password,
      allowComments,
      allowDownload,
      expiresAt,
      videoIds,
      campaignId
    } = await request.json();

    // Validation
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one video required' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Verify videos exist and belong to user's company
    const videos = await prisma.video.findMany({
      where: {
        id: { in: videoIds },
        campaign: { companyId: user.companyId }
      },
      select: { id: true }
    });

    if (videos.length !== videoIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more videos not found or unauthorized' },
        { status: 403 }
      );
    }

    // Hash password if provided
    const passwordHash = accessType === 'PASSWORD' && password?.trim()
      ? await bcrypt.hash(password.trim(), 10)
      : null;

    // ✅ ATOMIC TRANSACTION - All or nothing
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Create VideoCollection
      const collection = await tx.videoCollection.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          createdBy: user.id,
          companyId: user.companyId,
          campaignId: campaignId || null
        }
      });

      // 2. Create VideoCollectionItems (junction records)
      await tx.videoCollectionItem.createMany({
        data: videoIds.map((videoId, index) => ({
          collectionId: collection.id,
          videoId,
          order: index
        }))
      });

      // 3. Create CollectionShare (share settings)
      const collectionShare = await tx.collectionShare.create({
        data: {
          collectionId: collection.id,
          accessType: accessType || 'PUBLIC',
          passwordHash,
          allowComments: Boolean(allowComments),
          allowDownload: Boolean(allowDownload),
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });

      // 4. Create/Update VideoShare for EACH video (for individual access)
      const videoShares = await Promise.all(
        videoIds.map(async (videoId) => {
          // Use upsert since VideoShare has unique videoId constraint
          return tx.videoShare.upsert({
            where: { videoId },
            update: {
              // Update existing share to match collection settings
              allowComments: Boolean(allowComments),
              allowDownload: Boolean(allowDownload),
              accessType: 'PUBLIC' // Collection handles password
            },
            create: {
              videoId,
              accessType: 'PUBLIC',
              allowComments: Boolean(allowComments),
              allowDownload: Boolean(allowDownload)
            }
          });
        })
      );

      return { collection, collectionShare, videoShares };
    });

    // Build share URL using collection ID (which is UUID)
    const shareUrl = `${process.env.NEXT_PUBLIC_URL}/share/collection/${result.collection.id}`;

    return NextResponse.json({
      success: true,
      data: {
        collectionId: result.collection.id,
        shareId: result.collectionShare.id,
        shareUrl,
        videoShares: result.videoShares.map(share => ({
          shareId: share.id,
          videoId: share.videoId
        })),
        videoCount: videoIds.length
      }
    });

  } catch (error) {
    console.error('[COLLECTION CREATE ERROR]', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry found' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid reference - video or campaign not found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
