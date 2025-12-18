import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/app/lib/r2";
export async function GET(request) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const campaignId = searchParams.get("campaignId");
    const documentType = searchParams.get("documentType");
    const status = searchParams.get("status") || "ready";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where = {
      status,
      ...(campaignId && { campaignId }),
      ...(documentType && { documentType }),  // ✅ Fixed
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { filename: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Execute queries
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          uploader: {
            select: {
              id: true,
              firstName: true,  // ✅ Fixed: Schema has firstName/lastName
              lastName: true,
              email: true,
              avatarUrl: true,  // ✅ Fixed: Schema has avatarUrl not profilePicture
            },
          },
          shareSettings: {
            select: {
              id: true,
              accessType: true,
            },
          },
          _count: {
            select: {
              comments: true,
              versions: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    // Format response
        const formattedDocuments = await Promise.all(
        documents.map(async (doc) => {
            
        // Generate signed URL for viewing (valid for 4 hours)
        // const command = new GetObjectCommand({
        //   Bucket: doc.r2Bucket,
        //   Key: doc.r2Key,
        //   ResponseContentType: doc.mimeType,
        // });

        // const viewUrl = await getSignedUrl(r2, command, { expiresIn: 14400 });

        const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${doc.id}/proxy`;


        return {
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          fileSize: Number(doc.fileSize),
          fileSizeFormatted: formatBytes(doc.fileSize),
          documentType: doc.documentType,
          mimeType: doc.mimeType,
          status: doc.status,
          r2Key: doc.r2Key,
          r2Bucket: doc.r2Bucket,
          thumbnailUrl: doc.thumbnailUrl,
          viewUrl: viewUrl,  // ✅ ADD THIS - Signed URL for viewing
          pageCount: doc.pageCount,
          tags: doc.tags,
          currentVersion: doc.currentVersion,
          campaign: doc.campaign,
          uploader: {
            id: doc.uploader.id,
            name: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
            email: doc.uploader.email,
            avatarUrl: doc.uploader.avatarUrl,
          },
          isShared: !!doc.shareSettings,
          shareAccessType: doc.shareSettings?.accessType,
          commentsCount: doc._count.comments,
          versionsCount: doc._count.versions,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      })
    );


    return NextResponse.json({
      success: true,
      data: formattedDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });

  } catch (error) {
    console.error("❌ [DOCUMENTS LIST ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
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
