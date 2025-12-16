import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/app/lib/r2";

export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;

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
      uploader: {
        id: v.uploader.id,
        name: `${v.uploader.firstName} ${v.uploader.lastName}`,
        email: v.uploader.email,
        avatarUrl: v.uploader.avatarUrl,
      },
      createdAt: v.createdAt,
    }));

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

    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const nextVersion = (document.versions[0]?.version || 0) + 1;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const r2Key = `documents/${id}/v${nextVersion}-${file.name}`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type,
    }));

    // Create version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        r2Key,
        r2Bucket: process.env.R2_BUCKET_NAME,
        fileSize: buffer.length,
        uploaderId: user.id,
        versionNote: 'Edited via Google Drive',
      }
    });

    // Update document current version
    await prisma.document.update({
      where: { id },
      data: { currentVersion: nextVersion }
    });

    return NextResponse.json({
      success: true,
      data: { version }
    });

  } catch (error) {
    console.error("❌ [VERSION CREATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create version" },
      { status: 500 }
    );
  }
}


function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
