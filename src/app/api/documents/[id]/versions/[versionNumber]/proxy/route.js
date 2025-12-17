// app/api/documents/[id]/versions/[versionNumber]/proxy/route.js
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

    const { id, versionNumber } = await params;

    // ✅ Fetch version details with access check
    const version = await prisma.documentVersion.findUnique({
      where: {
        documentId_version: {
          documentId: id,
          version: parseInt(versionNumber, 10),
        },
      },
      select: {
        id: true,
        r2Key: true,
        status: true,
        document: {
          select: {
            id: true,
            r2Bucket: true,
            mimeType: true,
            filename: true,
            campaignId: true,
            campaign: {
              select: {
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Version not found" },
        { status: 404 }
      );
    }

    // ✅ Verify user has access to this campaign/company
    if (version.document.campaign.companyId !== user.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // ✅ Optional: Log access for audit trail
    console.log(`[VERSION ACCESS] User ${user.id} accessed version ${versionNumber} of document ${id}`);

    // ✅ Fetch from R2
    const command = new GetObjectCommand({
      Bucket: version.document.r2Bucket,
      Key: version.r2Key, // ✅ Use version's r2Key
    });

    const r2Response = await r2.send(command);

    // ✅ Stream directly without buffering
    return new Response(r2Response.Body, {
      status: 200,
      headers: {
        'Content-Type': version.document.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="v${versionNumber}-${encodeURIComponent(version.document.filename)}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'private, max-age=3600', // ✅ Private cache since auth required
        'X-Document-Version': versionNumber, // ✅ Custom header for tracking
      },
    });

  } catch (error) {
    console.error("❌ [VERSION PROXY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to proxy version" },
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
