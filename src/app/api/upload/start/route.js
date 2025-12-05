// app/api/upload/start/route.js
import { NextResponse } from "next/server";
import { z } from "zod";
import { r2 } from "@/app/lib/r2";
import { CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

// Validation schema
const startUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().positive("File size must be positive"),
  campaignId: z.string().cuid("Invalid campaign ID"),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

export async function POST(request) {
  try {
    // ✅ 1. Verify user authentication
    const { employee: currentUser, error: authError } = await verifyJWT(request);
    if (authError) {
      console.error("[UPLOAD START] Auth failed:", authError);
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    // ✅ 2. Parse and validate request body
    const body = await request.json();
    console.log("[UPLOAD START] User:", currentUser.email, "File:", body.fileName);

    const validation = startUploadSchema.safeParse(body);

    if (!validation.success) {
      console.error("[UPLOAD START] Validation failed:", validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize, campaignId, metadata } = validation.data;

    // ✅ 3. Verify campaign exists and user has access
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: campaignId,
        companyId: currentUser.companyId, 
      },
    });

    if (!campaign) {
      console.error("[UPLOAD START] Campaign not found:", campaignId);
      return NextResponse.json(
        { success: false, error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // ✅ 4. Generate unique R2 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${campaignId}/${timestamp}-${sanitizedFileName}`;

    // ✅ 5. Calculate multipart upload parts
    const partSize = 10 * 1024 * 1024; // 10MB per part
    const totalParts = Math.ceil(fileSize / partSize);

    console.log(`[UPLOAD START] File: ${fileName}`);
    console.log(`[UPLOAD START] Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[UPLOAD START] Parts: ${totalParts}`);

    // ✅ 6. Create multipart upload in R2
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        originalName: encodeURIComponent(fileName),
        campaignId: campaignId,
        uploaderId: currentUser.id,
        uploaderEmail: currentUser.email,
        ...(metadata?.title && { title: metadata.title }),
        ...(metadata?.description && { description: metadata.description }),
      },
    });

    const multipartUpload = await r2.send(createCommand);
    const uploadId = multipartUpload.UploadId;

    if (!uploadId) {
      throw new Error("Failed to initialize multipart upload in R2");
    }

    console.log(`[UPLOAD START] R2 Upload ID: ${uploadId}`);

    // ✅ 7. Generate presigned URLs for each part
    const urls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const signedUrl = await getSignedUrl(r2, uploadPartCommand, {
        expiresIn: 3600, // 1 hour to upload each part
      });

      urls.push({
        partNumber,
        url: signedUrl,
      });
    }

    console.log(`[UPLOAD START] Generated ${urls.length} presigned URLs`);

    // ✅ 8. Create upload session in database (SYNCED WITH YOUR SCHEMA)
    const uploadSession = await prisma.uploadSession.create({
      data: {
        // R2 Info
        uploadId,
        key,
        
        // File Info
        fileName,
        fileSize: BigInt(fileSize),
        fileType,
        
        // Upload Progress
        totalParts,
        uploadedParts: [], // Empty array (will be filled as parts upload)
        
        // Status
        status: "IN_PROGRESS", // String, not enum
        
        // Relations (CORRECT FIELD NAMES)
        campaignId,  // Direct field
        uploadedBy: currentUser.id,  // Direct field (not uploaderId)
        
        // Timestamps
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        // createdAt, updatedAt auto-set by Prisma
      },
    });

    console.log(`✅ [UPLOAD START] Session created: ${uploadSession.id}`);


    return NextResponse.json({
      success: true,
      upload: {
        uploadId,
        key,
        partSize,
        totalParts,
        sessionId: uploadSession.id,
      },
      urls,
      message: "Upload initialized successfully",
    });

  } catch (error) {
    console.error("❌ [UPLOAD START ERROR]", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Upload initialization failed",
        message: process.env.NODE_ENV === "development" ? error.message : "An error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
