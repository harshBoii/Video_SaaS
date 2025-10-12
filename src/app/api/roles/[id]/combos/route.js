import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

/**
 * POST /api/roles/[roleId]/combos
 * Body: { comboId: string }
 *
 * Attaches all permissions from the combo to the specified role.
 */
export async function POST(req, { params }) {
  try {

    const {id:roleId} = await params;
    const { comboId } = await req.json();

    if (!roleId || !comboId) {
      return NextResponse.json(
        { error: "roleId and comboId are required" },
        { status: 400 }
      );
    }

    // ✅ Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // ✅ Fetch all permissions in the combo
    const combo = await prisma.permissionCombo.findUnique({
      where: { id: comboId },
      include: { permissions: true },
    });


    if (!combo) {
      return NextResponse.json({ error: "Combo not found" }, { status: 404 });
    }

    const permissionIds = combo.permissions.map((p) => p.permissionId);
    if (permissionIds.length === 0) {
      return NextResponse.json(
        { error: "This combo has no permissions" },
        { status: 400 }
      );
    }

    // ✅ Create RolePermission links
    const dataToInsert = permissionIds.map((pid) => ({
      roleId,
      permissionId: pid,
    }));

    await prisma.rolePermission.createMany({
      data: dataToInsert,
      skipDuplicates: true, // avoids duplicates
    });

    // ✅ Return updated role with its permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return NextResponse.json({
      id: updatedRole.id,
      name: updatedRole.name,
      permissions: updatedRole.permissions.map((rp) => rp.permission),
    });
  } catch (err) {
    console.error("POST /api/roles/[roleId]/combos error:", err);
    return NextResponse.json(
      { error: "Failed to assign combo to role" },
      { status: 500 }
    );
  }
}
