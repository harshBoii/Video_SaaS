import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, adminId, teamId, status } = body;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(adminId && { adminId }),
        ...(teamId && { teamId }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        admin: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Campaign PUT error:", err);
    return NextResponse.json({ success: false, message: "Failed to update campaign." }, { status: 500 });
  }
}
