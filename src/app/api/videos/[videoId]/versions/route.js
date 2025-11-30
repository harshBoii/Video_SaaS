// app/api/videos/[videoId]/versions/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ✅ GET - Fetch all versions
// ✅ GET - Fetch all versions OR single version by number
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;
    
    // ✅ Check for version query parameter
    const { searchParams } = new URL(request.url);
    const versionNumber = searchParams.get('version');

    // Fetch video to check access
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        currentVersion: true,
        campaignId: true,
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // ✅ IF VERSION NUMBER PROVIDED - Return single version
    if (versionNumber) {
      const versionNum = parseInt(versionNumber, 10);
      
      if (isNaN(versionNum) || versionNum < 1) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid version number',
            message: 'Version must be a positive integer'
          },
          { status: 400 }
        );
      }

      // Fetch specific version
      const version = await prisma.videoVersion.findUnique({
        where: {
          videoId_version: {
            videoId: videoId,
            version: versionNum,
          }
        },
        include: {
          uploader: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!version) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Version not found',
            message: `Version ${versionNum} does not exist for this video`
          },
          { status: 404 }
        );
      }

      // Return single version
      return NextResponse.json({
        success: true,
        version: {
          id: version.id,
          version: version.version,
          r2Key: version.r2Key,
          fileSize: version.fileSize.toString(),
          fileSizeFormatted: formatBytes(version.fileSize),
          status: version.status,
          versionNote: version.versionNote,
          isActive: version.isActive,
          streamId: version.streamId,
          playbackUrl: version.playbackUrl,
          createdAt: version.createdAt,
          uploaderName: `${version.uploader.firstName} ${version.uploader.lastName}`,
          uploader: version.uploader,
        },
        video: {
          id: video.id,
          title: video.title,
          currentVersion: video.currentVersion,
          campaign: video.campaign,
        },
      });
    }

    // ✅ OTHERWISE - Return all versions (existing logic)
    const versions = await prisma.videoVersion.findMany({
      where: { videoId },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });

    // Format versions
    const formattedVersions = versions.map(v => ({
      id: v.id,
      version: v.version,
      r2Key: v.r2Key,
      fileSize: v.fileSize.toString(),
      fileSizeFormatted: formatBytes(v.fileSize),
      status: v.status,
      versionNote: v.versionNote,
      isActive: v.isActive,
      streamId: v.streamId,
      playbackUrl: v.playbackUrl,
      createdAt: v.createdAt,
      uploaderName: `${v.uploader.firstName} ${v.uploader.lastName}`,
      uploader: v.uploader,
    }));

    return NextResponse.json({
      success: true,
      versions: formattedVersions,
      currentVersion: video.currentVersion,
      video: {
        id: video.id,
        title: video.title,
        campaign: video.campaign,
      },
    });
  } catch (error) {
    console.error('[VERSIONS GET ERROR]', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch versions',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ POST - Create new version with upload URLs
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;
    const body = await request.json();

    const { versionNote, fileSize, fileName, fileType } = body;

    // Validate required fields
    if (!versionNote || !fileSize || !fileName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['versionNote', 'fileSize', 'fileName'],
        },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, campaignId: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get latest version number
    const latestVersion = await prisma.videoVersion.findFirst({
      where: { videoId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersionNumber = (latestVersion?.version || 0) + 1;

    // Generate R2 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const r2Key = `videos/${videoId}/versions/v${newVersionNumber}-${timestamp}-${sanitizedFileName}`;

    console.log(`[VERSION CREATE] Creating version ${newVersionNumber} for video ${videoId}`);

    // Create multipart upload in R2
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: fileType || 'video/mp4',
    });

    const multipartUpload = await s3Client.send(createMultipartUploadCommand);

    // Calculate parts and generate presigned URLs
    const partSize = 100 * 1024 * 1024; // 100MB
    const totalParts = Math.ceil(fileSize / partSize);

    const uploadUrls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        PartNumber: partNumber,
        UploadId: multipartUpload.UploadId,
      });

      const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
        expiresIn: 3600, // 1 hour
      });

      uploadUrls.push({
        partNumber,
        url: presignedUrl,
      });
    }

    // Create version record
    const version = await prisma.videoVersion.create({
      data: {
        videoId,
        version: newVersionNumber,
        r2Key,
        fileSize: BigInt(fileSize),
        status: 'uploading',
        versionNote,
        uploadedBy: decoded.id,
      },
    });

    // ✅ Calculate expiresAt (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // ✅ Create upload session with ALL required fields
    const uploadSession = await prisma.uploadSession.create({
      data: {
        uploadId: multipartUpload.UploadId,
        campaignId: video.campaignId,
        key: r2Key, // Note: schema uses 'key', not 'r2Key'
        fileName,
        fileSize: BigInt(fileSize),
        fileType: fileType || 'video/mp4', // ✅ Required field
        totalParts,
        uploadedParts: [], // ✅ Json array (empty initially)
        status: 'IN_PROGRESS', // ✅ Match schema default
        uploadedBy: decoded.id,
        expiresAt, // ✅ Required field
        metadata: JSON.stringify({ // ✅ Convert to string if schema expects String
          versionId: version.id,
          versionNumber: newVersionNumber,
          isVersion: true,
        }),
      },
    });

    console.log(`[VERSION CREATE] Version ${newVersionNumber} created: ${version.id}`);
    console.log(`[VERSION CREATE] Upload session created: ${uploadSession.id}`);

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        version: version.version,
        versionNote: version.versionNote,
        fileSize: version.fileSize.toString(),
        status: version.status,
      },
      upload: {
        uploadId: multipartUpload.UploadId,
        key: r2Key,
        partSize,
        totalParts,
      },
      urls: uploadUrls,
    });
  } catch (error) {
    console.error('[VERSION CREATE ERROR]', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create version',
      },
      { status: 500 }
    );
  }
}

// Helper function
function formatBytes(bytes) {
  if (!bytes || bytes === 0 || bytes === 0n) return '0 Bytes';
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
