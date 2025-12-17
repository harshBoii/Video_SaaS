// app/api/documents/[id]/versions/activate/route.js
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";

export async function POST(request, { params }) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { version: versionNumber } = body;

    if (!versionNumber) {
      return NextResponse.json(
        { success: false, error: "Version number is required" },
        { status: 400 }
      );
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, currentVersion: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify version exists
    const versionToActivate = await prisma.documentVersion.findUnique({
      where: {
        documentId_version: {
          documentId: id,
          version: versionNumber,
        },
      },
    });

    if (!versionToActivate) {
      return NextResponse.json(
        { success: false, error: `Version ${versionNumber} not found` },
        { status: 404 }
      );
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Deactivate all versions
      await tx.documentVersion.updateMany({
        where: { documentId: id },
        data: { isActive: false },
      });

      // Activate the selected version
      await tx.documentVersion.update({
        where: { id: versionToActivate.id },
        data: { isActive: true },
      });

      // Update document's current version
      await tx.document.update({
        where: { id },
        data: { currentVersion: versionNumber },
      });
    });

    console.log(`✅ [VERSION ACTIVATED] Document ${id} version ${versionNumber}`);

    return NextResponse.json({
      success: true,
      message: `Version ${versionNumber} activated successfully`,
      version: versionNumber,
    });

  } catch (error) {
    console.error("❌ [ACTIVATE VERSION ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to activate version" },
      { status: 500 }
    );
  }
}
