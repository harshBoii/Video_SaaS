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

    const { id:companyId } = await params;
    console.log (" looking for company :" , companyId)

    // 2. Validate companyId
    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    // 3. Check if employee belongs to this company
    if (employee.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this company' },
        { status: 403 }
      );
    }

    // 4. Check admin access
    // const adminError = requireAdmin(employee);
    // if (adminError) {
    //   return NextResponse.json(
    //     { error: adminError.error },
    //     { status: adminError.status }
    //   );
    // }

    // 5. Verify company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // 6. Fetch all roles with relations
    const roles = await prisma.role.findMany({
      where: { 
        companyId: companyId 
      },
      include: {
        // Include employees
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
        // Include permissions
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
        },
        // Include parent
        parent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        // Count children
        children: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { name: 'asc' },
      ],
    });

    // 7. Transform data for frontend
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      companyId: role.companyId,
      parentId: role.parentId,
      parent: role.parent,
      employees: role.employees,
      employeeCount: role.employees.length,
      permissions: role.permissions.map(rp => rp.permission),
      permissionCount: role.permissions.length,
      childrenCount: role.children.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedRoles,
      total: transformedRoles.length,
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Company not found' },
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
