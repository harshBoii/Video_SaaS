import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { companyId } = await params;
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (employee.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
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

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    // If campaignId is provided, filter out employees already assigned
    let availableEmployees = employees;
    
    if (campaignId) {
      const existingAssignments = await prisma.campaignAssignment.findMany({
        where: { campaignId },
        select: { employeeId: true },
      });

      const assignedEmployeeIds = new Set(existingAssignments.map(a => a.employeeId));
      availableEmployees = employees.filter(emp => !assignedEmployeeIds.has(emp.id));
    }

    // Transform response
    const transformedEmployees = availableEmployees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      role: emp.role,
      department: emp.department,
    }));

    return NextResponse.json({
      success: true,
      data: transformedEmployees,
    });

  } catch (error) {
    console.error('Error fetching available employees:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
