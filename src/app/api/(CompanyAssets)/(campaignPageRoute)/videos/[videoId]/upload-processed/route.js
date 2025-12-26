import { NextResponse } from "next/server";
import { verifyJWT } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { r2 } from "@/app/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60;

export async function POST(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;
    const formData = await request.formData();
    console.log("Form data is :",formData)
    const videoFile = formData.get('video');
    const versionNote = formData.get('versionNote');
    const editMode = formData.get('editMode');
    const editMetadata = JSON.parse(formData.get('editMetadata') || '{}');

    if (!videoFile || !versionNote) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const video = await prisma.video.findFirst({
      where: { id, campaign: { companyId: user.companyId } },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        campaign: { select: { id: true, companyId: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextVersion = (video.versions[0]?.version || 0) + 1;
    const newR2Key = `videos/${video.campaign.companyId}/${video.id}/v${nextVersion}_${Date.now()}.mp4`;
    const buffer = Buffer.from(await videoFile.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: newR2Key,
      Body: buffer,
      ContentType: 'video/mp4',
    }));

    const newVersion = await prisma.videoVersion.create({
      data: {
        videoId: video.id,
        version: nextVersion,
        status: 'ready',
        isActive: false,
        versionNote: versionNote.trim(),
        uploadedBy: user.id,
        fileSize: BigInt(buffer.length),
        r2Key: newR2Key,
        metadata: { editMode, ...editMetadata, processedInBrowser: true },
      },
    });

    await prisma.streamQueue.upsert({
      where: { videoId: video.id },
      update: { r2Key: newR2Key, status: 'PENDING', attempts: 0 },
      create: { videoId: video.id, r2Key: newR2Key, status: 'PENDING' },
    });

    await prisma.video.update({
      where: { id: video.id },
      data: { currentVersion: nextVersion },
    });

    return NextResponse.json({
      success: true,
      version: { id: newVersion.id, version: nextVersion, r2Key: newR2Key },
      video: { id: video.id, title: video.title, currentVersion: nextVersion },
    });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
