import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

// GET - Get share settings
export async function GET(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;

    const shareSettings = await prisma.documentShare.findUnique({
      where: { documentId: id },
    });

    if (!shareSettings) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Document is not shared",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shareSettings.id,
        accessType: shareSettings.accessType,
        allowComments: shareSettings.allowComments,
        allowDownload: shareSettings.allowDownload,
        hasPassword: !!shareSettings.passwordHash,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/document/${shareSettings.id}`,
        createdAt: shareSettings.createdAt,
        updatedAt: shareSettings.updatedAt,
      },
    });

  } catch (error) {
    console.error("❌ [SHARE GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch share settings" },
      { status: 500 }
    );
  }
}

// POST - Create or update share settings
export async function POST(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate document exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Hash password if provided
    let passwordHash = null;
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Upsert share settings
    const shareSettings = await prisma.documentShare.upsert({
      where: { documentId: id },
      update: {
        accessType: body.accessType || "PUBLIC",
        passwordHash: passwordHash,
        allowComments: body.allowComments ?? true,
        allowDownload: body.allowDownload ?? true,
      },
      create: {
        documentId: id,
        accessType: body.accessType || "PUBLIC",
        passwordHash: passwordHash,
        allowComments: body.allowComments ?? true,
        allowDownload: body.allowDownload ?? true,
      },
    });

    console.log(`✅ [DOCUMENT SHARED] ID: ${id} | User: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Share settings updated successfully",
      data: {
        id: shareSettings.id,
        accessType: shareSettings.accessType,
        allowComments: shareSettings.allowComments,
        allowDownload: shareSettings.allowDownload,
        hasPassword: !!shareSettings.passwordHash,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/document/${shareSettings.id}`,
      },
    });

  } catch (error) {
    console.error("❌ [SHARE CREATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

// DELETE - Remove share settings
export async function DELETE(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;

    await prisma.documentShare.delete({
      where: { documentId: id },
    });

    console.log(`✅ [SHARE DELETED] Document ID: ${id} | User: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Share link removed successfully",
    });

  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Share settings not found" },
        { status: 404 }
      );
    }

    console.error("❌ [SHARE DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove share link" },
      { status: 500 }
    );
  }
}
