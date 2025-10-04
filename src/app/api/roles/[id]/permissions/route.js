import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// POST → Assign a permission to a role
export async function POST(request, { params }) {
  try {
    const { id: roleId } = params;
    const { permissionId } = await request.json();

    if (!permissionId) {
      return NextResponse.json({ error: 'permissionId required' }, { status: 400 });
    }

    // Ensure both exist
    const [role, permission] = await Promise.all([
      prisma.role.findUnique({ where: { id: roleId } }),
      prisma.permission.findUnique({ where: { id: permissionId } }),
    ]);

    if (!role || !permission) {
      return NextResponse.json({ error: 'Invalid role or permission' }, { status: 404 });
    }

    // Link permission to role if not already linked
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: { roleId, permissionId },
    });

    return NextResponse.json({ message: 'Permission added to role' });
  } catch (err) {
    console.error('Error assigning permission:', err);
    return NextResponse.json({ error: 'Failed to assign permission' }, { status: 500 });
  }
}
