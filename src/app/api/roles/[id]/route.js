import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// PUT → Rename or update role
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();

    const updated = await prisma.role.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating role:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE → Remove role and related RolePermissions
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Cascade delete role-permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Then delete the role
    // await prisma.role.update({
    //   where: { id },
    //   data: {
    //     isDeleted: true,
    //   },
    // });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
