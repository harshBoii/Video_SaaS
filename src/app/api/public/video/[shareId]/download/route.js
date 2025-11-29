import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2 } from '@/app/lib/r2';

export async function GET(request, { params }) {
  try {
    const { shareId } = await params;

    // Find the shared link
    const sharedLink = await prisma.sharedVideoLink.findUnique({
      where: { shareId },
      include: {
        video: {
          select: {
            id: true,
            r2Key: true,
            filename: true,
          }
        }
      }
    });

    if (!sharedLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check if downloads are allowed
    if (!sharedLink.allowDownload) {
      return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 });
    }

    // Check expiration
    if (sharedLink.expiresAt && new Date() > sharedLink.expiresAt) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 });
    }

    // Generate signed R2 URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: sharedLink.video.r2Key,
      ResponseContentDisposition: `attachment; filename="${sharedLink.video.filename}"`,
    });

    const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename: sharedLink.video.filename
    });

  } catch (error) {
    console.error('Download Error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
