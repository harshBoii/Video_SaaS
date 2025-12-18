// app/api/documents/[id]/proxy/route.js
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/app/lib/r2";

export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        r2Key: true,
        r2Bucket: true,
        mimeType: true,
        filename: true,
        thumbnailUrl: true,
        documentType: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // ✅ Check if thumbnailUrl exists
    if (!document.thumbnailUrl) {
      // ✅ Check if it's an image
      if (document.mimeType?.startsWith('image/') || document.documentType === 'IMAGE') {
        console.log(`📸 Generating presigned URL for image: ${document.id}`);
        
        // Generate presigned URL with 1 year expiry
        const command = new GetObjectCommand({
          Bucket: document.r2Bucket,
          Key: document.r2Key,
        });

        const presignedUrl = await getSignedUrl(r2, command, {
          expiresIn: 604800, // 365 days in seconds
        });

        // ✅ Update DB with the presigned URL
        await prisma.document.update({
          where: { id },
          data: { thumbnailUrl: presignedUrl }
        });

        console.log(`✅ Cached presigned URL for document: ${document.id}`);

        // Redirect to the presigned URL
        return NextResponse.redirect(presignedUrl, 302);
      }
    }

    // ✅ If thumbnailUrl exists, redirect directly to it
    if (document.thumbnailUrl) {
      return NextResponse.redirect(document.thumbnailUrl, 302);
    }

    // ✅ For non-images (docs, PDFs, etc.), stream directly from R2
    console.log(`📄 Streaming document from R2: ${document.id}`);
    
    const command = new GetObjectCommand({
      Bucket: document.r2Bucket,
      Key: document.r2Key,
    });

    const r2Response = await r2.send(command);

    return new Response(r2Response.Body, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(document.filename)}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error("❌ [DOCUMENT PROXY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to proxy document" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
