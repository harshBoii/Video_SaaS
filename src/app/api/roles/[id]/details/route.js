import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    // 1. Verify JWT token
    const { employee, error, status } = await verifyJWT(request);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id:roleId } = await params;

    // 2. Validate roleId
    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // 3. Fetch role with all details
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            lastLogin: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' },
          ],
        },
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
                group: true,
              },
            },
          },
          orderBy: {
            permission: {
              group: 'asc',
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            employees: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // 4. Check if role exists
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // 5. Check if employee belongs to same company
    if (employee.companyId !== role.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this role' },
        { status: 403 }
      );
    }

    // 6. Check admin access
    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // 7. Group permissions by category
    const permissionsByGroup = {};
    role.permissions.forEach(rp => {
      const perm = rp.permission;
      const group = perm.group || 'Other';
      if (!permissionsByGroup[group]) {
        permissionsByGroup[group] = [];
      }
      permissionsByGroup[group].push(perm);
    });

    // 8. Transform response
    const response = {
      id: role.id,
      name: role.name,
      description: role.description,
      company: role.company,
      parent: role.parent,
      employees: role.employees.map(emp => ({
        ...emp,
        fullName: `${emp.firstName} ${emp.lastName}`,
      })),
      employeeCount: role.employees.length,
      permissions: role.permissions.map(rp => rp.permission),
      permissionsByGroup: permissionsByGroup,
      permissionCount: role.permissions.length,
      children: role.children.map(child => ({
        ...child,
        employeeCount: child.employees.length,
      })),
      childrenCount: role.children.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Error fetching role details:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
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
