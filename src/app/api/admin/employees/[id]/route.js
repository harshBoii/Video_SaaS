import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { firstName, lastName, roleId, status,is_admin } = body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Employee not found." }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(roleId && { roleId }),
        ...(status && { status }),
        ...(typeof is_admin === 'boolean' && { is_admin }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lastLogin: true,
        role: { select: { name: true } },
        campaigns: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Employee PUT error:", err);
    return NextResponse.json({ success: false, message: "Failed to update employee." }, { status: 500 });
  }
}
