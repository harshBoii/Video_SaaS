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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 2. Validate roleId
    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // 3. Validate pagination
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (1-100)' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter' },
        { status: 400 }
      );
    }

    // 4. Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true, name: true },
    });

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

    // 7. Build search filter
    const searchFilter = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // 8. Build status filter
    const statusWhere = statusFilter && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(statusFilter)
      ? { status: statusFilter }
      : {};

    // 9. Count total matching employees
    const totalCount = await prisma.employee.count({
      where: {
        roleId: roleId,
        ...searchFilter,
        ...statusWhere,
      },
    });

    // 10. Fetch employees
    const employees = await prisma.employee.findMany({
      where: {
        roleId: roleId,
        ...searchFilter,
        ...statusWhere,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        lastLogin: true,
        createdAt: true,
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
      take: limit,
      skip: offset,
    });

    // 11. Transform response
    const transformedEmployees = employees.map(emp => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
    }));

    return NextResponse.json({
      success: true,
      data: transformedEmployees,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        search: search || null,
        status: statusFilter || null,
      },
    });

  } catch (error) {
    console.error('Error searching employees:', error);
    
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
