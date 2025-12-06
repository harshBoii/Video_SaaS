import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const { collectionId } = await params;

    // Find collection by ID (UUID)
    const collection = await prisma.videoCollection.findUnique({
      where: { id: collectionId },
      include: {
        shareSettings: true,
        videos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                duration: true,
                status: true,
                playbackUrl: true,
                streamId: true,
                shareSettings: {
                  select: { id: true }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        creator: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    const shareSettings = collection.shareSettings;

    // Check expiration
    if (shareSettings?.expiresAt && new Date(shareSettings.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Collection link has expired' },
        { status: 410 }
      );
    }

    // Check if password required
    if (shareSettings?.accessType === 'PASSWORD') {
      return NextResponse.json({
        success: false,
        reason: 'PASSWORD_REQUIRED',
        collection: {
          id: collection.id,
          name: collection.name,
          videoCount: collection.videos.length
        }
      }, { status: 403 });
    }

    // Return full collection data
    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        allowComments: shareSettings?.allowComments ?? true,
        allowDownload: shareSettings?.allowDownload ?? false,
        videoCount: collection.videos.length,
        createdBy: `${collection.creator.firstName} ${collection.creator.lastName}`
      },
      videoShares: collection.videos
        .filter(item => item.video.status === 'ready')
        .map(item => ({
          shareId: item.video.shareSettings?.id || item.video.id, // Use VideoShare ID or video ID
          videoId: item.video.id,
          video: {
            id: item.video.id,
            title: item.video.title,
            thumbnailUrl: item.video.thumbnailUrl,
            duration: item.video.duration,
            streamId: item.video.streamId,
            playbackUrl: item.video.playbackUrl
          }
        }))
    });

  } catch (error) {
    console.error('[PUBLIC COLLECTION ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load collection' },
      { status: 500 }
    );
  }
}

// Password verification
export async function POST(request, { params }) {
  try {
    const { collectionId } = await params;
    const { password } = await request.json();

    const collection = await prisma.videoCollection.findUnique({
      where: { id: collectionId },
      include: {
        shareSettings: true,
        videos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                duration: true,
                status: true,
                playbackUrl: true,
                streamId: true,
                shareSettings: { select: { id: true } }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        creator: { select: { firstName: true, lastName: true } }
      }
    });

    if (!collection || !collection.shareSettings) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    const shareSettings = collection.shareSettings;

    // Verify password
    if (shareSettings.accessType === 'PASSWORD' && shareSettings.passwordHash) {
      const isValid = await bcrypt.compare(password, shareSettings.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Return full data after password verification
    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        allowComments: shareSettings.allowComments,
        allowDownload: shareSettings.allowDownload,
        videoCount: collection.videos.length
      },
      videoShares: collection.videos
        .filter(item => item.video.status === 'ready')
        .map(item => ({
          shareId: item.video.shareSettings?.id || item.video.id,
          videoId: item.video.id,
          video: {
            id: item.video.id,
            title: item.video.title,
            thumbnailUrl: item.video.thumbnailUrl,
            duration: item.video.duration,
            streamId: item.video.streamId,
            playbackUrl: item.video.playbackUrl
          }
        }))
    });

  } catch (error) {
    console.error('[COLLECTION VERIFY ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
