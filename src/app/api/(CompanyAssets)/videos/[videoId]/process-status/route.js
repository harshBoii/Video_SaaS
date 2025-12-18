import { NextResponse } from "next/server";
import { verifyJWT } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { employee: user } = await verifyJWT(request);
    const { videoId : id } = await params;

    const version = await prisma.videoVersion.findFirst({
      where: {
        id,
        video: {
          campaign: { companyId: user.companyId },
        },
      },
      select: {
        id: true,
        status: true,
        metadata: true,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: version.status,
      metadata: version.metadata,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
