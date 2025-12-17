import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// app/api/documents/[id]/versions/route.js
export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = await params;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formattedVersions = versions.map(v => ({
      id: v.id,
      version: v.version,
      fileSize: Number(v.fileSize),
      fileSizeFormatted: formatBytes(v.fileSize),
      status: v.status,
      isActive: v.isActive,
      versionNote: v.versionNote,
      r2Key: v.r2Key,
      // ✅ Use proxy URL for each version
      viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${id}/versions/${v.version}/proxy`,
      uploader: {
        id: v.uploader.id,
        name: `${v.uploader.firstName} ${v.uploader.lastName}`,
        email: v.uploader.email,
        avatarUrl: v.uploader.avatarUrl,
      },
      createdAt: v.createdAt,
    }));

    console.log("Response :",formattedVersions)

    return NextResponse.json({
      success: true,
      data: formattedVersions,
    });
  } catch (error) {
    console.error("❌ [VERSIONS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}


export async function POST(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json(); 

    const { versionNote, fileSize, fileName, fileType } = body;

    if (!versionNote || !fileSize || !fileName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: ["versionNote", "fileSize", "fileName"],
        },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { 
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!document) {
      return NextResponse.json({ 
        success: false, 
        error: "Document not found" 
      }, { status: 404 });
    }

    const nextVersion = (document.versions[0]?.version || 0) + 1;

    // Generate R2 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `documents/${id}/v${nextVersion}-${timestamp}-${sanitizedFileName}`;

    console.log(`[VERSION CREATE] Creating version ${nextVersion} for document ${id}`);

    // Create multipart upload
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        ContentType: fileType || "application/octet-stream",
      })
    );

    // Generate presigned URLs
    const partSize = 100 * 1024 * 1024; // 100MB
    const totalParts = Math.ceil(fileSize / partSize);

    const uploadUrls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const presignedUrl = await getSignedUrl(
        s3Client,
        new UploadPartCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          PartNumber: partNumber,
          UploadId: multipartUpload.UploadId,
        }),
        { expiresIn: 3600 }
      );

      uploadUrls.push({ partNumber, url: presignedUrl });
    }

    // Create version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        r2Key,
        fileSize: BigInt(fileSize),
        uploadedBy: user.id,
        versionNote,
        status: "uploading",
      },
    });

    // Create upload session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.uploadSession.create({
      data: {
        uploadId: multipartUpload.UploadId,
        campaignId: document.campaignId, 
        key: r2Key,
        fileName,
        fileSize: BigInt(fileSize),
        fileType: fileType || "application/octet-stream",
        totalParts,
        uploadedParts: [],
        status: "IN_PROGRESS",
        uploadedBy: user.id,
        expiresAt,
        metadata: JSON.stringify({
          versionId: version.id,
          versionNumber: nextVersion,
          isDocumentVersion: true,
          documentId: id,
        }),
      },
    });

    console.log(`✅ [VERSION CREATE] Version ${nextVersion} created: ${version.id}`);

    // ✅ Return flat structure (not nested under "data")
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
    console.error("❌ [VERSION CREATE ERROR]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to create version" 
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  const numBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
