import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id:roleId } = await params;
    const body = await request.json();
    const { parentId } = body;

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    if (parentId !== null && typeof parentId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid parent ID' },
        { status: 400 }
      );
    }

    if (roleId === parentId) {
      return NextResponse.json(
        { error: 'A role cannot be its own parent' },
        { status: 400 }
      );
    }

    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: { 
        companyId: true, 
        name: true,
        parentId: true,
      },
    });

    if (!currentRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== currentRole.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this role' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    if (parentId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: parentId },
        select: { 
          companyId: true,
          name: true,
        },
      });

      if (!parentRole) {
        return NextResponse.json(
          { error: 'Parent role not found' },
          { status: 404 }
        );
      }

      if (parentRole.companyId !== currentRole.companyId) {
        return NextResponse.json(
          { error: 'Parent role must be in the same company' },
          { status: 400 }
        );
      }

      const isCircular = await checkCircularReference(roleId, parentId);
      if (isCircular) {
        return NextResponse.json(
          { error: 'Cannot create circular hierarchy - the selected parent is a descendant of this role' },
          { status: 400 }
        );
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: { 
        parentId: parentId || null,
        updatedAt: new Date(),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role hierarchy updated successfully',
      data: {
        id: updatedRole.id,
        name: updatedRole.name,
        parentId: updatedRole.parentId,
        parent: updatedRole.parent,
        children: updatedRole.children,
        updatedAt: updatedRole.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating role parent:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid parent role reference' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id:roleId } = await params;

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: { 
        companyId: true, 
        name: true,
        parentId: true,
      },
    });

    if (!currentRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== currentRole.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this role' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    if (!currentRole.parentId) {
      return NextResponse.json(
        { error: 'Role has no parent to remove' },
        { status: 400 }
      );
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: { 
        parentId: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Parent relationship removed successfully',
      data: updatedRole,
    });

  } catch (error) {
    console.error('Error removing parent relationship:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

async function checkCircularReference(roleId, potentialParentId) {
  let currentId = potentialParentId;
  const visited = new Set([roleId]);

  while (currentId) {
    if (visited.has(currentId)) {
      return true;
    }
    visited.add(currentId);

    const role = await prisma.role.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!role) break;
    currentId = role.parentId;
  }

  return false;
}