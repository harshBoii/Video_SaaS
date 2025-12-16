import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
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
        r2Key: true,
        r2Bucket: true,
        mimeType: true,
        filename: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: document.r2Bucket,
      Key: document.r2Key,
    });

    const r2Response = await r2.send(command);

    // ✅ Stream directly without buffering
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
