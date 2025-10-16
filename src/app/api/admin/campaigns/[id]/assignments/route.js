import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = params;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists and belongs to employee's company
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
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

    // Fetch all assignments with employee and role details
    const assignments = await prisma.campaignAssignment.findMany({
      where: { campaignId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { role: { name: 'asc' } },
        { employee: { firstName: 'asc' } },
      ],
    });

    // Group assignments by role
    const groupedByRole = {};
    
    assignments.forEach(assignment => {
      const roleId = assignment.role.id;
      const roleName = assignment.role.name;

      if (!groupedByRole[roleId]) {
        groupedByRole[roleId] = {
          role: {
            id: assignment.role.id,
            name: assignment.role.name,
            description: assignment.role.description,
            parent: assignment.role.parent,
          },
          employees: [],
          count: 0,
        };
      }

      groupedByRole[roleId].employees.push({
        assignmentId: assignment.id,
        employee: {
          ...assignment.employee,
          fullName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        },
        joinedAt: assignment.joinedAt,
        note: assignment.note,
      });

      groupedByRole[roleId].count++;
    });

    // Convert to array and sort by role name
    const groupedArray = Object.values(groupedByRole).sort((a, b) => 
      a.role.name.localeCompare(b.role.name)
    );

    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaignId,
        campaignName: campaign.name,
        totalAssignments: assignments.length,
        totalRoles: groupedArray.length,
        assignmentsByRole: groupedArray,
      },
    });

  } catch (error) {
    console.error('Error fetching campaign assignments:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// POST - Assign members to campaign
export async function POST(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = params;
    const body = await request.json();
    const { employeeId, roleId, note } = body;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    if (!employeeId || typeof employeeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { companyId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
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

    // Verify employee exists and belongs to same company
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { 
        companyId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!targetEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (targetEmployee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Employee must belong to the same company as the campaign' },
        { status: 400 }
      );
    }

    // Verify role exists and belongs to same company
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (role.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Role must belong to the same company as the campaign' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.campaignAssignment.findUnique({
      where: {
        campaignId_employeeId: {
          campaignId: campaignId,
          employeeId: employeeId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Employee is already assigned to this campaign' },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.campaignAssignment.create({
      data: {
        campaignId,
        employeeId,
        roleId,
        note: note || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee assigned to campaign successfully',
      data: {
        assignmentId: assignment.id,
        employee: {
          ...assignment.employee,
          fullName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        },
        role: assignment.role,
        joinedAt: assignment.joinedAt,
        note: assignment.note,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign assignment:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Employee is already assigned to this campaign' },
        { status: 409 }
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
